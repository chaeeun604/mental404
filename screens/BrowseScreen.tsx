import { View, Text, StyleSheet } from 'react-native'
export default function BrowseScreen({ route }: any) {
  const { tagName } = route?.params ?? {}
  return <View style={s.c}><Text style={s.t}>{tagName ?? '콘텐츠 목록'}</Text></View>
}
const s = StyleSheet.create({ c: { flex:1, justifyContent:'center', alignItems:'center' }, t: { fontSize:22, fontWeight:'bold' } })
