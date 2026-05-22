import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Dimensions,
} from 'react-native'
import { useEffect, useState } from 'react'
import { TagRow, ContentWithTags } from '../types/database'
import { useTags } from '../hooks/useTags'
import { useContents } from '../hooks/useContents'
import { getContentsByTag } from '../api/contents'
import { scheduleSmartNotification } from '../api/notification'

const { width: SW } = Dimensions.get('window')
const BLOB_W = Math.min(SW * 0.62, 248)

// 태그별 블롭 색상 (순환)
const BLOB_COLORS = ['#5b4ff0', '#7c3aed', '#be185d', '#0369a1', '#047857', '#b45309', '#6d28d9']

// 블롭 내부 플로팅 카드 위치 (blob 기준 absolute, 5개 슬롯)
const FLOAT_POS = [
  { top: 14,    left:  8 },
  { top: 14,    right: 8 },
  { top: 90,    left:  6 },
  { bottom: 14, left:  8 },
  { bottom: 14, right: 8 },
] as const

const C = {
  bg: '#0d0d1e', primary: '#7b6ef6',
  text: '#ffffff', textSec: '#8888bb', border: '#252540',
  card: 'rgba(255,255,255,0.18)', banner: 'rgba(123,110,246,0.28)',
}

export default function HomeScreen({ navigation, route }: any) {
  // ── 로직 영역 ──────────────────────────────────────────────
  const { userId, email } = route.params
  const username = (email as string)?.split('@')[0] ?? '사용자'

  const { tags, loading: tagsLoading } = useTags(userId)
  const { recommendation, loadRecommendation } = useContents(userId)

  const [tagIndex, setTagIndex] = useState(0)
  const [tagContents, setTagContents] = useState<ContentWithTags[]>([])
  const [contentsLoading, setContentsLoading] = useState(false)

  useEffect(() => {
    loadRecommendation()
    scheduleSmartNotification(userId).catch(console.error)
  }, [])

  useEffect(() => {
    const tag: TagRow | undefined = tags[tagIndex]
    if (!tag) return
    setContentsLoading(true)
    getContentsByTag(tag.id)
      .then(data => setTagContents(data))
      .catch(console.error)
      .finally(() => setContentsLoading(false))
  }, [tagIndex, tags])

  const currentTag = tags[tagIndex]
  const blobColor  = BLOB_COLORS[tagIndex % BLOB_COLORS.length]

  // 5개 초과 시: 앞 4개 카드 + +N 버튼
  const showExtra      = tagContents.length > 5
  const displayCards   = showExtra ? tagContents.slice(0, 4) : tagContents.slice(0, 5)
  const extraCount     = showExtra ? tagContents.length - 4 : 0
  // ──────────────────────────────────────────────────────────

  return (
    <View style={s.container}>
      {/* 헤더 */}
      <View style={s.header}>
        <Text style={s.username}>{username}님의 우주</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyPage', { userId, email })}>
          <Text style={s.myPageIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* 별똥별 배너 */}
      {recommendation ? (
        <TouchableOpacity
          style={s.banner}
          onPress={() => navigation.navigate('ShootingStar', { contentId: recommendation.id, userId })}
        >
          <Text style={s.bannerText}>＋ 오늘의 별똥별이 도착하였어요.</Text>
          <Text style={s.bannerArrow}>›</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.bannerEmpty} />
      )}

      {/* 블롭 + 플로팅 카드 */}
      {tagsLoading ? (
        <View style={s.blobArea}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : (
        <View style={s.blobArea}>
          {/* 블롭 — 카드들의 부모 컨테이너 */}
          <View style={[s.blob, { backgroundColor: blobColor, width: BLOB_W, height: BLOB_W }]}>
            {contentsLoading ? (
              <ActivityIndicator color="rgba(255,255,255,0.5)" />
            ) : (
              <>
                {displayCards.map((item, i) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.floatCard, FLOAT_POS[i] as any]}
                    onPress={() => navigation.navigate('ContentDetail', { contentId: item.id, userId })}
                    activeOpacity={0.8}
                  >
                    {item.type === 'image' && item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={s.floatImg} />
                    ) : (
                      <Text style={s.floatText} numberOfLines={3}>{item.body}</Text>
                    )}
                  </TouchableOpacity>
                ))}

                {/* +N 버튼 */}
                {extraCount > 0 && (
                  <TouchableOpacity
                    style={[s.floatCard, s.floatCardExtra, FLOAT_POS[4] as any]}
                    onPress={() => navigation.navigate('Browse', {
                      userId, email,
                      tagId: currentTag?.id,
                      tagName: currentTag?.name,
                      recommendationId: recommendation?.id,
                    })}
                    activeOpacity={0.8}
                  >
                    <Text style={s.floatExtraText}>+{extraCount}개</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* 기록 없을 때 */}
            {!contentsLoading && tagContents.length === 0 && (
              <Text style={s.blobEmpty}>별을 담아봐요 ✦</Text>
            )}
          </View>
        </View>
      )}

      {/* 태그 네비게이션 */}
      <View style={s.tagNav}>
        <TouchableOpacity
          onPress={() => setTagIndex(i => Math.max(0, i - 1))}
          disabled={tagIndex === 0}
          style={s.tagNavBtn}
        >
          <Text style={[s.tagNavArrow, tagIndex === 0 && s.tagNavArrowDim]}>‹</Text>
        </TouchableOpacity>
        <Text style={s.tagNavLabel}>{currentTag?.name ?? ''}</Text>
        <TouchableOpacity
          onPress={() => setTagIndex(i => Math.min(tags.length - 1, i + 1))}
          disabled={tagIndex >= tags.length - 1}
          style={s.tagNavBtn}
        >
          <Text style={[s.tagNavArrow, tagIndex >= tags.length - 1 && s.tagNavArrowDim]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 네비게이션 */}
      <View style={s.bottomNav}>
        <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('Report', { userId, email })}>
          <Text style={s.navIcon}>⟁</Text>
          <Text style={s.navLabel}>리포트</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem}>
          <Text style={[s.navIcon, s.navActive]}>◎</Text>
          <Text style={[s.navLabel, s.navLabelActive]}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.navItem} onPress={() => navigation.navigate('Browse', { userId, email, recommendationId: recommendation?.id })}>
          <Text style={s.navIcon}>≡</Text>
          <Text style={s.navLabel}>우주</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.createBtn}
          onPress={() => navigation.navigate('Create', { userId, email })}
        >
          <Text style={s.createBtnText}>＋</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 54, paddingBottom: 12,
  },
  username: { color: C.text, fontSize: 18, fontWeight: '700' },
  myPageIcon: { fontSize: 20, opacity: 0.7 },
  banner: {
    marginHorizontal: 20, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13,
    backgroundColor: C.banner, borderWidth: 1, borderColor: C.primary,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 4,
  },
  bannerText: { color: C.text, fontSize: 13 },
  bannerArrow: { color: C.textSec, fontSize: 18 },
  bannerEmpty: { height: 16 },
  // 블롭 영역
  blobArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  blob: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 110,
    borderTopRightRadius: 130,
    borderBottomLeftRadius: 130,
    borderBottomRightRadius: 110,
    opacity: 0.85,
  },
  floatCard: {
    position: 'absolute',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 10,
    maxWidth: 130,
  },
  floatText: { color: C.text, fontSize: 11, lineHeight: 16 },
  floatImg: { width: 80, height: 64, borderRadius: 8, resizeMode: 'cover' },
  floatCardExtra: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatExtraText: { color: C.text, fontSize: 14, fontWeight: '700' },
  blobEmpty: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  // 태그 네비게이션
  tagNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 16,
  },
  tagNavBtn: { padding: 8 },
  tagNavArrow: { color: C.text, fontSize: 26 },
  tagNavArrowDim: { opacity: 0.2 },
  tagNavLabel: { color: C.text, fontSize: 14, flex: 1, textAlign: 'center' },
  // 하단 네비
  bottomNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12,
    borderTopWidth: 1, borderColor: C.border,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navIcon: { color: C.textSec, fontSize: 20 },
  navActive: { color: C.primary },
  navLabel: { color: C.textSec, fontSize: 10 },
  navLabelActive: { color: C.primary },
  createBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  createBtnText: { color: C.text, fontSize: 26, lineHeight: 30 },
})
