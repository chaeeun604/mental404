import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../hooks/useAuth'
import { getUserSettings, upsertUserSettings } from '../api/userSettings'
import { scheduleSmartNotification, cancelAllNotifications } from '../api/notification'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'

export default function MyPageScreen({ navigation }: ScreenProps<'MyPage'>) {
  const { session, signOut } = useAuth()
  const username = session?.user?.email?.split('@')[0] ?? '별님'
  const [shootingStarNotif, setShootingStarNotif] = useState(false)
  const [reportNotif, setReportNotif] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    getUserSettings(session.user.id).then((s) => {
      if (s) setShootingStarNotif(s.notification_enabled ?? false)
    })
  }, [session?.user?.id])

  const handleShootingStarToggle = async (val: boolean) => {
    setShootingStarNotif(val)
    if (!session?.user?.id) return
    if (val) {
      await upsertUserSettings(session.user.id, { notification_enabled: true }).catch(() => {})
      await scheduleSmartNotification(session.user.id)
      Alert.alert('알림 설정', '추천 콘텐츠 알림이 켜졌어요.\n매일 별똥별이 도착하면 알려드릴게요.')
    } else {
      await cancelAllNotifications()
      await upsertUserSettings(session.user.id, { notification_enabled: false }).catch(() => {})
    }
  }

  const handleReportToggle = async (val: boolean) => {
    setReportNotif(val)
    if (val) {
      Alert.alert('알림 설정', '리포트 알림이 켜졌어요.\n새 리포트가 생성되면 알려드릴게요.')
    }
  }

  const handleSignOut = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          navigation.reset({ index: 0, routes: [{ name: 'Auth' }] })
        },
      },
    ])
  }

  const handleNotReady = () => {
    Alert.alert('준비 중', '아직 준비중이에요.\n조금만 기다려주세요!')
  }

  return (
    <LinearGradient colors={['#101640', '#080711']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>마이페이지</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile */}
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={Colors.textSecondary} />
            </View>
            <Text style={styles.username}>{username}님</Text>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>별똥별 도착 알림</Text>
                <Text style={styles.settingDesc}>추천 콘텐츠 알림을 보내드려요</Text>
              </View>
              <Switch
                value={shootingStarNotif}
                onValueChange={handleShootingStarToggle}
                trackColor={{ true: Colors.primary, false: Colors.surfaceBorder }}
                thumbColor={Colors.textPrimary}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>리포트 도착 알림</Text>
                <Text style={styles.settingDesc}>새 리포트가 생성되면 알려드려요</Text>
              </View>
              <Switch
                value={reportNotif}
                onValueChange={handleReportToggle}
                trackColor={{ true: Colors.primary, false: Colors.surfaceBorder }}
                thumbColor={Colors.textPrimary}
              />
            </View>
          </View>

          {/* Links */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.linkRow} onPress={handleNotReady}>
              <Text style={styles.linkLabel}>약관 및 정책</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.linkRow} onPress={handleNotReady}>
              <Text style={styles.linkLabel}>피드백 보내기</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* 로그아웃 */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>

          {/* 회원 탈퇴 */}
          <TouchableOpacity style={styles.withdrawBtn} onPress={handleNotReady}>
            <Text style={styles.withdrawText}>회원 탈퇴</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Pretendard-SemiBold',
    color: Colors.textPrimary,
  },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 40 },
  profileSection: { alignItems: 'flex-start', paddingVertical: 12, gap: 4 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 8,
  },
  username: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    color: Colors.textPrimary,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingInfo: { flex: 1, gap: 3 },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'Pretendard-Medium',
    color: Colors.textPrimary,
  },
  settingDesc: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textTertiary,
  },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  linkLabel: {
    fontSize: 15,
    fontFamily: 'Pretendard-Medium',
    color: Colors.textPrimary,
  },
  logoutBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: 'Pretendard-SemiBold',
  },
  withdrawBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  withdrawText: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontFamily: 'Pretendard-Regular',
  },
})