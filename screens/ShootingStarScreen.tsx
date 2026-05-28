import { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../hooks/useAuth'
import { getDailyRecommendation } from '../api/contents'
import { logView } from '../api/viewLogs'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'
import type { ContentWithTags } from '../types/database'

export default function ShootingStarScreen({ navigation }: ScreenProps<'ShootingStar'>) {
  const { session } = useAuth()
  const [revealed, setRevealed] = useState(false)
  const [content, setContent] = useState<ContentWithTags | null | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const scaleAnim = useRef(new Animated.Value(1)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const questionOpacity = useRef(new Animated.Value(1)).current

  const reveal = async () => {
    if (revealed || loading) return
    setLoading(true)

    Animated.timing(questionOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start()

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.15,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      try {
        const result = await getDailyRecommendation()
        setContent(result)
        if (result && session?.user?.id) {
          await logView(session.user.id, result.id).catch(() => {})
        }
      } catch {
        setContent(null)
      } finally {
        setLoading(false)
        setRevealed(true)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start()
      }
    })
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.titleSection}>
          <Text style={styles.title}>오늘은 어떤 별이{'\n'}떨어졌을까요?</Text>
          <Text style={styles.subtitle}>기록한 별 중 하나가 무작위로 떨어집니다.</Text>
        </View>

        {!revealed ? (
          <View style={styles.mysteryArea}>
            <TouchableOpacity onPress={reveal} activeOpacity={0.85} disabled={loading}>
              <Animated.View style={[styles.mysteryBox, { transform: [{ scale: scaleAnim }] }]}>
                <Animated.Text style={[styles.questionMark, { opacity: questionOpacity }]}>
                  ?
                </Animated.Text>
                {loading && (
                  <ActivityIndicator
                    color={Colors.primaryLight}
                    style={StyleSheet.absoluteFill}
                  />
                )}
              </Animated.View>
            </TouchableOpacity>
            <Text style={styles.tapHint}>탭하여 별을 확인하세요</Text>
          </View>
        ) : (
          <Animated.View style={[styles.revealArea, { opacity: fadeAnim }]}>
            {content == null ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🌌</Text>
                <Text style={styles.emptyTitle}>아직 별이 없어요</Text>
                <Text style={styles.emptySubtitle}>기억을 기록하면 여기서 만날 수 있어요.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.contentCard}>
                  <Text style={styles.contentDate}>
                    {new Date(content.created_at).toLocaleDateString('ko-KR', {
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </Text>

                  <View style={styles.tagRow}>
                    {content.content_tags?.map((ct) => (
                      <View key={ct.tag_id} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>{ct.tags?.name}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={styles.contentBody}>
                    {content.type === 'text' ? content.body : '📷 이미지'}
                  </Text>

                  {content.memo ? (
                    <View style={styles.memoSection}>
                      <Text style={styles.memoText}>{content.memo}</Text>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() =>
                    navigation.navigate('ContentDetail', { contentId: content.id })
                  }
                >
                  <Text style={styles.detailBtnText}>자세히 보기</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                </TouchableOpacity>
              </ScrollView>
            )}
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgMain },
  safeArea: { flex: 1 },
  closeBtn: { padding: 16, alignSelf: 'center' },
  titleSection: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 32, gap: 10 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  mysteryArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  mysteryBox: {
    width: 160,
    height: 160,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  questionMark: {
    fontSize: 72,
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  tapHint: { fontSize: 13, color: Colors.textTertiary },
  revealArea: { flex: 1, paddingHorizontal: 20 },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  contentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  contentDate: { fontSize: 12, color: Colors.textTertiary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagChipText: { fontSize: 12, color: Colors.primaryLight, fontWeight: '500' },
  contentBody: { fontSize: 16, color: Colors.textPrimary, lineHeight: 26 },
  memoSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: 12,
  },
  memoText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 32,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  detailBtnText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600' },
})