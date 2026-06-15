import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  size?: number
}

export default function OnboardingStar({ size = 24 }: Props) {
  return (
    <View style={{ transform: [{ rotate: '20deg' }] }}>
      <Ionicons name="star" size={size} color="#B8B3FF" />
    </View>
  )
}
