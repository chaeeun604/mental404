import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      {/* Report circle */}
      <TouchableOpacity style={styles.circleBtn} onPress={onReport} activeOpacity={0.8}>
        <Ionicons
          name="bar-chart-outline"
          size={18}
          color={activeTab === 'report' ? '#fbfcfe' : '#9A9AB3'}
        />
      </TouchableOpacity>

      {/* Graphic / List toggle pill */}
      <View style={styles.pill}>
        {/* Sliding active indicator */}
        {activeTab === 'graphic' && <View style={[styles.pillIndicator, { left: 4 }]} />}
        {activeTab === 'list'    && <View style={[styles.pillIndicator, { right: 4 }]} />}

        <TouchableOpacity style={styles.pillHalf} onPress={onGraphic} activeOpacity={0.8}>
          <Ionicons
            name="planet-outline"
            size={20}
            color={activeTab === 'graphic' ? '#1A1C20' : '#9A9AB3'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.pillHalf} onPress={onList} activeOpacity={0.8}>
          <Ionicons
            name="list-outline"
            size={20}
            color={activeTab === 'list' ? '#1A1C20' : '#9A9AB3'}
          />
        </TouchableOpacity>
      </View>

      {/* Create circle — gradient */}
      <TouchableOpacity onPress={onCreate} activeOpacity={0.8}>
        <LinearGradient
          colors={['#3B21FB', '#AEF1FF']}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.createBtn}
        >
          <Ionicons name="add" size={24} color="#fbfcfe" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#101640',
  },
  circleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2d3052',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    width: 112,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2d3052',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  pillIndicator: {
    position: 'absolute',
    top: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fbfcfe',
    zIndex: 0,
  },
  pillHalf: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  createBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
