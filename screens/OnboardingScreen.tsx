import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'
import { Colors } from '../constants/colors'
import PlanetGraphic from '../components/PlanetGraphic'
import type { ScreenProps } from '../types/navigation'

const TAG_NAMES = ['무기력할 때', '걱정될 때', '자신감이 필요할 때', '기대고 싶을 때', '웃고 싶을 때']

export default function OnboardingScreen({ navigation }: ScreenProps<'Onboarding'>) {
  const { session } = useAuth()
  const username = session?.user?.email?.split('@')[0] ?? '별님'

  return (
    <LinearGradient colors={Colors.bgLoginGradient} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Text style={styles.title}>반가워요,{'\n'}{username}님!</Text>
          <Text style={styles.subtitle}>
            기억들이 별이 되어 우주를 채워갈 거예요.{'\n'}첫 번째 별을 기록해보세요.
          </Text>
        </View>

        <View style={styles.planets}>
          {TAG_NAMES.slice(0, 3).map((name, i) => (
            <View key={i} style={styles.planetItem}>
              <PlanetGraphic tagIndex={i} size={64} />
              <Text style={styles.planetLabel}>{name}</Text>
            </View>
          ))}
        </View>
        <View style={styles.planets}>
          {TAG_NAMES.slice(3).map((name, i) => (
            <View key={i + 3} style={styles.planetItem}>
              <PlanetGraphic tagIndex={i + 3} size={64} />
              <Text style={styles.planetLabel}>{name}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('Create')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>시작하기</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 32,
  },
  topSection: { alignItems: 'center', gap: 12 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  planets: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
  },
  planetItem: { alignItems: 'center', gap: 10 },
  planetLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 64,
  },
  buttonText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
})