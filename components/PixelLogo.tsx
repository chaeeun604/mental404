import { View, StyleSheet } from 'react-native'

// Each letter is a 5-column grid. 1 = filled dot, 0 = empty
// Extracted from Figma node pixel art (5×7 grid per letter, gap 1.107px)
const LETTERS: Record<string, number[][]> = {
  M: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  O: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 1, 0],
    [0, 1, 1, 0, 0],
  ],
  R: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  B: [
    [1, 0, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 1],
    [0, 0, 0, 0, 0],
  ],
  I: [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [1, 0, 1, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  T: [
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0],
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
          <View key={li} style={[styles.letter, li < WORD.length - 1 && { marginRight: letterSpacing }]}>
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  letter: {
    flexDirection: 'column',
    gap: 1.107,
  },
  dotRow: {
    flexDirection: 'row',
  },
})
