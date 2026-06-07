import type { NativeStackScreenProps } from '@react-navigation/native-stack'

export type RootStackParamList = {
  Splash: undefined
  Auth: undefined
  Onboarding: undefined
  Home: undefined
  ShootingStar: undefined
  Create: undefined
  ContentDetail: { contentId: string }
  Report: undefined
  MyPage: undefined
}

export type ScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>