import { View, Text, StyleSheet } from 'react-native'
export default function ReportScreen() {
  return <View style={s.c}><Text style={s.t}>나의 기록 리포트</Text></View>
}
const s = StyleSheet.create({ c: { flex:1, justifyContent:'center', alignItems:'center' }, t: { fontSize:22, fontWeight:'bold' } })