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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
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
import type { ContentWithTags, TagRow } from '../types/database'

const TUTORIAL_KEY = 'morbit_home_tutorial_seen'

const TUTORIAL_IMG_1 = require('../assets/images/tutorial1.jpg')
const TUTORIAL_IMG_2 = require('../assets/images/tutorial2.jpg')

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

const { width, height } = Dimensions.get('window')
const PLANET_SIZE = 290

// 버블 위치 — 피그마 기준 행성 주변 배치
const BUBBLE_POSITIONS: Array<{ top?: number; bottom?: number; left?: number; right?: number }> = [
  { top: 40,  left: 28 },                       // 상단 왼쪽
  { top: 85,  left: Math.round(width * 0.52) }, // 상단 오른쪽
  { top: 152, left: 16 },                       // 중단 왼쪽 (이미지)
  { top: 200, left: Math.round(width * 0.53) }, // 중단 오른쪽
  { top: 270, left: 44 },                       // 하단 왼쪽
]

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

// 튜토리얼용 더미 데이터 — 앱이 채워진 상태를 미리 보여줌
const MOCK_TAGS: TagRow[] = [
  { id: 'mt-0', name: '무기력할 때', emoji: '😔', is_default: true, user_id: null },
  { id: 'mt-1', name: '기쁠 때',     emoji: '😊', is_default: true, user_id: null },
]

const MOCK_CONTENTS: ContentWithTags[] = [
  {
    id: 'mc-0', type: 'text',
    body: '살아있는 한 희망은 있다',
    created_at: '2025-01-05T00:00:00Z',
    user_id: '', image_url: null, memo: null, source: null, shown_at: null,
    content_tags: [{ tag_id: 'mt-0', tags: MOCK_TAGS[0] }],
  },
  {
    id: 'mc-1', type: 'text',
    body: '이 또한 지나가리라.',
    created_at: '2025-01-04T00:00:00Z',
    user_id: '', image_url: null, memo: null, source: null, shown_at: null,
    content_tags: [{ tag_id: 'mt-0', tags: MOCK_TAGS[0] }],
  },
  {
    id: 'mc-2', type: 'image',
    body: null,
    created_at: '2025-01-03T00:00:00Z',
    user_id: '', image_url: null, memo: null, source: null, shown_at: null,
    content_tags: [{ tag_id: 'mt-0', tags: MOCK_TAGS[0] }],
  },
  {
    id: 'mc-3', type: 'text',
    body: '피할 수 없으면 즐겨라.',
    created_at: '2025-01-02T00:00:00Z',
    user_id: '', image_url: null, memo: null, source: null, shown_at: null,
    content_tags: [{ tag_id: 'mt-0', tags: MOCK_TAGS[0] }],
  },
  {
    id: 'mc-4', type: 'image',
    body: null,
    created_at: '2025-01-01T00:00:00Z',
    user_id: '', image_url: null, memo: null, source: null, shown_at: null,
    content_tags: [{ tag_id: 'mt-0', tags: MOCK_TAGS[0] }],
  },
  {
    id: 'mc-5', type: 'text',
    body: '나는 오늘도 괜찮다.',
    created_at: '2024-12-31T00:00:00Z',
    user_id: '', image_url: null, memo: null, source: null, shown_at: null,
    content_tags: [{ tag_id: 'mt-0', tags: MOCK_TAGS[0] }],
  },
  {
    id: 'mc-6', type: 'text',
    body: '매일 조금씩 나아지고 있어.',
    created_at: '2024-12-30T00:00:00Z',
    user_id: '', image_url: null, memo: null, source: null, shown_at: null,
    content_tags: [{ tag_id: 'mt-0', tags: MOCK_TAGS[0] }],
  },
  {
    id: 'mc-7', type: 'text',
    body: '지금 이 순간이 소중해.',
    created_at: '2024-12-29T00:00:00Z',
    user_id: '', image_url: null, memo: null, source: null, shown_at: null,
    content_tags: [{ tag_id: 'mt-0', tags: MOCK_TAGS[0] }],
  },
]

const MOCK_LOCAL_SOURCES: Record<string, any> = {
  'mc-2': TUTORIAL_IMG_1,
  'mc-4': TUTORIAL_IMG_2,
}

export default function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const insets = useSafeAreaInsets()
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
  const [tutorialStep, setTutorialStep] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [hlPlanetY, setHlPlanetY] = useState<number | null>(null)
  const [hlArrowY, setHlArrowY]   = useState<number | null>(null)
  const planetContainerRef = useRef<View>(null)
  const arrowRowRef        = useRef<View>(null)
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

  // 테스트 기간: 매번 진입 시 튜토리얼 표시
  useEffect(() => {
    setTutorialStep(1)
  }, [])

  const currentTag = tags[currentTagIdx] ?? null

  const tagContents = currentTag
    ? contents.filter((c) => c.content_tags?.some((ct) => ct.tag_id === currentTag.id))
    : []

  // 튜토리얼 중에는 더미 데이터로 배경 렌더링
  const isTutorial = tutorialStep > 0
  const displayTags        = isTutorial ? MOCK_TAGS : tags
  const displayTag         = isTutorial ? MOCK_TAGS[0] : currentTag
  const displayTagIdx      = isTutorial ? 0 : currentTagIdx
  const displayTagContents = isTutorial
    ? MOCK_CONTENTS.filter(c => c.content_tags?.some(ct => ct.tag_id === MOCK_TAGS[0].id))
    : tagContents

  const MAX_SHOWN = 5
  const shownCards = displayTagContents.slice(0, MAX_SHOWN)
  const totalCount = displayTagContents.length
  const hasOverflow = totalCount > MAX_SHOWN

  // 튜토리얼 하이라이트 위치 계산 (런타임 SafeArea 기반)
  const HEADER_H = 60
  const BANNER_H = 62  // bannerGradient(56) + marginBottom(6)
  const GNB_H = 16 + 56 + Math.max(insets.bottom, 20)
  const graphicAreaH = height - insets.top - HEADER_H - BANNER_H - GNB_H
  const ARROW_H = 38  // arrowBtn padding(8)*2 + icon(22)
  const BLOCK_H = 380 + 16 + ARROW_H
  const centerOffset = Math.max(0, (graphicAreaH - BLOCK_H) / 2)
  const bannerTop = insets.top + HEADER_H
  const planetTopFallback = insets.top + HEADER_H + BANNER_H + centerOffset
  const arrowTopFallback  = planetTopFallback + 380 + 16
  const effectiveArrowTop = hlArrowY ?? arrowTopFallback

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
    if (!isTutorial && (tagsLoading || contentsLoading)) {
      return (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )
    }

    if (!isTutorial && displayTags.length === 0) {
      return (
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyText}>+ 버튼으로 첫 번째{'\n'}별을 기록해보세요.</Text>
        </View>
      )
    }

    return (
      <View style={styles.graphicArea}>
        {/* Planet container — planet centered, bubbles float around it, swipe to change tag */}
        <View
          ref={planetContainerRef}
          style={styles.planetContainer}
          onLayout={() => {
            planetContainerRef.current?.measureInWindow((_, y) => setHlPlanetY(y))
          }}
          {...panResponder.panHandlers}
        >
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
              <PlanetGraphic tagIndex={displayTagIdx} size={PLANET_SIZE} />
            </TouchableOpacity>

            {/* Floating content bubbles */}
            {shownCards.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.bubble, BUBBLE_POSITIONS[idx]]}
                onPress={() => {
                  if (!isTutorial) navigation.navigate('ContentDetail', { contentId: item.id })
                }}
                activeOpacity={0.8}
              >
                <ContentBubble item={item} localSource={isTutorial ? MOCK_LOCAL_SOURCES[item.id] : undefined} />
              </TouchableOpacity>
            ))}

            {/* Overflow badge — 총 개수 표시 */}
            {hasOverflow && (
              <TouchableOpacity
                style={styles.overflowBadge}
                onPress={() => {
                  if (!isTutorial) {
                    setSelectedTagId(currentTag?.id ?? null)
                    setActiveTab('list')
                  }
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#3B21FB', '#AEF1FF']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.overflowGradient}
                >
                  <Text style={styles.overflowText}>+{totalCount - MAX_SHOWN}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>

        {/* Arrow navigation */}
        <View
          ref={arrowRowRef}
          style={styles.arrowRow}
          onLayout={() => {
            arrowRowRef.current?.measureInWindow((_, y) => setHlArrowY(y))
          }}
        >
          <TouchableOpacity style={styles.arrowBtn} onPress={goLeft} disabled={isTutorial}>
            <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.arrowLabel}>{displayTag?.name ?? ''}</Text>
          <TouchableOpacity style={styles.arrowBtn} onPress={goRight} disabled={isTutorial}>
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
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={(e) => console.warn('[ListCard] image load error:', imageUrl, e.nativeEvent.error)}
          />
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
    } else if (tutorialStep === 2) {
      setTutorialStep(3)
    } else if (tutorialStep === 3) {
      setTutorialStep(4)
    } else {
      setTutorialStep(0)
      markTutorialSeen()
    }
  }

  return (
    <LinearGradient colors={Colors.bgHomeGradient} style={styles.flex}>
      {/* 별 배경 */}
      <StarField />

      {/* 튜토리얼 오버레이 (3단계) */}
      {tutorialStep > 0 && (
        <TouchableOpacity
          style={styles.tutorialOverlay}
          onPress={advanceTutorial}
          activeOpacity={1}
        >
          {tutorialStep === 3 && (
            <View style={[styles.tooltipWrapper3, { top: bannerTop + BANNER_H + 8 }]}>
              <View style={styles.tooltipCaretUp} />
              <View style={styles.tooltipBox}>
                <Text style={styles.tooltipText}>
                  {'잊고있던 기록들은 하루에 한 번\n별똥별이 되어 찾아와요.'}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Step 1 툴팁 — 행성 하이라이트보다 위(zIndex 102)에 렌더링 */}
      {tutorialStep === 1 && (
        <View
          style={[
            styles.tooltipWrapper1,
            { top: (hlPlanetY ?? planetTopFallback) - 96 },
          ]}
          pointerEvents="none"
        >
          <View style={styles.tooltipBox}>
            <Text style={styles.tooltipText}>
              {'위로가 된 글과 사진은 별이 되어\n나의 우주를 채워요.'}
            </Text>
          </View>
          <View style={styles.tooltipCaretDown} />
        </View>
      )}

      {/* Step 1 하이라이트: 행성 + 버블 — measureInWindow로 측정된 정확한 Y 사용 */}
      {tutorialStep === 1 && (
        <View
          style={{ position: 'absolute', top: hlPlanetY ?? planetTopFallback, width, height: 380, zIndex: 101 }}
          pointerEvents="none"
        >
          <View style={styles.planetContainer}>
            <Animated.View style={[styles.planetSlide, { transform: [{ translateX: planetX }] }]}>
              <View style={styles.planetCenter}>
                <PlanetGraphic tagIndex={displayTagIdx} size={PLANET_SIZE} />
              </View>
              {shownCards.map((item, idx) => (
                <View key={item.id} style={[styles.bubble, BUBBLE_POSITIONS[idx]]}>
                  <ContentBubble item={item} localSource={MOCK_LOCAL_SOURCES[item.id]} />
                </View>
              ))}
              {hasOverflow && (
                <View style={styles.overflowBadge}>
                  <LinearGradient
                    colors={['#3B21FB', '#AEF1FF']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.overflowGradient}
                  >
                    <Text style={styles.overflowText}>+{totalCount - MAX_SHOWN}</Text>
                  </LinearGradient>
                </View>
              )}
            </Animated.View>
          </View>
        </View>
      )}

      {/* Step 2 툴팁 — zIndex 102 */}
      {tutorialStep === 2 && (
        <View
          style={[styles.tooltipWrapper2, { top: effectiveArrowTop - 96 }]}
          pointerEvents="none"
        >
          <View style={styles.tooltipBox}>
            <Text style={styles.tooltipText}>
              {'상황에 맞는 기록들을 꺼내보며\n힘을 얻어요.'}
            </Text>
          </View>
          <View style={styles.tooltipCaretDown} />
        </View>
      )}

      {/* Step 2 하이라이트: 태그 화살표 내비게이션 */}
      {tutorialStep === 2 && (
        <View
          style={{ position: 'absolute', top: effectiveArrowTop, left: 0, right: 0, zIndex: 101, alignItems: 'center' }}
          pointerEvents="none"
        >
          <View style={styles.arrowRow}>
            <View style={styles.arrowBtn}>
              <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
            </View>
            <Text style={styles.arrowLabel}>{displayTag?.name ?? ''}</Text>
            <View style={styles.arrowBtn}>
              <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
            </View>
          </View>
        </View>
      )}

      {/* Step 3 하이라이트: 별똥별 배너 */}
      {tutorialStep === 3 && (
        <View
          style={{ position: 'absolute', top: bannerTop, left: 20, right: 20, zIndex: 101, borderRadius: 11, overflow: 'hidden' }}
          pointerEvents="none"
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
        </View>
      )}

      {/* Step 4 툴팁 — + 버튼 위 */}
      {tutorialStep === 4 && (
        <View
          style={[styles.tooltipWrapper4, { bottom: Math.max(insets.bottom, 20) + 56 + 12 }]}
          pointerEvents="none"
        >
          <View style={[styles.tooltipBox, { width: 200 }]}>
            <Text style={styles.tooltipText}>
              {'새 별을 기록하고,\n나의 우주를 가득 채워보세요!'}
            </Text>
          </View>
          <View style={[styles.tooltipCaretDown, { marginLeft: 161 }]} />
        </View>
      )}

      {/* Step 4 하이라이트: + 버튼 */}
      {tutorialStep === 4 && (
        <View
          style={{
            position: 'absolute',
            right: 20,
            bottom: Math.max(insets.bottom, 20),
            zIndex: 101,
          }}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['#3B21FB', '#AEF1FF']}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createBtnHighlight}
          >
            <Ionicons name="add" size={24} color="#fbfcfe" />
          </LinearGradient>
        </View>
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
    bottom: 58,
    right: 52,
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
  tooltipWrapper1: {
    position: 'absolute',
    top: 174,
    left: (width - 210) / 2,
    width: 210,
    alignItems: 'center',
    zIndex: 102,
  },
  tooltipWrapper2: {
    position: 'absolute',
    top: 505,
    left: (width - 210) / 2,
    width: 210,
    alignItems: 'center',
    zIndex: 102,
  },
  tooltipWrapper3: {
    position: 'absolute',
    left: (width - 210) / 2,
    width: 210,
    alignItems: 'center',
  },
  tooltipWrapper4: {
    position: 'absolute',
    right: 20,
    width: 200,
    alignItems: 'flex-start',
    zIndex: 102,
  },
  createBtnHighlight: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipBox: {
    width: 210,
    backgroundColor: '#fbfcfe',
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  tooltipCaretDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fbfcfe',
  },
  tooltipCaretUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fbfcfe',
  },
  tooltipText: {
    fontSize: 14,
    color: '#1a1c20',
    fontFamily: 'Pretendard-Regular',
    lineHeight: 21,
    textAlign: 'center',
  },
})