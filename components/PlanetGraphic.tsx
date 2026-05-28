import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

// Figma 디자인 기준 태그별 행성 정의
const PLANET_DEFS = [
  // 0: 무기력할 때 — 깊고 둥근 파란 행성
  {
    colors: ['#3B5EE8', '#0A1E7C'] as [string, string],
    glow: '#4B73FF',
    tl: 0.68, tr: 0.60, br: 0.72, bl: 0.62,
  },
  // 1: 걱정할 때 — 청록빛 행성
  {
    colors: ['#1A8FAA', '#083060'] as [string, string],
    glow: '#2EC8E8',
    tl: 0.60, tr: 0.72, br: 0.55, bl: 0.70,
  },
  // 2: 자신감이 필요할 때 — 불규칙 초록 블롭 (Figma 기준)
  {
    colors: ['#2EA855', '#0A5020'] as [string, string],
    glow: '#40D870',
    tl: 0.82, tr: 0.44, br: 0.65, bl: 0.80,
  },
  // 3: 기대고 싶을 때 — 보라 행성
  {
    colors: ['#7C3DC8', '#280A6E'] as [string, string],
    glow: '#9B5CFF',
    tl: 0.65, tr: 0.65, br: 0.75, bl: 0.55,
  },
  // 4: 웃고 싶을 때 — 따뜻한 금빛 행성
  {
    colors: ['#D4820E', '#5A2E00'] as [string, string],
    glow: '#F0A830',
    tl: 0.55, tr: 0.78, br: 0.65, bl: 0.60,
  },
]

interface Props {
  tagIndex: number
  size?: number
}

export default function PlanetGraphic({ tagIndex, size = 290 }: Props) {
  const def = PLANET_DEFS[tagIndex % PLANET_DEFS.length]

  const blobRadii = {
    borderTopLeftRadius:     size * def.tl,
    borderTopRightRadius:    size * def.tr,
    borderBottomRightRadius: size * def.br,
    borderBottomLeftRadius:  size * def.bl,
  }

  return (
    <View style={{ width: size, height: size }}>
      {/* 대기 글로우 (외곽 흐릿한 원) */}
      <View
        style={{
          position: 'absolute',
          width: size * 1.20,
          height: size * 1.20,
          borderRadius: (size * 1.20) / 2,
          backgroundColor: def.glow,
          opacity: 0.18,
          top: -(size * 0.10),
          left: -(size * 0.10),
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 1.08,
          height: size * 1.08,
          borderRadius: (size * 1.08) / 2,
          backgroundColor: def.glow,
          opacity: 0.12,
          top: -(size * 0.04),
          left: -(size * 0.04),
        }}
      />

      {/* 행성 본체 — Figma 블롭 형태 */}
      <LinearGradient
        colors={def.colors}
        start={{ x: 0.25, y: 0.0 }}
        end={{ x: 0.80, y: 1.0 }}
        style={[
          {
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
          },
          blobRadii,
        ]}
      />

      {/* 하이라이트 (표면 반사광) */}
      <View
        style={{
          position: 'absolute',
          width: size * 0.35,
          height: size * 0.22,
          borderRadius: size * 0.15,
          backgroundColor: 'white',
          opacity: 0.14,
          top: size * 0.10,
          left: size * 0.12,
        }}
      />

      {/* 밴드 1 (구름띠) */}
      <View
        style={{
          position: 'absolute',
          width: size * 0.75,
          height: size * 0.07,
          borderRadius: size * 0.04,
          backgroundColor: 'rgba(255,255,255,0.07)',
          top: size * 0.30,
          left: size * 0.12,
          ...blobRadii,
          overflow: 'hidden',
        }}
      />
      {/* 밴드 2 */}
      <View
        style={{
          position: 'absolute',
          width: size * 0.60,
          height: size * 0.05,
          borderRadius: size * 0.03,
          backgroundColor: 'rgba(0,0,0,0.10)',
          top: size * 0.50,
          left: size * 0.18,
        }}
      />
    </View>
  )
}
