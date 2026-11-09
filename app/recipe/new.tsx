import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import useRecipeStore from '../../src/store/recipeStore';
import RecipeForm, { blankDraft } from '../../src/components/RecipeForm';

export default function NewRecipe() {
  const addRecipe = useRecipeStore((s) => s.addRecipe);

  return (
    <SafeAreaView className="flex-1" edges={['bottom']}>
      <RecipeForm
        initial={blankDraft()}
        onSave={async (recipe) => {
          await addRecipe(recipe);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}
