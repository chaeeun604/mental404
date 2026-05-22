import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native'
import { useState, useEffect } from 'react'
import { getContentById, updateContent, updateContentTags, deleteContent } from '../api/contents'
import { useTags } from '../hooks/useTags'
import { ContentWithTags } from '../types/database'

const C = {
  bg: '#0d0d1e', card: '#1a1a30', primary: '#7b6ef6',
  text: '#ffffff', textSec: '#8888bb', border: '#252540',
  tagBg: '#1e1e38', tagSel: '#6b5ce7', danger: '#ff5555',
}

export default function ContentDetailScreen({ navigation, route }: any) {
  // ── 로직 영역 ──────────────────────────────────────────────
  const { contentId, userId } = route.params
  const { tags } = useTags(userId)

  const [content, setContent] = useState<ContentWithTags | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const [editedBody, setEditedBody] = useState('')
  const [editedMemo, setEditedMemo] = useState('')
  const [editedTagIds, setEditedTagIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const hasChanges =
    editedBody !== (content?.body ?? '') ||
    editedMemo !== (content?.memo ?? '') ||
    JSON.stringify([...editedTagIds].sort()) !==
      JSON.stringify([...content?.content_tags.map(ct => ct.tag_id) ?? []].sort())

  const load = async () => {
    setLoading(true)
    try {
      const data = await getContentById(contentId)
      setContent(data)
      if (data) {
        setEditedBody(data.body ?? '')
        setEditedMemo(data.memo ?? '')
        setEditedTagIds(data.content_tags.map(ct => ct.tag_id))
      }
    } catch (e: any) {
      Alert.alert('오류', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [contentId])

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasChanges || !isEditing) return
      e.preventDefault()
      Alert.alert('변경사항 폐기', '변경사항을 저장하지 않으시겠어요?', [
        { text: '취소', style: 'cancel' },
        { text: '폐기', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ])
    })
    return unsubscribe
  }, [navigation, hasChanges, isEditing])

  const handleSave = async () => {
    if (!content) return
    setSaving(true)
    try {
      await updateContent(content.id, {
        body: content.type === 'text' ? editedBody : undefined,
        memo: editedMemo || undefined,
      })
      await updateContentTags(content.id, editedTagIds)
      await load()
      setIsEditing(false)
    } catch (e: any) {
      Alert.alert('오류', e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    Alert.alert('기록 삭제', '기록을 삭제할까요?\n삭제하면 복구되지 않아요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive', onPress: async () => {
          try {
            await deleteContent(contentId)
            navigation.goBack()
          } catch (e: any) {
            Alert.alert('오류', e.message)
          }
        },
      },
    ])
  }

  const toggleTag = (tagId: string) =>
    setEditedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )

  const handleEditPress = () => {
    if (isEditing && hasChanges) {
      Alert.alert('변경사항 폐기', '변경사항을 저장하지 않으시겠어요?', [
        { text: '취소', style: 'cancel' },
        { text: '폐기', style: 'destructive', onPress: () => {
          if (content) {
            setEditedBody(content.body ?? '')
            setEditedMemo(content.memo ?? '')
            setEditedTagIds(content.content_tags.map(ct => ct.tag_id))
          }
          setIsEditing(false)
        }},
      ])
    } else {
      setIsEditing(!isEditing)
    }
  }
  // ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={C.primary} />
      </View>
    )
  }
  if (!content) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.textSec }}>콘텐츠를 찾을 수 없어요.</Text>
      </View>
    )
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.headerIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{isEditing ? '수정하기' : ''}</Text>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={handleEditPress} style={s.headerBtn}>
            <Text style={s.headerIcon}>{isEditing ? '✕' : '✏️'}</Text>
          </TouchableOpacity>
          {!isEditing && (
            <TouchableOpacity onPress={handleDelete} style={s.headerBtn}>
              <Text style={s.headerIcon}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 콘텐츠 본문 */}
      {content.type === 'image' && content.image_url ? (
        <Image source={{ uri: content.image_url }} style={s.image} />
      ) : isEditing ? (
        <TextInput
          style={s.textArea}
          value={editedBody}
          onChangeText={setEditedBody}
          multiline
          textAlignVertical="top"
          placeholderTextColor={C.textSec}
        />
      ) : (
        <View style={s.textCard}>
          <Text style={s.bodyText}>{content.body}</Text>
        </View>
      )}

      {/* 날짜 (뷰 모드만) */}
      {!isEditing && (
        <Text style={s.dateText}>
          {new Date(content.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </Text>
      )}

      {/* 메모 */}
      <Text style={s.label}>메모</Text>
      {isEditing ? (
        <TextInput
          style={s.memoInput}
          value={editedMemo}
          onChangeText={setEditedMemo}
          placeholder="메모를 입력하세요."
          placeholderTextColor={C.textSec}
          multiline
        />
      ) : (
        <Text style={s.memoText}>{content.memo || '—'}</Text>
      )}

      {/* 태그 */}
      <Text style={s.label}>태그</Text>
      {isEditing ? (
        <View style={s.tagGrid}>
          {tags.map(tag => (
            <TouchableOpacity
              key={tag.id}
              style={[s.tagBtn, editedTagIds.includes(tag.id) && s.tagBtnSel]}
              onPress={() => toggleTag(tag.id)}
            >
              <Text style={s.tagText}>{tag.emoji} {tag.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={s.tagGrid}>
          {content.content_tags.length > 0
            ? content.content_tags.map(ct => (
                <View key={ct.tag_id} style={s.tagBtnSel}>
                  <Text style={s.tagText}>{ct.tags.emoji} {ct.tags.name}</Text>
                </View>
              ))
            : <Text style={{ color: C.textSec }}>태그 없음</Text>
          }
        </View>
      )}

      {/* 저장 버튼 (편집 모드) */}
      {isEditing && (
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color={C.text} />
            : <Text style={s.saveBtnText}>저장</Text>
          }
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 48 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24, paddingTop: 8,
  },
  headerIcon: { color: C.textSec, fontSize: 20, padding: 4 },
  headerTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: 4 },
  image: { width: '100%', height: 260, borderRadius: 14, marginBottom: 16, resizeMode: 'cover' },
  textCard: { backgroundColor: C.card, borderRadius: 14, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  bodyText: { color: C.text, fontSize: 16, lineHeight: 26 },
  textArea: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    color: C.text, fontSize: 15, minHeight: 140, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  dateText: { color: C.textSec, fontSize: 12, marginBottom: 24 },
  label: { color: C.textSec, fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  memoInput: {
    backgroundColor: C.card, borderRadius: 12, padding: 14,
    color: C.text, fontSize: 14, marginBottom: 20,
    borderWidth: 1, borderColor: C.border,
  },
  memoText: { color: C.text, fontSize: 14, marginBottom: 20, lineHeight: 22 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  tagBtn: {
    backgroundColor: C.tagBg, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: C.border,
  },
  tagBtnSel: {
    backgroundColor: C.tagSel, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: C.tagSel,
  },
  tagText: { color: C.text, fontSize: 13 },
  saveBtn: { backgroundColor: C.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnText: { color: C.text, fontSize: 16, fontWeight: '600' },
})
