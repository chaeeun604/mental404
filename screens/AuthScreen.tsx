import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async () => {
    try {
      if (isSignUp) {
        await signUp(email, password)
        Alert.alert('확인 이메일을 보냈습니다.')
      } else {
        await signIn(email, password)
      }
    } catch (e: any) {
      Alert.alert('오류', e.message)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>mental404</Text>
      <TextInput style={styles.input} placeholder="이메일" value={email}
        onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="비밀번호" value={password}
        onChangeText={setPassword} secureTextEntry />
      <Button title={isSignUp ? '회원가입' : '로그인'} onPress={handleSubmit} />
      <Button title={isSignUp ? '이미 계정이 있어요' : '계정 만들기'}
        onPress={() => setIsSignUp((v) => !v)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
})