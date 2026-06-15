import { Ionicons } from '@expo/vector-icons'

interface Props {
  size?: number
}

export default function OnboardingStar({ size = 24 }: Props) {
  return <Ionicons name="star" size={size} color="#B8B3FF" />
}
