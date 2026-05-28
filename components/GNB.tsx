import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../constants/colors'

type Tab = 'report' | 'graphic' | 'list'

interface GNBProps {
  activeTab: Tab
  onReport: () => void
  onGraphic: () => void
  onList: () => void
  onCreate: () => void
}

export default function GNB({ activeTab, onReport, onGraphic, onList, onCreate }: GNBProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {/* Report circle */}
      <TouchableOpacity style={styles.circleBtn} onPress={onReport} activeOpacity={0.8}>
        <Ionicons
          name="bar-chart-outline"
          size={22}
          color={activeTab === 'report' ? Colors.primaryLight : Colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Graphic / List toggle pill */}
      <View style={styles.pill}>
        <TouchableOpacity style={styles.pillHalf} onPress={onGraphic} activeOpacity={0.7}>
          <Ionicons
            name="planet-outline"
            size={22}
            color={activeTab === 'graphic' ? Colors.textPrimary : Colors.textTertiary}
          />
        </TouchableOpacity>
        <View style={styles.pillDivider} />
        <TouchableOpacity style={styles.pillHalf} onPress={onList} activeOpacity={0.7}>
          <Ionicons
            name="list-outline"
            size={22}
            color={activeTab === 'list' ? Colors.textPrimary : Colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {/* Create circle with gradient */}
      <TouchableOpacity style={styles.circleBtn} onPress={onCreate} activeOpacity={0.8}>
        <LinearGradient
          colors={['#3B21FB', '#AEF1FF']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.createGradient}
        >
          <Ionicons name="add" size={26} color={Colors.textPrimary} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 16,
    backgroundColor: Colors.bgMain,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  circleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    width: 112,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pillHalf: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.textTertiary,
    opacity: 0.4,
  },
  createGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
})