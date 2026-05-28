import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Image, ActivityIndicator, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../hooks/useAuth'
import { useTags } from '../hooks/useTags'
import { createContent } from '../api/contents'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'
import type { ContentRow } from '../types/database'

type Step = 1 | 2 | 3 | 4
type ContentType = 'text' | 'image'

const TOTAL_STEPS = 3

export default function CreateScreen({ navigation }: ScreenProps<'Create'>) {
  const { session } = useAuth()
  const { tags } = useTags(session?.user?.id ?? '')
  const [step, setStep]             = useState<Step>(1)
  const [contentType, setContentType] = useState<ContentType>('text')
  const [body, setBody]             = useState('')
  const [imageUri, setImageUri]     = useState<string | null>(null)
  const [memo, setMemo]             = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [saving, setSaving]         = useState(false)
  const [savedContent, setSavedContent] = useState<ContentRow | null>(null)

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    })
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri)
    }
  }

  const toggleTag = (tagId: string) =>
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )

  const canProceedStep2 = contentType === 'text' ? body.trim().length > 0 : imageUri !== null
  const canSave = selectedTagIds.length > 0

  const handleSave = async () => {
    if (!session?.user?.id || !canSave) return
    setSaving(true)
    try {
      const result = await createContent(
        session.user.id,
        {
          type: contentType,
          body: contentType === 'text' ? body.trim() : undefined,
          image_url: contentType === 'image' ? (imageUri ?? undefined) : undefined,
          memo: memo.trim() || undefined,
        },
        selectedTagIds,
      )
      setSavedContent(result)
      setStep(4)
    } catch (e: any) {
      Alert.alert('오류', e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (step === 4) {
      if (navigation.canGoBack()) navigation.goBack()
      else navigation.replace('Home')
      return
    }
    Alert.alert('기록을 그만할까요?', '지금까지 작성한 내용이 삭제돼요.', [
      { text: '계속 작성', style: 'cancel' },
      {
        text: '그만하기', style: 'destructive',
        onPress: () => {
          if (navigation.canGoBack()) navigation.goBack()
          else navigation.replace('Home')
        },
      },
    ])
  }

  const goBack = () => {
    if (step === 1) {
      if (navigation.canGoBack()) navigation.goBack()
      else navigation.replace('Home')
    } else {
      setStep(s => (s - 1) as Step)
    }
  }

  const goNext = () => {
    if (step === 3) handleSave()
    else setStep(s => (s + 1) as Step)
  }

  const nextDisabled = (step === 2 && !canProceedStep2) || (step === 3 && !canSave) || saving

  // ── 완료 화면 (Step 4) ──────────────────────────────────────
  if (step === 4) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#050928', '#080711']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.successScreen}>
            {/* 별 아이콘 */}
            <View style={styles.starIconWrap}>
              <Text style={styles.starIconText}>✦</Text>
            </View>

            <Text style={styles.successTitle}>별을 생성했어요!</Text>
            <Text style={styles.successPreview}>
              {contentType === 'text' && body
                ? (body.length > 50 ? body.slice(0, 50) + '…' : body)
                : '이미지 기록'}
            </Text>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.replace('Home')}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryBtnText}>홈으로 가기</Text>
              </TouchableOpacity>

              {savedContent && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() =>
                    navigation.reset({
                      index: 1,
                      routes: [
                        { name: 'Home' },
                        { name: 'ContentDetail', params: { contentId: savedContent.id } },
                      ],
                    })
                  }
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#3B21FB', '#AEF1FF']}
                    start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                    style={styles.primaryBtnGradient}
                  >
                    <Text style={styles.primaryBtnText}>별 보러가기</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fbfcfe" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // ── 스텝 화면 (1~3) ─────────────────────────────────────────
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050928', '#080711']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>

        {/* 진행 바 (전체 너비 얇은 세그먼트) */}
        <View style={styles.progressBar}>
          {[1, 2, 3].map(i => (
            <View
              key={i}
              style={[styles.progressSegment, step >= i && styles.progressSegmentActive]}
            />
          ))}
        </View>

        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.headerBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.stepLabel}>{step} / {TOTAL_STEPS}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.headerBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── 스텝 1: 타입 선택 (Figma: 수직 리스트) ── */}
          {step === 1 && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepTitle}>어떤 별을 기록할까요?</Text>

              <View style={styles.typeList}>
                {/* 텍스트 옵션 */}
                <TouchableOpacity
                  style={[styles.typeListItem, contentType === 'text' && styles.typeListItemActive]}
                  onPress={() => setContentType('text')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#7B5CF0', '#534DFC']}
                    style={styles.typeIconBox}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="text-outline" size={22} color="#fff" />
                  </LinearGradient>
                  <View style={styles.typeTextBlock}>
                    <Text style={[styles.typeLabel, contentType === 'text' && styles.typeLabelActive]}>텍스트</Text>
                    <Text style={styles.typeHint}>영화의 대사, 책의 구절</Text>
                  </View>
                  {contentType === 'text' && (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                  )}
                </TouchableOpacity>

                {/* 사진 옵션 */}
                <TouchableOpacity
                  style={[styles.typeListItem, contentType === 'image' && styles.typeListItemActive]}
                  onPress={() => setContentType('image')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#2EA8D8', '#1A6EAA']}
                    style={styles.typeIconBox}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="image-outline" size={22} color="#fff" />
                  </LinearGradient>
                  <View style={styles.typeTextBlock}>
                    <Text style={[styles.typeLabel, contentType === 'image' && styles.typeLabelActive]}>사진</Text>
                    <Text style={styles.typeHint}>카카오톡 캡쳐, 손편지</Text>
                  </View>
                  {contentType === 'image' && (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── 스텝 2: 내용 + 메모 ── */}
          {step === 2 && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepTitle}>기억을 담아요</Text>

              {contentType === 'text' ? (
                <TextInput
                  style={styles.textArea}
                  placeholder="오늘의 기억을 적어보세요..."
                  placeholderTextColor={Colors.textTertiary}
                  value={body}
                  onChangeText={setBody}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              ) : (
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={pickImage}
                  activeOpacity={0.85}
                >
                  {imageUri ? (
                    <>
                      <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                      <TouchableOpacity style={styles.changeImageBtn} onPress={pickImage}>
                        <Text style={styles.changeImageText}>수정</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={44} color={Colors.textTertiary} />
                      <Text style={styles.imagePickerText}>사진 업로드 해주세요</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.memoBlock}>
                <Text style={styles.memoLabel}>이건 왜 저장했어요?</Text>
                <TextInput
                  style={styles.memoInput}
                  placeholder="짧은 메모를 남겨보세요 (선택)"
                  placeholderTextColor={Colors.textTertiary}
                  value={memo}
                  onChangeText={setMemo}
                  multiline
                />
              </View>
            </View>
          )}

          {/* ── 스텝 3: 태그 선택 ── */}
          {step === 3 && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepTitle}>별을 언제 꺼내볼까요?</Text>
              <Text style={styles.stepDesc}>꺼내보고 싶은 상황 태그를 골라보세요</Text>
              <View style={styles.chipGrid}>
                {tags.map(tag => {
                  const active = selectedTagIds.includes(tag.id)
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => toggleTag(tag.id)}
                      activeOpacity={0.8}
                    >
                      {active && <Ionicons name="checkmark" size={14} color="#fbfcfe" style={{ marginRight: 4 }} />}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag.name}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.nextBtn, nextDisabled && styles.nextBtnDisabled]}
            onPress={goNext}
            disabled={nextDisabled}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fbfcfe" />
            ) : (
              <Text style={styles.nextBtnText}>{step === 3 ? '저장하기' : '다음'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050928' },
  safeArea:  { flex: 1 },

  // 진행 바
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressSegmentActive: {
    backgroundColor: '#534dfc',
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  headerBtn: { padding: 10 },
  stepLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'Pretendard-Medium',
  },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  stepWrap:      { gap: 20 },

  stepTitle: {
    fontSize: 22,
    fontFamily: 'Pretendard-SemiBold',
    color: Colors.textPrimary,
    lineHeight: 32,
  },
  stepDesc: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: -10,
  },

  // 타입 선택 — 수직 리스트 (Figma 기준)
  typeList: { gap: 12, marginTop: 8 },
  typeListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(39,41,54,0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typeListItemActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(83,77,252,0.12)',
  },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTextBlock: { flex: 1 },
  typeLabel: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  typeLabelActive: { color: Colors.textPrimary },
  typeHint: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textTertiary,
  },

  // 텍스트 입력
  textArea: {
    backgroundColor: 'rgba(39,41,54,0.8)',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 200,
    lineHeight: 24,
    textAlignVertical: 'top',
  },

  // 이미지 선택
  imagePicker: {
    height: 240,
    backgroundColor: 'rgba(39,41,54,0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  imagePickerText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textTertiary,
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  changeImageText: {
    fontSize: 13,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-Medium',
  },

  // 메모
  memoBlock: { gap: 8 },
  memoLabel: {
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    color: Colors.textSecondary,
  },
  memoInput: {
    backgroundColor: 'rgba(39,41,54,0.8)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 80,
    lineHeight: 22,
    textAlignVertical: 'top',
  },

  // 태그 칩
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(39,41,54,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:       { fontSize: 14, fontFamily: 'Pretendard-Regular', color: Colors.textSecondary },
  chipTextActive: { color: '#fbfcfe', fontFamily: 'Pretendard-Medium' },

  // 하단 버튼
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 8 : 20,
    paddingTop: 12,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: { opacity: 0.35 },
  nextBtnText: {
    color: '#fbfcfe',
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
  },

  // 완료 화면
  successScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  starIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(83,77,252,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  starIconText: { fontSize: 36, color: Colors.primaryLight },
  successTitle: {
    fontSize: 26,
    fontFamily: 'Pretendard-Bold',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  successPreview: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  successActions: { width: '100%', gap: 12, marginTop: 16 },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#fbfcfe',
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
  },
  secondaryBtn: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(39,41,54,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
  },
})
