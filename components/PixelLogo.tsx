import { View, StyleSheet } from 'react-native'

// Dot patterns extracted exactly from Figma node pixel art (5-col × 7-row grid)
// 1 = filled white dot, 0 = empty
const LETTERS: Record<string, number[][]> = {
  M: [
    [0, 1, 1, 1, 0], // _XXX_
    [1, 0, 1, 0, 1], // X_X_X
    [1, 0, 1, 0, 1], // X_X_X
    [1, 0, 0, 0, 1], // X___X
    [1, 0, 0, 0, 1], // X___X
    [1, 0, 0, 0, 1], // X___X
    [0, 0, 0, 0, 0],
  ],
  O: [
    [0, 1, 1, 1, 0], // _XXX_
    [1, 0, 0, 0, 1], // X___X
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0], // _XXX_
    [0, 0, 0, 0, 0],
  ],
  R: [
    [0, 1, 1, 1, 0], // _XXX_
    [1, 0, 0, 0, 1], // X___X
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0], // XXXX_
    [1, 0, 1, 0, 0], // X_X__
    [1, 0, 0, 1, 1], // X__XX
    [0, 0, 0, 0, 0],
  ],
  B: [
    [0, 1, 1, 1, 0], // _XXX_
    [1, 0, 0, 0, 1], // X___X
    [1, 1, 1, 1, 0], // XXXX_
    [1, 0, 0, 0, 1], // X___X
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0], // XXXX_
    [0, 0, 0, 0, 0],
  ],
  I: [
    [0, 1, 1, 1, 0], // _XXX_
    [0, 0, 1, 0, 0], // __X__
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0], // _XXX_
    [0, 0, 0, 0, 0],
  ],
  T: [
    [1, 1, 1, 1, 1], // XXXXX
    [0, 0, 1, 0, 0], // __X__
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
  ],
}

const WORD = ['M', 'O', 'R', 'B', 'I', 'T']

interface Props {
  dotSize?: number
  gap?: number
  color?: string
  letterSpacing?: number
}

export default function PixelLogo({
  dotSize = 5.538,
  gap = 1.107,
  color = '#fbfcfe',
  letterSpacing = 4,
}: Props) {
  return (
    <View style={styles.row}>
      {WORD.map((char, li) => {
        const grid = LETTERS[char]
        return (
          <View
            key={li}
            style={[styles.letter, li < WORD.length - 1 && { marginRight: letterSpacing }]}
          >
            {grid.map((row, ri) => (
              <View key={ri} style={[styles.dotRow, { gap }]}>
                {row.map((on, ci) => (
                  <View
                    key={ci}
                    style={{
                      width: dotSize,
                      height: dotSize,
                      borderRadius: dotSize / 2,
                      backgroundColor: on ? color : 'transparent',
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'flex-start' },
  letter: { flexDirection: 'column', gap: 1.107 },
  dotRow: { flexDirection: 'row' },
})
