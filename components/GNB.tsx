import { useRef, useEffect } from 'react'
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native'
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

// pill 너비 112, indicator 너비 48
// graphic: left=4  → translateX=4
// list:    right=4 → translateX=112-48-4=60
const INDICATOR_X_GRAPHIC = 4
const INDICATOR_X_LIST    = 60

export default function GNB({ activeTab, onReport, onGraphic, onList, onCreate }: GNBProps) {
  const insets = useSafeAreaInsets()

  const indicatorX       = useRef(new Animated.Value(
    activeTab === 'list' ? INDICATOR_X_LIST : INDICATOR_X_GRAPHIC
  )).current
  const indicatorOpacity = useRef(new Animated.Value(
    activeTab === 'report' ? 0 : 1
  )).current

  useEffect(() => {
    if (activeTab === 'report') {
      Animated.timing(indicatorOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.parallel([
        Animated.timing(indicatorOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(indicatorX, {
          toValue: activeTab === 'graphic' ? INDICATOR_X_GRAPHIC : INDICATOR_X_LIST,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [activeTab])

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
        <Animated.View style={[styles.pillIndicator, {
          opacity: indicatorOpacity,
          transform: [{ translateX: indicatorX }],
        }]} />

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
    backgroundColor: 'transparent',
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
    left: 0,
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
