import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import useRecipeStore from '../../../src/store/recipeStore';
import RecipeForm, { draftFromRecipe } from '../../../src/components/RecipeForm';

export default function EditRecipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipes = useRecipeStore((s) => s.recipes);
  const updateRecipe = useRecipeStore((s) => s.updateRecipe);
  const recipe = recipes.find((r) => r.id === id);

  if (!recipe) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" edges={['bottom']}>
        <Text className="text-muted">레시피를 찾을 수 없어요.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={['bottom']}>
      <RecipeForm
        initial={draftFromRecipe(recipe)}
        onSave={async (updated) => {
          await updateRecipe(recipe.id, updated);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
