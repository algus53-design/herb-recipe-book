// 인증 게이트 — 공통 비밀번호를 입력해야 앱 진입 가능
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../store/authStore';

export default function AuthGate() {
  const [password, setPassword] = useState('');
  const error = useAuthStore((s) => s.error);
  const verify = useAuthStore((s) => s.verify);

  return (
    <SafeAreaView className="flex-1 bg-herb-light">
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-6">
          <View className="bg-white rounded-full p-4 mb-3">
            <Text className="text-4xl">🌿🐾</Text>
          </View>
          <Text className="text-2xl font-bold text-herb-dark tracking-tight">펫허브연구소 레시피북</Text>
          <Text className="text-sm text-muted mt-1 text-center">
            MMA 허벌리스트 전용 도구입니다.{'\n'}비밀번호를 입력해 주세요.
          </Text>
        </View>

        <View className="bg-white rounded-2xl px-4 py-4">
          <Text className="text-xs font-semibold text-muted mb-1">비밀번호</Text>
          <TextInput
            className="bg-white rounded-xl px-3 py-2.5 text-sm text-ink border border-gray-200"
            value={password}
            onChangeText={setPassword}
            placeholder="공통 비밀번호"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={() => verify(password)}
          />
          {error ? <Text className="text-xs text-danger mt-2">{error}</Text> : null}

          <TouchableOpacity
            className="bg-herb rounded-2xl py-3.5 items-center mt-4"
            activeOpacity={0.85}
            onPress={() => verify(password)}
          >
            <Text className="text-white text-base font-bold">입장하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
