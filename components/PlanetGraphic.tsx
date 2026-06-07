import { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'

const PLANET_IMAGES = [
  require('../assets/planets/planet0.png'),
  require('../assets/planets/planet1.png'),
  require('../assets/planets/planet2.png'),
  require('../assets/planets/planet3.png'),
  require('../assets/planets/planet4.png'),
  require('../assets/planets/planet5.png'),
  require('../assets/planets/planet6.png'),
  require('../assets/planets/planet7.png'),
  require('../assets/planets/planet8.png'),
  require('../assets/planets/planet9.png'),
]

interface Props {
  tagIndex: number
  size?: number
}

export default function PlanetGraphic({ tagIndex, size = 290 }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [floatAnim])

  return (
    <Animated.Image
      source={PLANET_IMAGES[tagIndex % PLANET_IMAGES.length]}
      style={{ width: size, height: size, transform: [{ translateY: floatAnim }] }}
      resizeMode="contain"
    />
  )
}
