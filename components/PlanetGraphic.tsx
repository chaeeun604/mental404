import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors } from '../constants/colors'
import type { ReactNode } from 'react'

const BLOB_SHAPES = [
  { tl: 0.70, tr: 0.55, br: 0.75, bl: 0.60 },
  { tl: 0.60, tr: 0.80, br: 0.50, bl: 0.70 },
  { tl: 0.80, tr: 0.60, br: 0.70, bl: 0.55 },
  { tl: 0.55, tr: 0.70, br: 0.60, bl: 0.75 },
  { tl: 0.65, tr: 0.65, br: 0.80, bl: 0.55 },
]

interface Props {
  tagIndex: number
  size?: number
  style?: object
  children?: ReactNode
}

export default function PlanetGraphic({ tagIndex, size = 120, style, children }: Props) {
  const idx = tagIndex % Colors.planets.length
  const [startColor, endColor] = Colors.planets[idx]
  const s = BLOB_SHAPES[idx]
  const radii = {
    borderTopLeftRadius: size * s.tl,
    borderTopRightRadius: size * s.tr,
    borderBottomRightRadius: size * s.br,
    borderBottomLeftRadius: size * s.bl,
  }

  return (
    <View style={[{ width: size, height: size }, style]}>
      <LinearGradient
        colors={[startColor, endColor]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, radii]}
      />
      {children && (
        <View
          style={[
            { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
            radii,
          ]}
        >
          {children}
        </View>
      )}
    </View>
  )
}