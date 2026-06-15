import { Platform, Dimensions } from 'react-native'

export const APP_MAX_WIDTH = 390

const dims = Dimensions.get('window')
export const SCREEN_WIDTH = Platform.OS === 'web'
  ? Math.min(dims.width, APP_MAX_WIDTH)
  : dims.width
export const SCREEN_HEIGHT = dims.height
