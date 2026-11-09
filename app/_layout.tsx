import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import useRecipeStore from '../src/store/recipeStore';
import useAuthStore from '../src/store/authStore';
import AuthGate from '../src/components/AuthGate';

export default function RootLayout() {
  const hydrate = useRecipeStore((s) => s.hydrate);
  const verified = useAuthStore((s) => s.verified);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!verified) {
    return (
      <SafeAreaProvider>
        <AuthGate />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#4F7942' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#F7F8F5' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="recipe/[id]" options={{ title: '레시피' }} />
        <Stack.Screen name="recipe/new" options={{ title: '새 레시피' }} />
        <Stack.Screen name="recipe/[id]/edit" options={{ title: '레시피 편집' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
