import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { supabase } from '../lib/supabase'
import { upsertUserSettings, getUserSettings } from './userSettings'

//추가. 알림을 '전달'하는 함수
// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────

/** 디폴트 알림 시간 (오후 6시) */
const DEFAULT_NOTIFICATION_HOUR = 18

/** 이 개수 이상 열람 기록이 쌓이면 자동 조정 시작 */
const AUTO_ADJUST_THRESHOLD = 20

/**
 * 날짜 기준 가중치
 * - 최근 데이터일수록 높은 가중치 부여
 * - 오래된 데이터가 패턴을 왜곡하지 않도록
 */
const WEIGHTS = [
  { maxDaysAgo: 3, weight: 3 },   // 0~3일 전: 가중치 3
  { maxDaysAgo: 7, weight: 2 },   // 4~7일 전: 가중치 2
  { maxDaysAgo: 14, weight: 1 },  // 8~14일 전: 가중치 1
]

// ─────────────────────────────────────────────
// 알림 권한 요청
// ─────────────────────────────────────────────

/**
 * 앱 최초 실행 시 호출
 * 알림 권한을 요청하고 허용 여부를 반환
 */
export async function registerForPushNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false

  const { status: existingStatus } = await Notifications.getPermissionsAsync()

  if (existingStatus === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// ─────────────────────────────────────────────
// 가중치 계산
// ─────────────────────────────────────────────

/**
 * view_logs 기반으로 가중치를 적용해 피크 시간대를 계산
 *
 * 계산 방식:
 * 1. 각 열람 기록의 날짜를 기준으로 가중치 결정
 * 2. 시간대별로 가중치 점수 합산
 * 3. 가장 높은 점수의 시간대 반환
 *
 * 예시:
 *   22시 기록: 2일 전(가중치3) + 10일 전(가중치1) → 22시 점수 = 4
 *   21시 기록: 1일 전(가중치3) + 3일 전(가중치3) → 21시 점수 = 6  ← 채택
 */
export async function getWeightedPeakHour(userId: string): Promise<number | null> {
  const since = new Date()
  since.setDate(since.getDate() - 14)

  const { data, error } = await supabase
    .from('view_logs')
    .select('viewed_at')
    .eq('user_id', userId)
    .gte('viewed_at', since.toISOString())
  if (error) throw error
  if (!data || data.length < AUTO_ADJUST_THRESHOLD) return null

  const now = new Date()
  const hourScores: Record<number, number> = {}

  for (const row of data) {
    const viewedAt = new Date(row.viewed_at as string)
    const daysAgo = Math.floor((now.getTime() - viewedAt.getTime()) / (1000 * 60 * 60 * 24))
    const hour = viewedAt.getHours()

    // 해당 기록의 날짜에 맞는 가중치 찾기
    const matched = WEIGHTS.find((w) => daysAgo <= w.maxDaysAgo)
    const weight = matched ? matched.weight : 0 // 14일 초과는 무시

    if (weight === 0) continue
    hourScores[hour] = (hourScores[hour] ?? 0) + weight
  }

  if (Object.keys(hourScores).length === 0) return null

  // 가장 높은 점수의 시간대 반환
  const peak = Object.entries(hourScores).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
  return peak ? parseInt(peak[0]) : null
}

// ─────────────────────────────────────────────
// 핵심: 스마트 알림 스케줄링
// ─────────────────────────────────────────────

/**
 * 알림 시간을 결정하고 스케줄링
 *
 * 흐름:
 * 1. 사용자 설정 조회
 * 2. notification_enabled가 false면 알림 취소 후 종료
 * 3. auto_adjust가 true면 가중치 계산 시도
 * 4. 가중치 계산 성공(데이터 충분) → 피크 시간으로 설정
 * 5. 가중치 계산 실패(데이터 부족) → 디폴트 시간(18시) 사용
 * 6. 매일 반복 알림 스케줄링 + DB에 최종 시간 저장
 */
export async function scheduleSmartNotification(userId: string): Promise<void> {
  if (Platform.OS === 'web') return

  const granted = await registerForPushNotifications()
  if (!granted) return

  const settings = await getUserSettings(userId)

  // 알림 비활성화 상태면 모두 취소하고 종료
  if (settings && settings.notification_enabled === false) {
    await cancelAllNotifications()
    return
  }

  let notificationHour = DEFAULT_NOTIFICATION_HOUR
  let autoAdjusted = false

  // auto_adjust가 켜져 있거나 설정이 없는 초기 상태
  if (!settings || settings.auto_adjust !== false) {
    const peakHour = await getWeightedPeakHour(userId)

    if (peakHour !== null) {
      // 데이터 충분 → 피크 시간으로 자동 조정
      notificationHour = peakHour
      autoAdjusted = true
    }
    // 데이터 부족 → 디폴트(18시) 유지
  } else {
    // auto_adjust가 꺼져 있으면 사용자가 수동으로 설정한 시간 사용
    if (settings.notification_time) {
      notificationHour = parseInt(settings.notification_time.split(':')[0])
    }
  }

  // 기존 알림 모두 취소 후 새로 스케줄링
  await cancelAllNotifications()

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '오늘의 콘텐츠가 기다리고 있어요 🌿',
      body: '잠깐, 나를 위한 시간을 가져볼까요?',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: notificationHour,
      minute: 0,
    },
  })

  // 최종 결정된 시간을 DB에 저장
  await upsertUserSettings(userId, {
    notification_enabled: true,
    notification_time: `${String(notificationHour).padStart(2, '0')}:00`,
    auto_adjust: autoAdjusted,
  })
}

// ─────────────────────────────────────────────
// 알림 취소
// ─────────────────────────────────────────────

/**
 * 예약된 알림 전체 취소
 * 알림 끄기 또는 재스케줄링 전에 호출
 */
export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return
  await Notifications.cancelAllScheduledNotificationsAsync()
}