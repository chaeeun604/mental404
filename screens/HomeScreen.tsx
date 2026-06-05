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
  PanResponder,
  Animated,
  type ScrollView as ScrollViewType,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as SecureStore from 'expo-secure-store'
import { useAuth } from '../hooks/useAuth'
import { useTags } from '../hooks/useTags'
import { getAllContents } from '../api/contents'
import PlanetGraphic from '../components/PlanetGraphic'
import StarField from '../components/StarField'
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
const PLANET_SIZE = 290

// 버블 위치 — 행성 위에 고르게 분포 (피그마 기준)
// 컨테이너: 전체 너비 × 380px, 행성(290px) 중앙 배치
const BUBBLE_POSITIONS: Array<{ top?: number; bottom?: number; left?: number; right?: number }> = [
  { top: 55,  left: Math.round(width * 0.15) },  // 상단 왼쪽
  { top: 88,  left: Math.round(width * 0.52) },  // 상단 오른쪽
  { top: 155, left: Math.round(width * 0.10) },  // 중단 왼쪽 (이미지)
  { top: 200, left: Math.round(width * 0.53) },  // 중단 오른쪽
  { top: 268, left: Math.round(width * 0.16) },  // 하단 왼쪽
]

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

export default function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { session } = useAuth()
  const userId = session?.user?.id ?? ''
  const username = session?.user?.user_metadata?.full_name
    ?? session?.user?.user_metadata?.name
    ?? session?.user?.email?.split('@')[0]
    ?? '별님'
  const { tags, loading: tagsLoading } = useTags(userId)
  const [contents, setContents] = useState<ContentWithTags[]>([])
  const [contentsLoading, setContentsLoading] = useState(true)
  const [activeTab, setActiveTab]     = useState<'report' | 'graphic' | 'list'>('graphic')
  const [currentTagIdx, setCurrentTagIdx] = useState(0)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [tutorialStep, setTutorialStep] = useState<0 | 1 | 2>(0)
  const listScrollRef = useRef<ScrollViewType>(null)

  const loadContents = useCallback(() => {
    if (!userId) return
    setContentsLoading(true)
    getAllContents(userId)
      .then(setContents)
      .catch(() => {})
      .finally(() => setContentsLoading(false))
  }, [userId])

  // 화면 포커스 시 항상 리로드, 리스트뷰면 최상단으로
  useFocusEffect(
    useCallback(() => {
      loadContents()
      if (activeTab === 'list') {
        listScrollRef.current?.scrollTo({ y: 0, animated: false })
      }
    }, [loadContents, activeTab])
  )

  // 홈 최초 진입 시 튜토리얼
  useEffect(() => {
    hasTutorialSeen().then(seen => { if (!seen) setTutorialStep(1) })
  }, [])

  const currentTag = tags[currentTagIdx] ?? null

  const tagContents = currentTag
    ? contents.filter((c) => c.content_tags?.some((ct) => ct.tag_id === currentTag.id))
    : []

  const listContents = selectedTagId
    ? contents.filter((c) => c.content_tags?.some((ct) => ct.tag_id === selectedTagId))
    : contents

  const planetX = useRef(new Animated.Value(0)).current

  const switchPlanet = (direction: 'left' | 'right') => {
    if (tags.length <= 1) return
    const outX = direction === 'right' ? -width : width
    const inX  = direction === 'right' ?  width : -width

    Animated.timing(planetX, { toValue: outX, duration: 220, useNativeDriver: true }).start(() => {
      setCurrentTagIdx(prev =>
        direction === 'right'
          ? (prev + 1) % tags.length
          : (prev - 1 + tags.length) % tags.length
      )
      planetX.setValue(inX)
      Animated.timing(planetX, { toValue: 0, duration: 220, useNativeDriver: true }).start()
    })
  }

  const goLeft  = () => switchPlanet('left')
  const goRight = () => switchPlanet('right')

  // PanResponder는 mount 시 한 번만 생성되므로 ref로 최신 함수 유지
  const goLeftRef  = useRef(goLeft)
  const goRightRef = useRef(goRight)
  useEffect(() => {
    goLeftRef.current  = goLeft
    goRightRef.current = goRight
  })

  // 스와이프 제스처 (행성 영역)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 15 && Math.abs(g.dy) < 40,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) goRightRef.current()
        else if (g.dx > 50) goLeftRef.current()
      },
    })
  ).current

  // 리스트뷰 진입 시 현재 그래픽 태그 기본 선택
  const switchToList = () => {
    if (selectedTagId === null && tags.length > 0) {
      setSelectedTagId(currentTag?.id ?? tags[0].id)
    }
    setActiveTab('list')
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
        {/* Planet container — planet centered, bubbles float around it, swipe to change tag */}
        <View style={styles.planetContainer} {...panResponder.panHandlers}>
          <Animated.View style={[styles.planetSlide, { transform: [{ translateX: planetX }] }]}>
            {/* Centered planet */}
            <TouchableOpacity
              style={styles.planetCenter}
              activeOpacity={0.9}
              onPress={() => {
                if (tagContents.length > 0) {
                  navigation.navigate('ContentDetail', { contentId: tagContents[0].id })
                }
              }}
            >
              <PlanetGraphic tagIndex={currentTagIdx} size={PLANET_SIZE} />
            </TouchableOpacity>

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
          </Animated.View>
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

    const imageUrl = item.image_url && !item.image_url.startsWith('blob:') ? item.image_url : null
    if (item.type === 'image' && imageUrl) {
      // Figma: full-width image card with dark overlay, date at bottom-left
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.listCardImage}
          onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
          activeOpacity={0.85}
        >
          <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          <View style={styles.listCardOverlay} />
          <View style={styles.listDateRow}>
            <Ionicons name="time-outline" size={16} color="#9A9FB3" />
            <Text style={styles.listDate}>{dateStr}</Text>
          </View>
        </TouchableOpacity>
      )
    }
    if (item.type === 'image' && !imageUrl) {
      // blob: URL이거나 없는 경우 텍스트 카드로 폴백
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.listCardText}
          onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
          activeOpacity={0.85}
        >
          <Ionicons name="image-outline" size={20} color="#9A9FB3" />
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

  const renderListView = () => {
    return (
      <ScrollView
        ref={listScrollRef}
        style={styles.flex}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {contentsLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : listContents.length === 0 ? (
          <View style={styles.emptyCenter}>
            <Text style={styles.emptyText}>이 태그에 기록이 없어요.{'\n'}+ 버튼으로 추가해보세요.</Text>
          </View>
        ) : (
          listContents.map(item => renderListCard(item))
        )}
      </ScrollView>
    )
  }

  const advanceTutorial = () => {
    if (tutorialStep === 1) {
      setTutorialStep(2)
    } else {
      setTutorialStep(0)
      markTutorialSeen()
    }
  }

  return (
    <LinearGradient colors={Colors.bgHomeGradient} style={styles.flex}>
      {/* 별 배경 */}
      <StarField />

      {/* 튜토리얼 오버레이 (2단계) */}
      {tutorialStep > 0 && (
        <TouchableOpacity
          style={styles.tutorialOverlay}
          onPress={advanceTutorial}
          activeOpacity={1}
        >
          {tutorialStep === 1 && (
            <View style={styles.tooltip1}>
              <Text style={styles.tooltipText}>
                {'기록한 별은 마음의 자산이 되어\n항상 우리 곁에 떠 있어요.'}
              </Text>
            </View>
          )}
          {tutorialStep === 2 && (
            <View style={styles.tooltip2}>
              <Text style={styles.tooltipText}>
                {'선택한 태그와 같은 상황에 별을\n꺼내보며 마음을 관리해요.'}
              </Text>
              <View style={styles.tooltipCaret} />
            </View>
          )}
        </TouchableOpacity>
      )}

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

          {/* 상황 바 — 배너 바로 아래 항상 고정, 리스트 뷰에서만 표시 */}
          {activeTab === 'list' && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagChipsRow}
                style={styles.tagChipsScroll}
              >
                {tags.map(tag => {
                  const isActive = selectedTagId === tag.id
                  const count = contents.filter(c => c.content_tags?.some(ct => ct.tag_id === tag.id)).length
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[styles.tagChip, isActive && styles.tagChipActive]}
                      onPress={() => setSelectedTagId(tag.id)}
                    >
                      <Text style={[styles.tagChipText, isActive && styles.tagChipTextActive]}>
                        {tag.name}
                      </Text>
                      <View style={[styles.tagCountBadge, isActive && styles.tagCountBadgeActive]}>
                        <Text style={[styles.tagCountText, isActive && styles.tagCountTextActive]}>
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
              <Text style={styles.totalCount}>{listContents.length}개의 별</Text>
            </>
          )}

          {/* Content area */}
          <View style={styles.flex}>
            {activeTab === 'graphic' ? renderGraphicView() : renderListView()}
          </View>
        </SafeAreaView>

        <GNB
          activeTab={activeTab === 'report' ? 'report' : activeTab}
          onReport={() => navigation.navigate('Report')}
          onGraphic={() => setActiveTab('graphic')}
          onList={switchToList}
          onCreate={() => navigation.navigate('Create')}
        />
    </LinearGradient>
  )
}

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
    marginBottom: 6,
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
    gap: 16,
  },
  planetContainer: {
    width: width,
    height: 380,
    overflow: 'hidden',
  },
  planetSlide: {
    position: 'absolute',
    width: width,
    height: 380,
  },
  planetCenter: {
    position: 'absolute',
    top: (380 - PLANET_SIZE) / 2,
    left: (width - PLANET_SIZE) / 2,
  },
  bubble: {
    position: 'absolute',
  },
  overflowBadge: {
    position: 'absolute',
    bottom: 52,
    right: 48,
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
  tagChipsScroll: { flexShrink: 0, flexGrow: 0, height: 56 },
  tagChipsRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: '#2d3052',
  },
  tagChipActive: { backgroundColor: Colors.primary },
  tagChipText:       { fontSize: 13, color: '#fbfcfe', fontFamily: 'Pretendard-Regular' },
  tagChipTextActive: { fontFamily: 'Pretendard-SemiBold' },
  tagCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  tagCountBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tagCountText:       { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Pretendard-Regular' },
  tagCountTextActive: { color: '#fbfcfe', fontFamily: 'Pretendard-Medium' },
  totalCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 20,
    paddingBottom: 4,
    paddingTop: 0,
    fontFamily: 'Pretendard-Regular',
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },

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
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(5,9,40,0.55)',
    zIndex: 100,
  },
  tooltip1: {
    position: 'absolute',
    top: '28%',
    left: 24,
    right: 24,
    backgroundColor: '#fbfcfe',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  tooltip2: {
    position: 'absolute',
    bottom: 160,
    left: 24,
    right: 24,
    backgroundColor: '#fbfcfe',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  tooltipCaret: {
    position: 'absolute',
    bottom: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fbfcfe',
  },
  tooltipText: {
    fontSize: 15,
    color: '#1A1C20',
    fontFamily: 'Pretendard-Medium',
    lineHeight: 23,
    textAlign: 'center',
  },
})