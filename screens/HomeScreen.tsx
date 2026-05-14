import { View, Text, StyleSheet } from 'react-native'

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>지금 어떤 기분이에요?</Text>
      <Text style={styles.sub}>태그를 선택하면 위로 콘텐츠를 보여드려요</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  sub: { fontSize: 14, color: '#888' },
})