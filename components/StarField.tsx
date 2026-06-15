import { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { SCREEN_WIDTH as width, SCREEN_HEIGHT as height } from '../constants/layout'

// 작은 별 100개 + 밝은 별 20개
const SMALL_COUNT  = 100
const BRIGHT_COUNT = 20

export default function StarField() {
  const stars = useMemo(() => {
    const small = Array.from({ length: SMALL_COUNT }, (_, i) => ({
      key: i,
      left: Math.random() * width,
      top: Math.random() * height,
      size: Math.random() * 1.5 + 1,
      opacity: Math.random() * 0.35 + 0.25,
    }))
    const bright = Array.from({ length: BRIGHT_COUNT }, (_, i) => ({
      key: SMALL_COUNT + i,
      left: Math.random() * width,
      top: Math.random() * height,
      size: Math.random() * 1.5 + 2,
      opacity: Math.random() * 0.3 + 0.55,
    }))
    return [...small, ...bright]
  }, [])

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map(s => (
        <View
          key={s.key}
          style={[styles.star, {
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            opacity: s.opacity,
          }]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
})
