import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native'
import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { useTags } from '../hooks/useTags'
import { createContent, uploadImage } from '../api/contents'

const C = {
  bg: '#0d0d1e', card: '#1a1a30', primary: '#7b6ef6',
  text: '#ffffff', textSec: '#8888bb', border: '#252540',
  tagBg: '#1e1e38', tagSel: '#6b5ce7', btnDim: '#2a2a45',
}

type Step = 1 | 2 | 3 | 4
type ContentType = 'text' | 'image'

export default function CreateScreen({ navigation, route }: any) {
  // ── 로직 영역 ──────────────────────────────────────────────
  const { userId, email } = route.params
  const { tags, addCustomTag } = useTags(userId)

  const [step, setStep]               = useState<Step>(1)
  const [type, setType]               = useState<ContentType>('text')
  const [body, setBody]               = useState('')
  const [memo, setMemo]               = useState('')
  const [imageUri, setImageUri]       = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTagName, setNewTagName]   = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [addingTag, setAddingTag]     = useState(false)

  const hasContent = type === 'text' ? body.trim().length > 0 : imageUri !== null

  // × 버튼: 내용 있으면 폐기 확인
  const handleClose = () => {
    if (!hasContent) { navigation.goBack(); return }
    Alert.alert('변경사항 폐기', '작성하신 내용은 복구되지 않아요.', [
      { text: '취소', style: 'cancel' },
      { text: '폐기', style: 'destructive', onPress: () => navigation.goBack() },
    ])
  }

  // 이미지 선택 옵션
  const showImageOptions = () => {
    Alert.alert('사진 추가', '', [
      { text: '📷 사진 찍기', onPress: takePhoto },
      { text: '🖼️ 갤러리에서 선택', onPress: pickFromGallery },
      { text: '취소', style: 'cancel' },
    ])
  }

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('갤러리 접근 권한이 필요해요.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any })
    if (!result.canceled) setImageUri(result.assets[0].uri)
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') { Alert.alert('카메라 접근 권한이 필요해요.'); return }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'] as any })
    if (!result.canceled) setImageUri(result.assets[0].uri)
  }

  // Step 2 → 3
  const handleNext = () => {
    if (type === 'text' && !body.trim()) { Alert.alert('텍스트를 입력해주세요.'); return }
    if (type === 'image' && !imageUri)   { Alert.alert('이미지를 선택해주세요.'); return }
    setStep(3)
  }

  // Step 3 → 저장 → Step 4
  const handleSave = async () => {
    setSubmitting(true)
    try {
      let image_url: string | undefined
      if (type === 'image' && imageUri) image_url = await uploadImage(userId, imageUri)
      await createContent(
        userId,
        { type, body: type === 'text' ? body : undefined, image_url, memo: memo || undefined },
        selectedTags
      )
      setStep(4)
    } catch (e: any) {
      Alert.alert('오류', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleTag = (tagId: string) =>
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )

  const handleAddTag = async () => {
    const name = newTagName.trim()
    if (!name) return
    setAddingTag(true)
    try { await addCustomTag(name, '✨'); setNewTagName('') }
    catch (e: any) { Alert.alert('오류', e.message) }
    finally { setAddingTag(false) }
  }
  // ──────────────────────────────────────────────────────────

  // ── Step 1: 유형 선택 ──────────────────────────────────────
  if (step === 1) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.headerIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 28 }} />
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.headerIcon}>×</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.stepTitle}>어떤 별을 담을까요?</Text>

        <View style={s.typeSelectArea}>
          <TouchableOpacity
            style={s.typeCard}
            onPress={() => { setType('text'); setStep(2) }}
            activeOpacity={0.8}
          >
            <Text style={s.typeCardIcon}>A</Text>
            <View>
              <Text style={s.typeCardLabel}>텍스트</Text>
              <Text style={s.typeCardDesc}>한 줄, 영감이나 격언, 가사 등</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.typeCard}
            onPress={() => { setType('image'); setStep(2) }}
            activeOpacity={0.8}
          >
            <Text style={s.typeCardIcon}>📷</Text>
            <View>
              <Text style={s.typeCardLabel}>사진</Text>
              <Text style={s.typeCardDesc}>메시지, 사진, 기억 등</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Step 2: 기록 입력 ──────────────────────────────────────
  if (step === 2) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setStep(1)}>
            <Text style={s.headerIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 28 }} />
          <TouchableOpacity onPress={handleClose}>
            <Text style={s.headerIcon}>×</Text>
          </TouchableOpacity>
        </View>

        {/* 본문 입력 */}
        {type === 'text' ? (
          <TextInput
            style={s.textArea}
            placeholder="텍스트를 작성해주세요."
            placeholderTextColor={C.textSec}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
        ) : !imageUri ? (
          <TouchableOpacity style={s.imageUploadArea} onPress={showImageOptions}>
            <View style={s.imageUploadPlus}>
              <Text style={s.imageUploadPlusText}>+</Text>
            </View>
            <Text style={s.imageUploadHint}>사진을 업로드해주세요.</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.imageSelectedWrap}>
            <Image source={{ uri: imageUri }} style={s.imageSelected} />
            <TouchableOpacity style={s.imageEditBtn} onPress={showImageOptions}>
              <Text style={s.imageEditIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 메모 */}
        <TextInput
          style={s.memoInput}
          placeholder="어떤 생각이 들었나요?"
          placeholderTextColor={C.textSec}
          value={memo}
          onChangeText={setMemo}
        />

        <TouchableOpacity
          style={[s.nextBtn, !hasContent && s.nextBtnDim]}
          onPress={handleNext}
        >
          <Text style={s.nextBtnText}>다음</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  // ── Step 3: 태그 선택 ──────────────────────────────────────
  if (step === 3) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setStep(2)}>
            <Text style={s.headerIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ width: 28 }} />
          <TouchableOpacity onPress={handleClose}>
            <Text style={s.headerIcon}>×</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.stepTitle}>별을 언제 꺼내볼까요?</Text>

        <View style={s.tagGrid}>
          {tags.map(tag => (
            <TouchableOpacity
              key={tag.id}
              style={[s.tagBtn, selectedTags.includes(tag.id) && s.tagBtnSel]}
              onPress={() => toggleTag(tag.id)}
            >
              <Text style={s.tagText}>{tag.emoji} {tag.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 커스텀 태그 추가 */}
        <View style={s.addTagRow}>
          <TextInput
            style={s.addTagInput}
            placeholder="원하는 태그를 추가해봐요."
            placeholderTextColor={C.textSec}
            value={newTagName}
            onChangeText={setNewTagName}
            onSubmitEditing={handleAddTag}
            returnKeyType="done"
          />
          <TouchableOpacity style={s.addTagBtn} onPress={handleAddTag} disabled={addingTag}>
            {addingTag
              ? <ActivityIndicator color={C.text} size="small" />
              : <Text style={s.addTagBtnText}>+</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.nextBtn} onPress={handleSave} disabled={submitting}>
          {submitting
            ? <ActivityIndicator color={C.text} />
            : <Text style={s.nextBtnText}>저장</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    )
  }

  // ── Step 4: 저장 완료 ──────────────────────────────────────
  return (
    <View style={[s.container, s.completionContainer]}>
      <Text style={s.completionTitle}>저장 완료!</Text>
      <Text style={s.completionSub}>기록한 별은 언제든 다시 꺼내볼 수 있어요.</Text>

      {type === 'image' && imageUri && (
        <Image source={{ uri: imageUri }} style={s.completionImage} />
      )}
      {type === 'text' && body.trim() && (
        <View style={s.completionTextCard}>
          <Text style={s.completionText} numberOfLines={4}>{body}</Text>
        </View>
      )}

      <View style={s.completionBtns}>
        <TouchableOpacity
          style={s.completionBtnOutline}
          onPress={() => navigation.navigate('Home', { userId, email })}
        >
          <Text style={s.completionBtnOutlineText}>홈으로 가기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.completionBtnFill}
          onPress={() => navigation.navigate('Browse', { userId, email })}
        >
          <Text style={s.completionBtnFillText}>별 보러가기</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 54, paddingBottom: 8,
  },
  headerIcon: { color: C.textSec, fontSize: 22, padding: 4 },

  // Step 1
  stepTitle: { color: C.text, fontSize: 18, fontWeight: '600', paddingHorizontal: 20, marginBottom: 24, marginTop: 8 },
  typeSelectArea: { paddingHorizontal: 20, gap: 14 },
  typeCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: C.border,
  },
  typeCardIcon: { fontSize: 28, color: C.text, fontWeight: '700', width: 36, textAlign: 'center' },
  typeCardLabel: { color: C.text, fontSize: 16, fontWeight: '600', marginBottom: 3 },
  typeCardDesc: { color: C.textSec, fontSize: 12 },

  // Step 2 - text
  textArea: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    color: C.text, fontSize: 15, minHeight: 200, marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
  },
  // Step 2 - image upload
  imageUploadArea: {
    backgroundColor: C.card, borderRadius: 14, height: 200,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, marginBottom: 14, gap: 10,
  },
  imageUploadPlus: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  imageUploadPlusText: { color: C.textSec, fontSize: 28, lineHeight: 32 },
  imageUploadHint: { color: C.textSec, fontSize: 13 },
  imageSelectedWrap: { position: 'relative', marginBottom: 14 },
  imageSelected: { width: '100%', height: 220, borderRadius: 14, resizeMode: 'cover' },
  imageEditBtn: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8,
  },
  imageEditIcon: { fontSize: 14 },

  // 공통 Step 2/3
  memoInput: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    color: C.text, fontSize: 14, marginBottom: 24,
    borderWidth: 1, borderColor: C.border,
  },
  nextBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  nextBtnDim: { backgroundColor: C.btnDim },
  nextBtnText: { color: C.text, fontSize: 16, fontWeight: '600' },

  // Step 3 - 태그
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tagBtn: {
    backgroundColor: C.tagBg, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: C.border,
  },
  tagBtnSel: { backgroundColor: C.tagSel, borderColor: C.tagSel },
  tagText: { color: C.text, fontSize: 13 },
  addTagRow: { flexDirection: 'row', gap: 8, marginBottom: 28, alignItems: 'center' },
  addTagInput: {
    flex: 1, backgroundColor: C.card, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    color: C.text, fontSize: 13, borderWidth: 1, borderColor: C.border,
  },
  addTagBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
  },
  addTagBtnText: { color: C.text, fontSize: 22, lineHeight: 24 },

  // Step 4 - 완료
  completionContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, gap: 16 },
  completionTitle: { color: C.text, fontSize: 26, fontWeight: '700' },
  completionSub: { color: C.textSec, fontSize: 13, textAlign: 'center', marginBottom: 8 },
  completionImage: { width: '100%', height: 200, borderRadius: 16, resizeMode: 'cover' },
  completionTextCard: {
    width: '100%', backgroundColor: C.card, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: C.border,
  },
  completionText: { color: C.text, fontSize: 15, lineHeight: 24 },
  completionBtns: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  completionBtnOutline: {
    flex: 1, borderWidth: 1, borderColor: C.primary, borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  completionBtnOutlineText: { color: C.primary, fontSize: 14, fontWeight: '600' },
  completionBtnFill: {
    flex: 1, backgroundColor: C.primary, borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  completionBtnFillText: { color: C.text, fontSize: 14, fontWeight: '600' },
})
