// 레시피 스토어 — AsyncStorage에 영속. 최초 실행 시 시드 11개로 초기화.
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '../types';
import SEED_RECIPES from '../data/recipes';

const STORAGE_KEY = 'herbRecipeBook.recipes.v1';

function uid() {
  return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

interface RecipeState {
  recipes: Recipe[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addRecipe: (r: Omit<Recipe, 'id' | 'order'>) => Promise<void>;
  updateRecipe: (id: string, r: Omit<Recipe, 'id' | 'order'>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
}

/**
 * 저장된 데이터에 새로 생긴 필드를 채워 넣는다(기기에 이미 있던 레시피를 지우지 않기 위함).
 * batchMode: 시드 레시피는 시드 정의값으로, 사용자가 직접 추가했던 내복 레시피는 기존 동작인
 * 'personalized'로 채운다. 외용은 항상 null.
 */
function migrate(stored: Recipe[]): Recipe[] {
  return stored.map((r) => {
    const seed = SEED_RECIPES.find((s) => s.id === r.id);
    let next = r;

    // batchMode: 시드는 시드 정의값, 사용자가 추가했던 내복 레시피는 기존 동작인 'personalized'
    if (r.category !== 'oral') {
      if (next.batchMode !== null) next = { ...next, batchMode: null };
    } else if (!next.batchMode) {
      next = { ...next, batchMode: seed?.batchMode ?? 'personalized' };
    }

    // 완성량 실측 여부: 시드는 시드 정의값, 그 외에는 사용자가 직접 넣은 값이므로 실측으로 본다
    if (typeof next.yieldMeasured !== 'boolean') {
      next = { ...next, yieldMeasured: seed ? seed.yieldMeasured : true };
    }
    if (typeof next.yieldNote !== 'string') {
      next = { ...next, yieldNote: seed ? seed.yieldNote : '' };
    }

    return next;
  });
}

async function persist(recipes: Recipe[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  } catch {
    /* 오프라인 저장 실패는 무시 — 다음 저장에서 재시도 */
  }
}

const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = migrate(JSON.parse(raw) as Recipe[]);
        set({ recipes: parsed.slice().sort((a, b) => a.order - b.order), hydrated: true });
        await persist(parsed);
      } else {
        set({ recipes: SEED_RECIPES.slice(), hydrated: true });
        await persist(SEED_RECIPES);
      }
    } catch {
      set({ recipes: SEED_RECIPES.slice(), hydrated: true });
    }
  },

  addRecipe: async (r) => {
    const maxOrder = get().recipes.reduce((m, x) => Math.max(m, x.order), 0);
    const next = [...get().recipes, { ...r, id: uid(), order: maxOrder + 1 }];
    set({ recipes: next });
    await persist(next);
  },

  updateRecipe: async (id, r) => {
    const next = get().recipes.map((x) => (x.id === id ? { ...r, id, order: x.order } : x));
    set({ recipes: next });
    await persist(next);
  },

  deleteRecipe: async (id) => {
    const next = get().recipes.filter((x) => x.id !== id);
    set({ recipes: next });
    await persist(next);
  },
}));

export default useRecipeStore;
