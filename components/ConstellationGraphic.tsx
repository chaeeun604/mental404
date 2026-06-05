import { Image, StyleSheet } from 'react-native'

// image 63.svg에서 추출한 별자리 그래픽 (원본: 780×641px)
export default function ConstellationGraphic() {
  return (
    <Image
      source={require('../assets/constellation_graphic.png')}
      style={styles.image}
      resizeMode="contain"
    />
  )
}

const styles = StyleSheet.create({
  image: {
    width: 280,
    height: 230,
  },
})
