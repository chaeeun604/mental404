import { Platform, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import type { RootStackParamList } from './types/navigation'

// expo-notifications는 web을 지원하지 않으므로 native에서만 초기화
if (Platform.OS !== 'web') {
  const Notifications = require('expo-notifications')
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
}

import SplashScreen from './screens/SplashScreen'
import AuthScreen from './screens/AuthScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import HomeScreen from './screens/HomeScreen'
import ShootingStarScreen from './screens/ShootingStarScreen'
import CreateScreen from './screens/CreateScreen'
import ContentDetailScreen from './screens/ContentDetailScreen'
import ReportScreen from './screens/ReportScreen'
import MyPageScreen from './screens/MyPageScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Pretendard-Regular':  require('./assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium':   require('./assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.ttf'),
    'Pretendard-Bold':     require('./assets/fonts/Pretendard-Bold.ttf'),
  })

  if (!fontsLoaded && !fontError) return null

  const nav = (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false, animation: 'fade' }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="ShootingStar"
            component={ShootingStarScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="Create" component={CreateScreen} />
          <Stack.Screen name="ContentDetail" component={ContentDetailScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
          <Stack.Screen name="MyPage" component={MyPageScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#080711' }}>
        <View style={{ flex: 1, width: '100%', maxWidth: 390 }}>
          {nav}
        </View>
      </View>
    )
  }

  return nav
}
