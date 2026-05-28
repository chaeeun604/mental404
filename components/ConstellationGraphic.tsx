import { View, StyleSheet } from 'react-native'
import Svg, { Rect, Circle, Line, Ellipse, Defs, ClipPath, G, RadialGradient, Stop } from 'react-native-svg'

// Star positions inside 248×186 card — matched to Figma constellation pattern
const STARS = [
  { x: 48,  y: 128, r: 5.5, bright: true  },  // bottom-left large
  { x: 82,  y: 103, r: 4,   bright: true  },  // mid-left
  { x: 118, y: 88,  r: 3.5, bright: false },  // mid-center
  { x: 162, y: 73,  r: 5,   bright: true  },  // upper-right large
  { x: 198, y: 65,  r: 3.5, bright: false },  // top-right
]

const LINES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
]

// Decorative stars scattered around (outside card boundaries)
const DECO_STARS = [
  { x: -20, y: 30,  r: 7  },
  { x: 268, y: 55,  r: 5  },
  { x: 25,  y: -8,  r: 4  },
  { x: 215, y: 178, r: 4.5},
  { x: -8,  y: 155, r: 3  },
]

export default function ConstellationGraphic() {
  return (
    <View style={styles.wrapper}>
      <Svg width={280} height={210} viewBox="-16 -16 280 218">
        <Defs>
          <ClipPath id="card-clip2">
            <Rect width={248} height={186} rx={32} />
          </ClipPath>
          <RadialGradient id="glow-top" cx="50%" cy="20%" r="70%">
            <Stop offset="0%"  stopColor="#767DFF" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#767DFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Dark card background */}
        <Rect width={248} height={186} rx={32} fill="#02061C" />

        {/* Subtle inner glow at top */}
        <G clipPath="url(#card-clip2)">
          <Rect width={248} height={186} rx={32} fill="url(#glow-top)" />
          {/* Inner glow ellipse */}
          <Ellipse cx={124} cy={44} rx={110} ry={50}
            fill="#767DFF" fillOpacity={0.18} />
        </G>

        {/* Connecting lines — thin and subtle */}
        {LINES.map(([a, b], i) => (
          <Line
            key={i}
            x1={STARS[a].x} y1={STARS[a].y}
            x2={STARS[b].x} y2={STARS[b].y}
            stroke="rgba(200,210,255,0.5)"
            strokeWidth={0.8}
          />
        ))}

        {/* Stars — multi-layer glow matching Figma */}
        {STARS.map((s, i) => (
          <G key={i}>
            {/* Outer faint halo */}
            <Circle cx={s.x} cy={s.y} r={s.r * 5}
              fill="white" fillOpacity={s.bright ? 0.04 : 0.02} />
            {/* Mid halo */}
            <Circle cx={s.x} cy={s.y} r={s.r * 2.8}
              fill="white" fillOpacity={s.bright ? 0.12 : 0.06} />
            {/* Inner halo */}
            <Circle cx={s.x} cy={s.y} r={s.r * 1.6}
              fill="white" fillOpacity={s.bright ? 0.30 : 0.15} />
            {/* Bright core */}
            <Circle cx={s.x} cy={s.y} r={s.r}
              fill="white" fillOpacity={1} />
          </G>
        ))}

        {/* Decorative stars outside card (sparkle effect) */}
        {DECO_STARS.map((s, i) => (
          <G key={`d-${i}`}>
            <Circle cx={s.x} cy={s.y} r={s.r * 3.5}
              fill="white" fillOpacity={0.05} />
            <Circle cx={s.x} cy={s.y} r={s.r * 1.5}
              fill="white" fillOpacity={0.18} />
            <Circle cx={s.x} cy={s.y} r={s.r * 0.5}
              fill="white" fillOpacity={0.95} />
          </G>
        ))}
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: 280,
    height: 210,
  },
})
