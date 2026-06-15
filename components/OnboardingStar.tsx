import { Platform, Image } from 'react-native'
import { SvgXml } from 'react-native-svg'

const SVG = `<svg width="83" height="83" viewBox="0 0 83 83" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_1275_1906)">
<path d="M39.2732 31.1346C39.5456 30.3914 40.5326 30.2444 41.0099 30.8759L44.522 35.5227C44.7031 35.7623 44.9824 35.9079 45.2826 35.919L51.1033 36.1357C51.8943 36.1651 52.3392 37.0583 51.8861 37.7074L48.552 42.4835C48.38 42.7299 48.3279 43.0404 48.4101 43.3294L50.0028 48.9322C50.2192 49.6936 49.5072 50.3927 48.7499 50.1623L43.1772 48.4673C42.8898 48.3799 42.5783 48.4263 42.3289 48.5937L37.4925 51.8398C36.8352 52.281 35.9503 51.8198 35.9354 51.0284L35.8254 45.2047C35.8197 44.9043 35.6793 44.6224 35.443 44.4369L30.8612 40.8404C30.2386 40.3516 30.4037 39.3675 31.1518 39.1087L36.6565 37.2044C36.9404 37.1062 37.1651 36.8856 37.2685 36.6036L39.2732 31.1346Z" fill="url(#paint0_radial_1275_1906)"/>
</g>
<defs>
<filter id="filter0_d_1275_1906" x="0" y="0.000116348" width="82.5461" height="82.4893" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feMorphology radius="20.4784" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_1275_1906"/>
<feOffset/>
<feGaussianBlur stdDeviation="5"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.708247 0 0 0 0 0.692892 0 0 0 0 1 0 0 0 1 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1275_1906"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1275_1906" result="shape"/>
</filter>
<radialGradient id="paint0_radial_1275_1906" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(44.4255 44.2253) rotate(47.5947) scale(11.6703)">
<stop stop-color="white"/>
<stop offset="1" stop-color="#A7A2FF"/>
</radialGradient>
</defs>
</svg>`

// 웹: 브라우저가 SVG filter를 직접 렌더링 (data URI)
// 네이티브: react-native-svg의 SvgXml
const SVG_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`

interface Props {
  size?: number
}

export default function OnboardingStar({ size = 50 }: Props) {
  if (Platform.OS === 'web') {
    return (
      <Image
        source={{ uri: SVG_URI }}
        style={{ width: size, height: size }}
      />
    )
  }
  return <SvgXml xml={SVG} width={size} height={size} />
}
