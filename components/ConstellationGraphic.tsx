import { View, StyleSheet } from 'react-native'
import Svg, {
  Rect, Circle, Line, Ellipse,
  Defs, Filter, FeGaussianBlur, FeBlend, FeFlood, ClipPath, G,
} from 'react-native-svg'

// Big Dipper star positions (normalized to 248×186 card)
const STARS = [
  { x: 58,  y: 110, r: 4,   glow: true  }, // 1
  { x: 90,  y: 90,  r: 3.5, glow: true  }, // 2
  { x: 122, y: 80,  r: 3.5, glow: false }, // 3
  { x: 154, y: 72,  r: 4,   glow: true  }, // 4
  { x: 170, y: 95,  r: 3,   glow: false }, // 5
  { x: 158, y: 118, r: 3.5, glow: true  }, // 6
  { x: 134, y: 118, r: 3,   glow: false }, // 7
]

// Connecting lines between stars (index pairs)
const LINES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
]

// Outer decorative stars (outside the card)
const OUTER_STARS = [
  { x: -16, y: 20,  r: 8 },
  { x: 270, y: 60,  r: 6 },
  { x: 30,  y: -12, r: 5 },
  { x: 220, y: 175, r: 4 },
]

export default function ConstellationGraphic() {
  return (
    <View style={styles.wrapper}>
      <Svg width={248} height={186} viewBox="0 0 248 186" overflow="visible">
        <Defs>
          <ClipPath id="card-clip">
            <Rect width={248} height={186} rx={32} />
          </ClipPath>
        </Defs>

        {/* Card background */}
        <Rect width={248} height={186} rx={32} fill="#02061C" />

        {/* Inner purple glow */}
        <G clipPath="url(#card-clip)">
          <Ellipse
            cx={124} cy={54} rx={109} ry={54}
            fill="#767DFF" fillOpacity={0.25}
          />
        </G>

        {/* Connecting lines */}
        {LINES.map(([a, b], i) => (
          <Line
            key={i}
            x1={STARS[a].x} y1={STARS[a].y}
            x2={STARS[b].x} y2={STARS[b].y}
            stroke="rgba(255,255,255,0.4)"
            strokeWidth={1}
          />
        ))}

        {/* Stars with glow */}
        {STARS.map((s, i) => (
          <G key={i}>
            {s.glow && (
              <Circle cx={s.x} cy={s.y} r={s.r * 2.5}
                fill="white" fillOpacity={0.12} />
            )}
            <Circle cx={s.x} cy={s.y} r={s.r}
              fill="white" />
          </G>
        ))}

        {/* Outer decorative stars */}
        {OUTER_STARS.map((s, i) => (
          <G key={`outer-${i}`}>
            <Circle cx={s.x} cy={s.y} r={s.r * 2}
              fill="white" fillOpacity={0.08} />
            <Circle cx={s.x} cy={s.y} r={s.r * 0.5}
              fill="white" fillOpacity={0.9} />
          </G>
        ))}
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: 248,
    height: 186,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
