import { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { getContentById, deleteContent, updateContent } from '../api/contents'
import { Colors } from '../constants/colors'
import type { ScreenProps } from '../types/navigation'
import type { ContentWithTags } from '../types/database'

export default function ContentDetailScreen({
  route,
  navigation,
}: ScreenProps<'ContentDetail'>) {
  const { contentId } = route.params
  const [content, setContent] = useState<ContentWithTags | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState('')
  const [editMemo, setEditMemo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getContentById(contentId)
      .then((found) => {
        setContent(found)
        if (found) {
          setEditBody(found.body ?? '')
          setEditMemo(found.memo ?? '')
        }
      })
      .catch(() => Alert.alert('오류', '내용을 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }, [])

  const hasChanges =
    (editBody !== (content?.body ?? '') || editMemo !== (content?.memo ?? '')) &&
    !(content?.type === 'text' && editBody.trim() === '')

  const handleSave = async () => {
    if (!content || !hasChanges) return
    setSaving(true)
    try {
      await updateContent(contentId, { body: editBody, memo: editMemo })
      setContent((prev) => prev ? { ...prev, body: editBody, memo: editMemo } : prev)
      setEditing(false)
    } catch (e: any) {
      Alert.alert('오류', e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (hasChanges) {
      Alert.alert('편집 취소', '변경 사항을 저장하지 않을까요?', [
        { text: '계속 편집', style: 'cancel' },
        {
          text: '취소',
          style: 'destructive',
          onPress: () => {
            setEditBody(content?.body ?? '')
            setEditMemo(content?.memo ?? '')
            setEditing(false)
          },
        },
      ])
    } else {
      setEditing(false)
    }
  }

  const handleDelete = () => {
    Alert.alert('기록 삭제', '이 기억을 삭제할까요?\n삭제한 기록은 복구할 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    )
  }

  if (!content) {
    return (
      <View style={styles.container}>
        <SafeAreaView>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.emptyText}>기억을 찾을 수 없어요.</Text>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerDate}>
            {new Date(content.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <View style={styles.headerActions}>
            {editing ? (
              <>
                <TouchableOpacity onPress={handleCancelEdit} style={styles.headerBtn}>
                  <Text style={styles.cancelText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!hasChanges || saving}
                  style={styles.headerBtn}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Text style={[styles.saveText, !hasChanges && styles.saveTextDisabled]}>
                      저장
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setEditing(true)} style={styles.headerBtn}>
                  <Ionicons name="pencil-outline" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
                  <Ionicons name="trash-outline" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Tag chips */}
          <View style={styles.tags}>
            {content.content_tags?.map((ct) => (
              <View key={ct.tag_id} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{ct.tags?.name}</Text>
              </View>
            ))}
          </View>

          {/* Image */}
          {content.type === 'image' && content.image_url ? (
            <Image source={{ uri: content.image_url }} style={styles.image} />
          ) : null}

          {/* Body */}
          {content.type === 'text' ? (
            editing ? (
              <TextInput
                style={styles.editArea}
                value={editBody}
                onChangeText={setEditBody}
                multiline
                textAlignVertical="top"
                autoFocus
                placeholderTextColor={Colors.textTertiary}
              />
            ) : (
              content.body ? <Text style={styles.bodyText}>{content.body}</Text> : null
            )
          ) : null}

          {/* Memo */}
          {editing ? (
            <View style={styles.memoSection}>
              <Text style={styles.memoLabel}>메모</Text>
              <TextInput
                style={styles.editMemoInput}
                value={editMemo}
                onChangeText={setEditMemo}
                placeholder="메모를 남겨보세요"
                placeholderTextColor={Colors.textTertiary}
                multiline
              />
            </View>
          ) : content.memo ? (
            <View style={styles.memoSection}>
              <Text style={styles.memoLabel}>메모</Text>
              <Text style={styles.memoText}>{content.memo}</Text>
            </View>
          ) : null}

          {/* Source */}
          {!editing && content.source ? (
            <View style={styles.sourceRow}>
              <Ionicons name="link-outline" size={14} color={Colors.primaryLight} />
              <Text style={styles.sourceText}>{content.source}</Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgMain },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bgMain,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerDate: { fontSize: 14, color: Colors.textSecondary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerBtn: { padding: 6 },
  cancelText: { fontSize: 14, color: Colors.textSecondary },
  saveText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  saveTextDisabled: { color: Colors.textTertiary },
  backBtn: { padding: 16 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 20, paddingBottom: 40 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagChipText: { fontSize: 13, color: Colors.primaryLight, fontWeight: '500' },
  image: { width: '100%', height: 300, borderRadius: 16, resizeMode: 'cover' },
  bodyText: { fontSize: 16, color: Colors.textPrimary, lineHeight: 26 },
  editArea: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    minHeight: 160,
  },
  memoSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  memoLabel: { fontSize: 12, color: Colors.textTertiary, fontWeight: '500' },
  memoText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  editMemoInput: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
    minHeight: 60,
  },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceText: { fontSize: 13, color: Colors.primaryLight },
  emptyText: { padding: 20, color: Colors.textSecondary, textAlign: 'center' },
})