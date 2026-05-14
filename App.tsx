import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from './hooks/useAuth'
import AuthScreen from './screens/AuthScreen'
import HomeScreen from './screens/HomeScreen'
import CreateScreen from './screens/CreateScreen'
import BrowseScreen from './screens/BrowseScreen'
import ReportScreen from './screens/ReportScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  const { session, loading } = useAuth()
  if (loading) return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator /></View>

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Create" component={CreateScreen} />
            <Stack.Screen name="Browse" component={BrowseScreen} />
            <Stack.Screen name="Report" component={ReportScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}