import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert,
} from 'react-native'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getUserSettings, upsertUserSettings } from '../api/userSettings'
import { scheduleSmartNotification, cancelAllNotifications } from '../api/notification'

const C = {
  bg: '#0d0d1e', card: '#1a1a30', primary: '#7b6ef6',
  text: '#ffffff', textSec: '#8888bb', border: '#252540', danger: '#ff5555',
}

export default function MyPageScreen({ navigation, route }: any) {
  // ── 로직 영역 ──────────────────────────────────────────────
  const { userId, email } = route.params
  const { signOut } = useAuth()
  const username = (email as string)?.split('@')[0] ?? '사용자'

  const [notifEnabled, setNotifEnabled] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserSettings(userId)
      .then(s => { if (s) setNotifEnabled(s.notification_enabled) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleNotifToggle = async (val: boolean) => {
    setNotifEnabled(val)
    try {
      if (val) {
        await scheduleSmartNotification(userId)
      } else {
        await cancelAllNotifications()
        await upsertUserSettings(userId, { notification_enabled: false })
      }
    } catch (e: any) {
      Alert.alert('오류', e.message)
    }
  }

  const handleSignOut = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃', style: 'destructive', onPress: async () => {
          try { await signOut() } catch (e: any) { Alert.alert('오류', e.message) }
        },
      },
    ])
  }
  // ──────────────────────────────────────────────────────────

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>마이페이지</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* 사용자 정보 */}
      <View style={s.userRow}>
        <Text style={s.username}>{username} 님</Text>
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
          <Text style={s.signOutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* 알림 설정 */}
      <View style={s.card}>
        <View style={s.settingRow}>
          <Text style={s.settingLabel}>별똥별 도착 알림</Text>
          <Switch
            value={notifEnabled}
            onValueChange={handleNotifToggle}
            trackColor={{ true: C.primary }}
            disabled={loading}
          />
        </View>
        <View style={[s.settingRow, { borderTopWidth: 1, borderColor: C.border, marginTop: 12, paddingTop: 12 }]}>
          <Text style={s.settingLabel}>리포트 도착 알림</Text>
          <Switch
            value={false}
            onValueChange={() => Alert.alert('준비 중', '곧 지원될 예정이에요!')}
            trackColor={{ true: C.primary }}
          />
        </View>
      </View>

      {/* 메뉴 */}
      <TouchableOpacity style={s.menuItem} onPress={() => Alert.alert('약관 및 정책', '준비 중입니다.')}>
        <Text style={s.menuLabel}>약관 및 정책</Text>
        <Text style={s.menuArrow}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.menuItem} onPress={() => Alert.alert('피드백', '준비 중입니다.')}>
        <Text style={s.menuLabel}>피드백 보내기</Text>
        <Text style={s.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.deleteBtn}
        onPress={() => Alert.alert('회원 탈퇴', '회원 탈퇴 기능은 준비 중이에요.')}
      >
        <Text style={s.deleteBtnText}>회원 탈퇴</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 48 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 28, paddingTop: 8,
  },
  back: { color: C.textSec, fontSize: 22 },
  title: { color: C.text, fontSize: 17, fontWeight: '600' },
  userRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 28,
  },
  username: { color: C.text, fontSize: 18, fontWeight: '600' },
  signOutBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  signOutText: { color: C.textSec, fontSize: 13 },
  card: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 16,
  },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLabel: { color: C.text, fontSize: 15 },
  menuItem: {
    backgroundColor: C.card, borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
  },
  menuLabel: { color: C.text, fontSize: 15 },
  menuArrow: { color: C.textSec, fontSize: 20 },
  deleteBtn: { marginTop: 24, alignItems: 'center', padding: 12 },
  deleteBtnText: { color: C.danger, fontSize: 13 },
})
