import Svg, { Polygon } from 'react-native-svg'

// 5-pointed star, center 12.5,12.5, outer R=10, inner r=4.5
const POINTS = "12.5,2.5 15.146,8.859 22.011,9.41 16.78,13.891 18.378,20.59 12.5,17.0 6.622,20.59 8.22,13.891 2.989,9.41 9.854,8.859"

interface Props {
  size?: number
}

export default function OnboardingStar({ size = 25 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 25 25">
      <Polygon
        points={POINTS}
        fill="#B8B3FF"
        stroke="#B8B3FF"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </Svg>
  )
}
