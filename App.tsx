import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from './hooks/useAuth'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import CreateScreen from './screens/CreateScreen'
import BrowseScreen from './screens/BrowseScreen'
import ReportScreen from './screens/ReportScreen'
import ContentDetailScreen from './screens/ContentDetailScreen'
import ReportDetailScreen from './screens/ReportDetailScreen'
import MyPageScreen from './screens/MyPageScreen'
import ShootingStarScreen from './screens/ShootingStarScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d0d1e' }}>
        <ActivityIndicator color="#7b6ef6" />
      </View>
    )
  }

  const userParams = session
    ? { userId: session.user.id, email: session.user.email ?? '' }
    : {}

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0d0d1e' } }}>
        {session ? (
          <>
            <Stack.Screen name="Home"          component={HomeScreen}          initialParams={userParams} />
            <Stack.Screen name="Create"        component={CreateScreen}        initialParams={userParams} />
            <Stack.Screen name="Browse"        component={BrowseScreen}        initialParams={userParams} />
            <Stack.Screen name="Report"        component={ReportScreen}        initialParams={userParams} />
            <Stack.Screen name="ContentDetail" component={ContentDetailScreen} initialParams={userParams} />
            <Stack.Screen name="ReportDetail"  component={ReportDetailScreen}  initialParams={userParams} />
            <Stack.Screen name="MyPage"         component={MyPageScreen}        initialParams={userParams} />
            <Stack.Screen name="ShootingStar"  component={ShootingStarScreen}  initialParams={userParams} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
