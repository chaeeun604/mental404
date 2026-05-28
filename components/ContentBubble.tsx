import { View, Text, Image, StyleSheet, Platform } from 'react-native'
import type { ContentWithTags } from '../types/database'

interface Props {
  item: ContentWithTags
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

export default function ContentBubble({ item }: Props) {
  if (item.type === 'image' && item.image_url) {
    return (
      <View style={styles.imagePill}>
        <Image source={{ uri: item.image_url }} style={styles.thumbnail} />
      </View>
    )
  }

  return (
    <View style={styles.textPill}>
      <Text style={styles.text} numberOfLines={1}>
        {item.body ? truncate(item.body, 14) : '...'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  textPill: {
    backgroundColor: 'rgba(251,252,254,0.15)',
    borderWidth: 1,
    borderColor: '#8fc0ff',
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 145,
    ...(Platform.OS === 'web' ? {} : {}),
  },
  imagePill: {
    backgroundColor: 'rgba(251,252,254,0.15)',
    borderWidth: 1,
    borderColor: '#8fc0ff',
    borderRadius: 8,
    padding: 4,
  },
  thumbnail: {
    width: 42,
    height: 56,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    color: '#fbfcfe',
    fontFamily: 'Pretendard-Regular',
  },
})
