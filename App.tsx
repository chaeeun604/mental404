import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import type { RootStackParamList } from './types/navigation'

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
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular':  require('./assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium':   require('./assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.ttf'),
    'Pretendard-Bold':     require('./assets/fonts/Pretendard-Bold.ttf'),
  })

  if (!fontsLoaded) return null

  return (
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
}
