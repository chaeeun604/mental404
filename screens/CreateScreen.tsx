import { useState, useRef, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Image, ActivityIndicator, Platform, Modal, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../hooks/useAuth'
import { useTags } from '../hooks/useTags'
import { createContent, uploadImage } from '../api/contents'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'
import type { ContentRow } from '../types/database'

type Step = 1 | 2 | 3 | 4
type ContentType = 'text' | 'image'

const TOTAL_STEPS = 3
const MAX_CUSTOM_TAGS = 5
const MAX_TAG_CHARS = 20

export default function CreateScreen({ navigation }: ScreenProps<'Create'>) {
  const { session } = useAuth()
  const { tags, addCustomTag } = useTags(session?.user?.id ?? '')
  const [step, setStep]             = useState<Step>(1)
  const [contentType, setContentType] = useState<ContentType>('text')
  const [body, setBody]             = useState('')
  const [imageUri, setImageUri]     = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [memo, setMemo]             = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [saving, setSaving]         = useState(false)
  const [savedContent, setSavedContent] = useState<ContentRow | null>(null)
  const [newTagInput, setNewTagInput] = useState('')
  const [addingTag, setAddingTag]     = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)

  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current
  const successOpacity = useRef(new Animated.Value(0)).current
  const successY = useRef(new Animated.Value(24)).current

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / TOTAL_STEPS,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [step])

  useEffect(() => {
    if (step === 4) {
      Animated.parallel([
        Animated.timing(successOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(successY, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]).start()
    }
  }, [step])

  const customTags = tags.filter(t => !t.is_default)
  const remainingCustom = MAX_CUSTOM_TAGS - customTags.length
  const isCharOverflow = newTagInput.length > MAX_TAG_CHARS
  const canAddTag = newTagInput.trim().length > 0 && !isCharOverflow && remainingCustom > 0

  const handleAddCustomTag = async () => {
    if (!canAddTag || addingTag) return
    setAddingTag(true)
    try {
      const newTag = await addCustomTag(newTagInput.trim(), '✦')
      setSelectedTagIds(prev => [...prev, newTag.id])
      setNewTagInput('')
    } catch (e: any) {
      Alert.alert('오류', e.message)
    } finally {
      setAddingTag(false)
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
    })
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri)
      setImageBase64(result.assets[0].base64 ?? null)
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
      let finalImageUrl: string | undefined
      if (contentType === 'image' && imageUri) {
        finalImageUrl = await uploadImage(session.user.id, imageUri, imageBase64 ?? undefined)
      }

      const result = await createContent(
        session.user.id,
        {
          type: contentType,
          body: contentType === 'text' ? body.trim() : undefined,
          image_url: finalImageUrl,
          memo: memo.trim() || undefined,
        },
        selectedTagIds,
      )
      setSavedContent(result)
      setStep(4)
    } catch (e: any) {
      const msg: string = e?.message ?? ''
      if (msg.includes('row-level-security') || msg.includes('violates')) {
        Alert.alert(
          '업로드 오류',
          '이미지 업로드 권한이 없어요.\nSupabase Storage 버킷의 RLS 정책을 확인해주세요.',
        )
      } else {
        Alert.alert('오류', msg || '저장에 실패했어요.')
      }
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
    setShowExitModal(true)
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
          <Animated.View style={[styles.successScreen, {
            opacity: successOpacity,
            transform: [{ translateY: successY }],
          }]}>
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
          </Animated.View>
        </SafeAreaView>
      </View>
    )
  }

  // ── 스텝 화면 (1~3) ─────────────────────────────────────────
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050928', '#080711']} style={StyleSheet.absoluteFill} />

      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.exitOverlay}>
          <View style={styles.exitCard}>
            <Text style={styles.exitTitle}>기록을 그만 쓸까요?</Text>
            <Text style={styles.exitBody}>{'작성 중인 내용이 모두\n사라져요.'}</Text>
            <View style={styles.exitBtnRow}>
              <TouchableOpacity
                style={styles.exitCancelBtn}
                onPress={() => setShowExitModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.exitCancelText}>계속 작성</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exitConfirmBtn}
                onPress={() => {
                  setShowExitModal(false)
                  if (navigation.canGoBack()) navigation.goBack()
                  else navigation.replace('Home')
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.exitConfirmText}>폐기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SafeAreaView style={styles.safeArea}>

        {/* 진행 바 */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, {
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }]} />
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

          {/* ── 스텝 3: 태그 선택 + 커스텀 태그 추가 ── */}
          {step === 3 && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepTitle}>별을 언제 꺼내볼까요?</Text>

              {/* 태그 칩 목록 (기본 + 커스텀) */}
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

              {/* 커스텀 태그 추가 입력 */}
              <View>
                <View style={[styles.tagInputRow, isCharOverflow && styles.tagInputRowError]}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder={
                      remainingCustom > 0
                        ? `새 태그를 ${remainingCustom}개 더 추가할 수 있어요.`
                        : '태그를 최대 5개까지 추가할 수 있어요.'
                    }
                    placeholderTextColor={Colors.textTertiary}
                    value={newTagInput}
                    onChangeText={setNewTagInput}
                    maxLength={MAX_TAG_CHARS + 5}
                    editable={remainingCustom > 0}
                    returnKeyType="done"
                    onSubmitEditing={handleAddCustomTag}
                  />
                  <TouchableOpacity
                    style={[styles.tagAddBtn, !canAddTag && styles.tagAddBtnDisabled]}
                    onPress={handleAddCustomTag}
                    disabled={!canAddTag || addingTag}
                    activeOpacity={0.8}
                  >
                    {addingTag
                      ? <ActivityIndicator size="small" color="#fbfcfe" />
                      : <Ionicons name="add" size={20} color={canAddTag ? '#fbfcfe' : Colors.textTertiary} />
                    }
                  </TouchableOpacity>
                </View>

                {/* 글자수 / 오버플로 피드백 */}
                <View style={styles.tagInputMeta}>
                  {isCharOverflow ? (
                    <Text style={styles.charOverflow}>글자수를 초과했어요 ({newTagInput.length}/{MAX_TAG_CHARS})</Text>
                  ) : newTagInput.length > 0 ? (
                    <Text style={styles.charCount}>{newTagInput.length} / {MAX_TAG_CHARS}</Text>
                  ) : null}
                </View>
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
  progressTrack: {
    height: 3,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
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

  // 태그 입력
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39,41,54,0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingLeft: 16,
    paddingRight: 8,
    height: 54,
    gap: 8,
  },
  tagInputRowError: {
    borderColor: '#FF6060',
  },
  tagInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textPrimary,
  },
  tagAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagAddBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tagInputMeta: {
    marginTop: 6,
    paddingHorizontal: 4,
    minHeight: 18,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: 'Pretendard-Regular',
  },
  charOverflow: {
    fontSize: 12,
    color: '#FF6060',
    fontFamily: 'Pretendard-Regular',
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

  // 나가기 확인 모달
  exitOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  exitCard: {
    backgroundColor: '#1a1d2e',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  exitTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#fbfcfe',
    textAlign: 'center',
  },
  exitBody: {
    fontSize: 14,
    color: '#9A9FB3',
    lineHeight: 22,
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
  },
  exitBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  exitCancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  exitConfirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E03E3E',
  },
  exitCancelText: {
    fontSize: 15,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-Medium',
  },
  exitConfirmText: {
    fontSize: 15,
    color: '#fbfcfe',
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
