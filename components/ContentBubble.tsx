import { View, Text, Image, StyleSheet, Platform, type ImageSourcePropType } from 'react-native'
import type { ContentWithTags } from '../types/database'

interface Props {
  item: ContentWithTags
  localSource?: ImageSourcePropType
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

export default function ContentBubble({ item, localSource }: Props) {
  const imageUrl = item.image_url && !item.image_url.startsWith('blob:') ? item.image_url : null
  if (item.type === 'image' && (localSource || imageUrl)) {
    return (
      <View style={styles.imagePill}>
        <Image source={localSource ?? { uri: imageUrl! }} style={styles.thumbnail} />
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
