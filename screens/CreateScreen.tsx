import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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

export default function CreateScreen({ navigation }: ScreenProps<'Create'>) {
  const { session } = useAuth()
  const { tags } = useTags(session?.user?.id ?? '')
  const [step, setStep] = useState<Step>(1)
  const [contentType, setContentType] = useState<ContentType>('text')
  const [body, setBody] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [memo, setMemo] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [savedContent, setSavedContent] = useState<ContentRow | null>(null)

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    })
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const canProceedStep2 =
    contentType === 'text' ? body.trim().length > 0 : imageUri !== null

  const handleSave = async () => {
    if (!session?.user?.id) return
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
        selectedTagIds
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
      navigation.goBack()
      return
    }
    Alert.alert('기록을 그만할까요?', '지금까지 작성한 내용이 삭제돼요.', [
      { text: '계속 작성', style: 'cancel' },
      { text: '그만하기', style: 'destructive', onPress: () => navigation.goBack() },
    ])
  }

  const goBack = () => {
    if (step === 1) navigation.goBack()
    else setStep((s) => (s - 1) as Step)
  }

  const goNext = () => {
    if (step === 3) handleSave()
    else setStep((s) => (s + 1) as Step)
  }

  const nextDisabled = (step === 2 && !canProceedStep2) || saving

  if (step === 4) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✦</Text>
            <Text style={styles.successTitle}>별이 생성됐어요!</Text>
            <Text style={styles.successSubtitle}>
              {contentType === 'text' && body
                ? body.length > 40
                  ? body.slice(0, 40) + '…'
                  : body
                : '이미지 기록'}
            </Text>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.replace('Home')}
              >
                <Text style={styles.secondaryBtnText}>홈으로 가기</Text>
              </TouchableOpacity>

              {savedContent && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() =>
                    navigation.replace('ContentDetail', { contentId: savedContent.id })
                  }
                >
                  <Text style={styles.primaryBtnText}>별 보러가기</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>{step} / 3</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1: Choose type */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>어떤 별을 기록할까요?</Text>
              <Text style={styles.stepSubtitle}>기록할 내용의 형식을 선택해주세요</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeCard, contentType === 'text' && styles.typeCardActive]}
                  onPress={() => setContentType('text')}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={40}
                    color={contentType === 'text' ? Colors.primary : Colors.textTertiary}
                  />
                  <Text style={[styles.typeLabel, contentType === 'text' && styles.typeLabelActive]}>
                    텍스트
                  </Text>
                  <Text style={styles.typeDesc}>글로 기록하기</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeCard, contentType === 'image' && styles.typeCardActive]}
                  onPress={() => setContentType('image')}
                >
                  <Ionicons
                    name="image-outline"
                    size={40}
                    color={contentType === 'image' ? Colors.primary : Colors.textTertiary}
                  />
                  <Text style={[styles.typeLabel, contentType === 'image' && styles.typeLabelActive]}>
                    이미지
                  </Text>
                  <Text style={styles.typeDesc}>사진으로 기록하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: Content input + memo */}
          {step === 2 && (
            <View style={styles.stepContainer}>
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
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={48} color={Colors.textTertiary} />
                      <Text style={styles.imagePickerText}>이미지 선택하기</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <Text style={styles.fieldLabel}>메모 (선택)</Text>
              <TextInput
                style={styles.inputField}
                placeholder="짧은 메모를 남겨보세요"
                placeholderTextColor={Colors.textTertiary}
                value={memo}
                onChangeText={setMemo}
              />
            </View>
          )}

          {/* Step 3: Tag selection */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>별을 언제 꺼내볼까요?</Text>
              <Text style={styles.stepSubtitle}>감정 태그를 골라보세요 (중복 선택 가능)</Text>
              <View style={styles.chipGrid}>
                {tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id)
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[styles.tagChip, isSelected && styles.tagChipActive]}
                      onPress={() => toggleTag(tag.id)}
                    >
                      <Text style={[styles.tagChipText, isSelected && styles.tagChipTextActive]}>
                        {tag.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color={Colors.textPrimary} />
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom next button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.nextBtn, nextDisabled && styles.nextBtnDisabled]}
            onPress={goNext}
            disabled={nextDisabled}
          >
            {saving ? (
              <ActivityIndicator color={Colors.textPrimary} />
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
  container: { flex: 1, backgroundColor: Colors.bgMain },
  safeArea:  { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    height: 60,
  },
  stepIndicator: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'Pretendard-Medium',
  },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, gap: 20 },
  stepContainer: { gap: 20 },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Pretendard-SemiBold',
    color: Colors.textPrimary,
    lineHeight: 34,
  },
  stepSubtitle: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: -8,
  },

  // Step 1 — 타입 선택
  typeRow: { flexDirection: 'row', gap: 14 },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    gap: 10,
  },
  typeCardActive: { borderColor: Colors.primary },
  typeLabel: {
    fontSize: 15,
    fontFamily: 'Pretendard-SemiBold',
    color: Colors.textSecondary,
  },
  typeLabelActive: { color: Colors.textPrimary },
  typeDesc: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textTertiary,
  },

  // Step 2 — 입력
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    minHeight: 220,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  imagePicker: {
    height: 220,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  selectedImage: { width: '100%', height: '100%' },
  imagePickerText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textTertiary,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
    color: Colors.textSecondary,
    marginBottom: -8,
  },
  inputField: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },

  // Step 3 — 태그
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: '#2d3052',
  },
  tagChipActive: { backgroundColor: Colors.primary },
  tagChipText:       { fontSize: 14, fontFamily: 'Pretendard-Regular', color: '#fbfcfe' },
  tagChipTextActive: { fontFamily: 'Pretendard-Medium' },

  // 하단 버튼
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 11,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
  },

  // 완료 화면
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  successIcon: { fontSize: 60, color: Colors.primaryLight },
  successTitle: {
    fontSize: 26,
    fontFamily: 'Pretendard-Bold',
    color: Colors.textPrimary,
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successActions: { width: '100%', gap: 12, marginTop: 20 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 11,
    height: 56,
  },
  primaryBtnText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    height: 56,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
  },
})