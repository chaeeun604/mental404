import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Dimensions,
} from 'react-native'
import { useEffect, useState } from 'react'
import { getContentById } from '../api/contents'
import { ContentWithTags } from '../types/database'

const { width: SW } = Dimensions.get('window')

const C = {
  bg: '#0b0b1a', card: '#161628', primary: '#7b6ef6',
  text: '#ffffff', textSec: '#8888bb', border: '#252540',
  tagBg: 'rgba(123,110,246,0.32)', memoBg: '#1c1c34',
}

export default function ShootingStarScreen({ navigation, route }: any) {
  // ── 로직 영역 ──────────────────────────────────────────────
  const { contentId, userId } = route.params
  const [content, setContent] = useState<ContentWithTags | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    getContentById(contentId)
      .then(setContent)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const dateDisplay = `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`

  const createdAt = content?.created_at ? new Date(content.created_at) : null
  const createdLabel = createdAt
    ? `${createdAt.getMonth() + 1}월 ${createdAt.getDate()}일`
    : ''

  const tags = content?.content_tags?.map(ct => ct.tags) ?? []
  // ──────────────────────────────────────────────────────────

  return (
    <View style={s.container}>
      {/* 배경 별 장식 */}
      <View style={s.starDot1} />
      <View style={s.starDot2} />
      <View style={s.starDot3} />
      <View style={s.starDot4} />

      {/* X 버튼 */}
      <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={s.closeText}>×</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={C.primary} style={s.loader} />
      ) : !revealed ? (
        /* ── 미스터리 박스 상태 ── */
        <View style={s.mysteryContainer}>
          <Text style={s.mysteryTitle}>오늘은 어떤 별이{'\n'}떨어졌을까요?</Text>
          <Text style={s.mysterySub}>기록한 별 중 하나가 매일 랜덤으로 떨어져요.</Text>

          <TouchableOpacity style={s.mysteryBox} onPress={() => setRevealed(true)} activeOpacity={0.75}>
            <Text style={s.questionMark}>?</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── 공개된 콘텐츠 상태 ── */
        <View style={s.revealContainer}>
          {/* 픽셀 날짜 */}
          <Text style={s.pixelDate}>{dateDisplay}</Text>

          {/* 태그 칩 */}
          {tags.length > 0 && (
            <View style={s.tagsRow}>
              {tags.map(tag => (
                <View key={tag.id} style={s.tagChip}>
                  <Text style={s.tagText}>{tag.emoji} {tag.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* 콘텐츠 본문 */}
          {content?.type === 'image' && content.image_url ? (
            <Image source={{ uri: content.image_url }} style={s.contentImage} />
          ) : (
            <Text style={s.contentBody}>{content?.body}</Text>
          )}

          {/* 메모 박스 */}
          {!!content?.memo && (
            <View style={s.memoBox}>
              <Text style={s.memoText}>{content.memo}</Text>
            </View>
          )}

          {/* 저장 날짜 */}
          {!!createdLabel && (
            <View style={s.dateRow}>
              <Text style={s.dateIcon}>🕐</Text>
              <Text style={s.dateText}>{createdLabel}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loader: { flex: 1 },

  // 배경 별 장식
  starDot1: { position: 'absolute', top: 80,  left: 30,  width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  starDot2: { position: 'absolute', top: 180, right: 50, width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  starDot3: { position: 'absolute', top: 320, left: 60,  width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  starDot4: { position: 'absolute', bottom: 200, right: 40, width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },

  closeBtn: { position: 'absolute', top: 54, right: 22, zIndex: 10, padding: 8 },
  closeText: { color: C.textSec, fontSize: 26 },

  // ── 미스터리 박스 ──
  mysteryContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  mysteryTitle: {
    color: C.text, fontSize: 24, fontWeight: '700', textAlign: 'center', lineHeight: 34,
    marginBottom: 12,
  },
  mysterySub: {
    color: C.textSec, fontSize: 13, textAlign: 'center', marginBottom: 52,
  },
  mysteryBox: {
    width: SW * 0.58,
    height: SW * 0.58,
    backgroundColor: C.card,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  questionMark: { color: 'rgba(255,255,255,0.35)', fontSize: 64, fontWeight: '300' },

  // ── 공개된 콘텐츠 ──
  revealContainer: {
    flex: 1, paddingHorizontal: 28, paddingTop: 100, paddingBottom: 40,
  },
  pixelDate: {
    color: C.text,
    fontSize: 48,
    fontFamily: 'Courier New',
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 24,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  tagChip: {
    backgroundColor: C.tagBg, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  tagText: { color: C.text, fontSize: 13 },
  contentImage: { width: '100%', height: 200, borderRadius: 14, resizeMode: 'cover', marginBottom: 20 },
  contentBody: {
    color: C.text, fontSize: 17, lineHeight: 28, marginBottom: 28,
  },
  memoBox: {
    backgroundColor: C.memoBg, borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 16, marginBottom: 24,
  },
  memoText: { color: C.textSec, fontSize: 14, lineHeight: 22 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateIcon: { fontSize: 13 },
  dateText: { color: C.textSec, fontSize: 13 },
})
