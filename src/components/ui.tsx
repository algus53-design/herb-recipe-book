// 공용 UI 조각
import { Text, View } from 'react-native';
import { Category } from '../types';

export function CategoryTag({ category }: { category: Category }) {
  const oral = category === 'oral';
  return (
    <View className={`px-2 py-0.5 rounded-full ${oral ? 'bg-herb-light' : 'bg-topical-light'}`}>
      <Text className={`text-[11px] font-bold ${oral ? 'text-herb-dark' : 'text-topical-dark'}`}>
        {oral ? '내복' : '외용'}
      </Text>
    </View>
  );
}

export function FormBadge({ form }: { form: string }) {
  if (!form) return null;
  return (
    <View className="px-2 py-0.5 rounded-md border border-gray-200">
      <Text className="text-[11px] text-muted">{form}</Text>
    </View>
  );
}

export function Chip({ label }: { label: string }) {
  return (
    <View className="bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
      <Text className="text-[11px] text-muted">{label}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <View className="flex-row items-center gap-2 mt-6 mb-2">
      <Text className="text-sm font-bold text-ink">{children}</Text>
      <View className="flex-1 h-px bg-gray-200" />
    </View>
  );
}
