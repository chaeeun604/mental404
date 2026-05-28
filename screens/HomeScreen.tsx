import { useState, useEffect, useCallback, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
  Modal,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as SecureStore from 'expo-secure-store'
import { useAuth } from '../hooks/useAuth'
import { useTags } from '../hooks/useTags'
import { getAllContents } from '../api/contents'
import PlanetGraphic from '../components/PlanetGraphic'
import ContentBubble from '../components/ContentBubble'
import GNB from '../components/GNB'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'
import type { ContentWithTags } from '../types/database'

const TUTORIAL_KEY = 'morbit_home_tutorial_seen'

async function hasTutorialSeen(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return localStorage.getItem(TUTORIAL_KEY) === 'true'
    return (await SecureStore.getItemAsync(TUTORIAL_KEY)) === 'true'
  } catch { return false }
}

async function markTutorialSeen(): Promise<void> {
  try {
    if (Platform.OS === 'web') localStorage.setItem(TUTORIAL_KEY, 'true')
    else await SecureStore.setItemAsync(TUTORIAL_KEY, 'true')
  } catch {}
}

const { width } = Dimensions.get('window')
const PLANET_SIZE = 220

// Bubble positions around the planet — matched to Figma layout
// Planet (220px) centered in container (360×320), planet center = (180, 160)
const BUBBLE_POSITIONS: Array<{ top?: number; bottom?: number; left?: number; right?: number }> = [
  { top: 16,  left: 14  }, // 상단 왼쪽
  { top: 52,  right: 8  }, // 상단 오른쪽
  { top: 82,  left: 4   }, // 중단 왼쪽 (이미지)
  { top: 112, left: 72  }, // 중앙 아래
  { top: 220, left: 14  }, // 하단 왼쪽
]

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

export default function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { session } = useAuth()
  const userId = session?.user?.id ?? ''
  const username = session?.user?.email?.split('@')[0] ?? '별님'
  const { tags, loading: tagsLoading } = useTags(userId)
  const [contents, setContents] = useState<ContentWithTags[]>([])
  const [contentsLoading, setContentsLoading] = useState(true)
  const [activeTab, setActiveTab]     = useState<'report' | 'graphic' | 'list'>('graphic')
  const [currentTagIdx, setCurrentTagIdx] = useState(0)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [showTutorial, setShowTutorial]   = useState(false)

  const loadContents = useCallback(() => {
    if (!userId) return
    setContentsLoading(true)
    getAllContents(userId)
      .then(setContents)
      .catch(() => {})
      .finally(() => setContentsLoading(false))
  }, [userId])

  // 화면 포커스 시 항상 리로드 (삭제 후 복귀 등)
  useFocusEffect(
    useCallback(() => {
      loadContents()
    }, [loadContents])
  )

  // Show tutorial on first home visit
  useEffect(() => {
    hasTutorialSeen().then(seen => { if (!seen) setShowTutorial(true) })
  }, [])

  const currentTag = tags[currentTagIdx] ?? null

  const tagContents = currentTag
    ? contents.filter((c) => c.content_tags?.some((ct) => ct.tag_id === currentTag.id))
    : []

  const listContents = selectedTagId
    ? contents.filter((c) => c.content_tags?.some((ct) => ct.tag_id === selectedTagId))
    : contents

  const goLeft = () => {
    if (tags.length === 0) return
    setCurrentTagIdx((prev) => (prev - 1 + tags.length) % tags.length)
  }

  const goRight = () => {
    if (tags.length === 0) return
    setCurrentTagIdx((prev) => (prev + 1) % tags.length)
  }

  const renderGraphicView = () => {
    if (tagsLoading || contentsLoading) {
      return (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )
    }

    if (tags.length === 0) {
      return (
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyText}>+ 버튼으로 첫 번째{'\n'}별을 기록해보세요.</Text>
        </View>
      )
    }

    const MAX_SHOWN = 5
    const shownCards = tagContents.slice(0, MAX_SHOWN)
    const totalCount = tagContents.length
    const hasOverflow = totalCount > MAX_SHOWN

    return (
      <View style={styles.graphicArea}>
        {/* Planet container — planet centered, bubbles float around it */}
        <View style={styles.planetContainer}>
          {/* Centered planet */}
          <View style={styles.planetCenter}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                if (tagContents.length > 0) {
                  navigation.navigate('ContentDetail', { contentId: tagContents[0].id })
                }
              }}
            >
              <PlanetGraphic tagIndex={currentTagIdx} size={PLANET_SIZE} />
            </TouchableOpacity>
          </View>

          {/* Floating content bubbles */}
          {shownCards.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.bubble, BUBBLE_POSITIONS[idx]]}
              onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
              activeOpacity={0.8}
            >
              <ContentBubble item={item} />
            </TouchableOpacity>
          ))}

          {/* Overflow badge — 총 개수 표시 */}
          {hasOverflow && (
            <TouchableOpacity
              style={styles.overflowBadge}
              onPress={() => {
                setSelectedTagId(currentTag?.id ?? null)
                setActiveTab('list')
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#3B21FB', '#AEF1FF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.overflowGradient}
              >
                <Text style={styles.overflowText}>+{totalCount}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Arrow navigation */}
        <View style={styles.arrowRow}>
          <TouchableOpacity style={styles.arrowBtn} onPress={goLeft}>
            <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.arrowLabel}>{currentTag?.name ?? ''}</Text>
          <TouchableOpacity style={styles.arrowBtn} onPress={goRight}>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderListCard = (item: ContentWithTags) => {
    const dateStr = new Date(item.created_at).toLocaleDateString('ko-KR', {
      month: 'long', day: 'numeric',
    })

    if (item.type === 'image' && item.image_url) {
      // Figma: full-width image card with dark overlay, date at bottom-left
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.listCardImage}
          onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
          activeOpacity={0.85}
        >
          <Image source={{ uri: item.image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          <View style={styles.listCardOverlay} />
          <View style={styles.listDateRow}>
            <Ionicons name="time-outline" size={16} color="#9A9FB3" />
            <Text style={styles.listDate}>{dateStr}</Text>
          </View>
        </TouchableOpacity>
      )
    }

    // Figma: text card with #2d3052 bg, text + date
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.listCardText}
        onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
        activeOpacity={0.85}
      >
        <Text style={styles.listBody} numberOfLines={2}>
          {item.body ? truncate(item.body, 80) : ''}
        </Text>
        <View style={styles.listDateRow}>
          <Ionicons name="time-outline" size={16} color="#9A9FB3" />
          <Text style={styles.listDate}>{dateStr}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const renderListView = () => (
    <View style={styles.flex}>
      {/* Tag filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagChipsRow}
        style={styles.tagChipsScroll}
      >
        {tags.map((tag) => {
          const isActive = selectedTagId === tag.id
          return (
            <TouchableOpacity
              key={tag.id}
              style={[styles.tagChip, isActive && styles.tagChipActive]}
              onPress={() => setSelectedTagId(isActive ? null : tag.id)}
            >
              <Text style={[styles.tagChipText, isActive && styles.tagChipTextActive]}>
                {tag.name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <Text style={styles.totalCount}>전체 {listContents.length}</Text>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {contentsLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : listContents.length === 0 ? (
          <Text style={styles.emptyText}>아직 기록이 없어요.</Text>
        ) : (
          listContents.map(item => renderListCard(item))
        )}
      </ScrollView>
    </View>
  )

  const dismissTutorial = () => {
    setShowTutorial(false)
    markTutorialSeen()
  }

  return (
    <LinearGradient colors={Colors.bgHomeGradient} style={styles.flex}>
      {/* First-visit tutorial overlay */}
      <Modal visible={showTutorial} transparent animationType="fade">
        <View style={styles.tutorialOverlay}>
          <View style={styles.tutorialCard}>
            <Text style={styles.tutorialTitle}>✦ MORBIT에 오신 걸 환영해요!</Text>
            <Text style={styles.tutorialBody}>
              {'기록한 별들이 행성 주위에 떠올라요.\n< > 버튼으로 감정 태그를 바꾸고\n하단 ≡ 버튼으로 전체 목록을 볼 수 있어요.'}
            </Text>
            <TouchableOpacity style={styles.tutorialBtn} onPress={dismissTutorial}>
              <Text style={styles.tutorialBtnText}>알겠어요 ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header — title centered, profile icon right */}
          <View style={styles.header}>
            <View style={{ width: 36 }} />
            <Text style={styles.headerTitle}>{username}님의 우주</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('MyPage')}
              style={styles.profileBtn}
            >
              <Ionicons name="person-circle-outline" size={32} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Daily star banner */}
          <TouchableOpacity
            style={styles.banner}
            onPress={() => navigation.navigate('ShootingStar')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#3B21FB', '#AEF1FF']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.bannerGradient}
            >
              <Text style={styles.bannerText}>✦ 오늘의 별똥별이 도착했어요.</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textPrimary} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Content area */}
          <View style={styles.flex}>
            {activeTab === 'graphic' ? renderGraphicView() : renderListView()}
          </View>
        </SafeAreaView>

        <GNB
          activeTab={activeTab === 'report' ? 'report' : activeTab}
          onReport={() => navigation.navigate('Report')}
          onGraphic={() => setActiveTab('graphic')}
          onList={() => setActiveTab('list')}
          onCreate={() => navigation.navigate('Create')}
        />
    </LinearGradient>
  )
}

// Remove unused View import reference - LinearGradient is the root now
const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  profileBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  banner: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 11,
    overflow: 'hidden',
  },
  bannerGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  bannerText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingTop: 40,
  },
  graphicArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    gap: 20,
  },
  planetContainer: {
    width: 360,
    height: 320,
    position: 'relative',
  },
  planetCenter: {
    position: 'absolute',
    top: (320 - PLANET_SIZE) / 2,
    left: (360 - PLANET_SIZE) / 2,
  },
  bubble: {
    position: 'absolute',
  },
  overflowBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  overflowGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    fontSize: 14,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-SemiBold',
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  arrowBtn: { padding: 8 },
  arrowLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
    minWidth: 130,
    textAlign: 'center',
  },
  tagChipsScroll: { flexShrink: 0 },
  tagChipsRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagChip: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 50,
    backgroundColor: '#2d3052',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagChipActive: { backgroundColor: Colors.primary },
  tagChipText:       { fontSize: 14, color: '#fbfcfe', fontFamily: 'Pretendard-Regular' },
  tagChipTextActive: { fontFamily: 'Pretendard-Medium' },
  totalCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 20,
    paddingBottom: 8,
    fontFamily: 'Pretendard-Medium',
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },

  // Image card: full-width, image fills card, overlay + date bottom-left
  listCardImage: {
    height: 80,
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 16,
  },
  listCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 15,
  },
  // Text card: #2d3052 bg, padded
  listCardText: {
    backgroundColor: '#2d3052',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  listBody:    { fontSize: 14, color: '#fbfcfe', lineHeight: 20, fontFamily: 'Pretendard-Medium' },
  listDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listDate:    { fontSize: 12, color: '#9A9FB3', fontFamily: 'Pretendard-Regular' },

  // Tutorial overlay
  tutorialOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  tutorialCard: {
    backgroundColor: '#fbfcfe',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    gap: 16,
    alignItems: 'center',
  },
  tutorialTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#1A1C20',
    textAlign: 'center',
  },
  tutorialBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
  },
  tutorialBtn: {
    backgroundColor: '#534dfc',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 4,
  },
  tutorialBtnText: {
    color: '#fbfcfe',
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
  },
})