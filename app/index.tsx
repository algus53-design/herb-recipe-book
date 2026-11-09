// 홈 — 레시피 목록 (검색 + 외용/내복 필터)
import { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useRecipeStore from '../src/store/recipeStore';
import { Recipe, Category } from '../src/types';
import { CategoryTag, FormBadge } from '../src/components/ui';

type Filter = 'all' | Category;

export default function Home() {
  const recipes = useRecipeStore((s) => s.recipes);
  const hydrated = useRecipeStore((s) => s.hydrated);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter | null>(null);

  const counts = useMemo(
    () => ({
      all: recipes.length,
      oral: recipes.filter((r) => r.category === 'oral').length,
      topical: recipes.filter((r) => r.category === 'topical').length,
    }),
    [recipes]
  );

  const showList = filter !== null || search.trim().length > 0;
  const activeFilter = filter ?? 'all';

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipes.filter((r) => {
      if (activeFilter !== 'all' && r.category !== activeFilter) return false;
      if (!q) return true;
      const hay = `${r.nameKo} ${r.nameEn} ${r.actions.join(' ')} ${r.form}`.toLowerCase();
      return hay.includes(q);
    });
  }, [recipes, search, activeFilter]);

  return (
    <SafeAreaView className="flex-1 bg-herb-light" edges={['top', 'bottom']}>
      <View className="px-5 pt-5 pb-3">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-herb-dark tracking-tight">🌿🐾 허브 레시피북</Text>
          <TouchableOpacity
            className="bg-herb rounded-full px-4 py-2"
            activeOpacity={0.85}
            onPress={() => router.push('/recipe/new')}
          >
            <Text className="text-white text-xs font-bold">+ 새 레시피</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          className="bg-white rounded-2xl px-4 py-3 text-sm text-ink border border-gray-200 mb-3"
          value={search}
          onChangeText={setSearch}
          placeholder="레시피, 허브, 효능으로 검색"
        />

        <View className="flex-row gap-2">
          {(['all', 'oral', 'topical'] as Filter[]).map((f) => {
            const label = f === 'all' ? '전체' : f === 'oral' ? '내복' : '외용';
            const on = activeFilter === f && filter !== null;
            return (
              <TouchableOpacity
                key={f}
                className={`flex-1 rounded-2xl py-3.5 items-center border ${on ? 'bg-herb border-herb' : 'bg-white border-gray-200'}`}
                activeOpacity={0.85}
                onPress={() => setFilter(f)}
              >
                <Text className={`text-sm font-bold ${on ? 'text-white' : 'text-ink'}`}>{label}</Text>
                <Text className={`text-[11px] mt-0.5 ${on ? 'text-white/80' : 'text-muted'}`}>{counts[f]}개</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {!hydrated ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">불러오는 중…</Text>
        </View>
      ) : !showList ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-2">🌿</Text>
          <Text className="text-muted text-center">위에서 분류를 선택하면{'\n'}레시피 목록이 나와요.</Text>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-2">🌿</Text>
          <Text className="text-muted text-center">
            {recipes.length === 0 ? '아직 등록된 레시피가 없어요.\n"+ 새 레시피"로 첫 레시피를 등록해보세요.' : '검색 결과가 없어요.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          contentContainerClassName="px-5 pb-8 gap-3"
          renderItem={({ item }) => <RecipeCard recipe={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <TouchableOpacity
      className="bg-white rounded-2xl px-4 py-3.5"
      activeOpacity={0.85}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-bold text-ink">{recipe.nameKo}</Text>
          {recipe.nameEn ? <Text className="text-[11px] text-muted mt-0.5">{recipe.nameEn}</Text> : null}
        </View>
        <CategoryTag category={recipe.category} />
      </View>
      <Text className="text-xs text-muted mt-2" numberOfLines={1}>
        {recipe.actions.slice(0, 3).join(' · ')}
      </Text>
      {recipe.form ? (
        <View className="mt-2 self-start">
          <FormBadge form={recipe.form} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
