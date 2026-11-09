// 레시피 상세 + 배치 계산기
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useRecipeStore from '../../src/store/recipeStore';
import { CategoryTag, Chip, FormBadge, SectionTitle } from '../../src/components/ui';
import { calcOral, calcStandardBatch, calcTopical, defaultOralInputs, fmtNum, StandardBatchResult } from '../../src/lib/calc';

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipes = useRecipeStore((s) => s.recipes);
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe);
  const recipe = recipes.find((r) => r.id === id);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [oral, setOral] = useState(() => (recipe ? defaultOralInputs(recipe) : null));
  const [weightText, setWeightText] = useState(() => (oral ? String(oral.weightKg) : ''));
  const [daysText, setDaysText] = useState(() => (oral ? String(oral.days) : ''));
  const [desiredTotal, setDesiredTotal] = useState(() => recipe?.batchYield.amount ?? 0);

  // 입력 중인 문자열은 그대로 두고, 유효한 숫자로 파싱될 때만 계산에 반영한다.
  // (예: "3." 을 입력하는 도중 즉시 "3"으로 되돌아가 소수점을 못 치는 문제 방지)
  const handleWeightChange = (v: string) => {
    setWeightText(v);
    const n = parseFloat(v);
    if (!Number.isNaN(n) && oral) setOral({ ...oral, weightKg: n });
  };
  const handleDaysChange = (v: string) => {
    setDaysText(v);
    const n = parseFloat(v);
    if (!Number.isNaN(n) && oral) setOral({ ...oral, days: n });
  };

  const isStandard = recipe?.batchMode === 'standard';

  const result = useMemo(() => {
    if (!recipe) return null;
    if (recipe.category === 'topical') return calcTopical(recipe, { desiredTotal });
    if (!oral) return null;
    if (isStandard) {
      return calcStandardBatch(recipe, { desiredTotal, weightKg: oral.weightKg, dose: oral.dose, freq: oral.freq });
    }
    return calcOral(recipe, oral);
  }, [recipe, oral, desiredTotal, isStandard]);

  if (!recipe) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" edges={['bottom']}>
        <Text className="text-muted">레시피를 찾을 수 없어요.</Text>
      </SafeAreaView>
    );
  }

  const d = recipe.dosing;

  return (
    <SafeAreaView className="flex-1" edges={['bottom']}>
      <ScrollView contentContainerClassName="px-5 pt-4 pb-10">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xl font-bold text-ink">{recipe.nameKo}</Text>
            {recipe.nameEn ? <Text className="text-xs text-muted mt-1">{recipe.nameEn}</Text> : null}
            <View className="flex-row gap-2 mt-2">
              <CategoryTag category={recipe.category} />
              {recipe.form ? <FormBadge form={recipe.form} /> : null}
            </View>
          </View>
        </View>

        <View className="flex-row gap-2 mt-3">
          <TouchableOpacity
            className="bg-white border border-gray-200 rounded-xl px-3 py-2"
            activeOpacity={0.85}
            onPress={() => router.push(`/recipe/${recipe.id}/edit`)}
          >
            <Text className="text-xs font-semibold text-ink">편집</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-danger-light border border-danger rounded-xl px-3 py-2"
            activeOpacity={0.85}
            onPress={() => setConfirmingDelete(true)}
          >
            <Text className="text-xs font-semibold text-danger">삭제</Text>
          </TouchableOpacity>
        </View>

        {confirmingDelete ? (
          <View className="flex-row items-center gap-2 bg-danger-light border border-danger rounded-xl px-3 py-2 mt-3">
            <Text className="flex-1 text-xs text-danger">삭제하면 되돌릴 수 없어요. 정말 삭제할까요?</Text>
            <TouchableOpacity
              className="bg-danger rounded-lg px-3 py-1.5"
              activeOpacity={0.85}
              onPress={async () => {
                await deleteRecipe(recipe.id);
                router.back();
              }}
            >
              <Text className="text-white text-xs font-bold">삭제</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5"
              activeOpacity={0.85}
              onPress={() => setConfirmingDelete(false)}
            >
              <Text className="text-xs font-semibold text-ink">취소</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {recipe.actions.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5 mt-4">
            {recipe.actions.map((a) => (
              <Chip key={a} label={a} />
            ))}
          </View>
        ) : null}

        {recipe.description ? <Text className="text-sm text-ink mt-3 leading-5">{recipe.description}</Text> : null}

        <SectionTitle>재료</SectionTitle>
        <View className="bg-white rounded-2xl px-4 py-2 border border-gray-100">
          {recipe.ingredients.map((ing, i) => (
            <View
              key={ing.name + i}
              className={`flex-row justify-between py-2 ${i < recipe.ingredients.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <Text className="text-sm text-ink">{ing.name}</Text>
              <Text className="text-sm text-muted">{ing.amount == null ? ing.unit || '적당량' : fmtNum(ing.amount, ing.unit)}</Text>
            </View>
          ))}
        </View>
        <View className="flex-row items-center gap-2 mt-2">
          <Text className="text-xs text-muted">
            원 레시피 완성량: <Text className="font-semibold text-ink">{fmtNum(recipe.batchYield.amount, recipe.batchYield.unit)}</Text>
          </Text>
          <View className={`px-2 py-0.5 rounded-full ${recipe.yieldMeasured ? 'bg-herb-light' : 'bg-warning-light'}`}>
            <Text className={`text-[10px] font-bold ${recipe.yieldMeasured ? 'text-herb-dark' : 'text-warning'}`}>
              {recipe.yieldMeasured ? '실측' : '추정치'}
            </Text>
          </View>
        </View>
        {recipe.yieldNote ? (
          <View className={`mt-2 rounded-xl px-3 py-2.5 ${recipe.yieldMeasured ? 'bg-gray-50' : 'bg-warning-light'}`}>
            <Text className={`text-[11px] leading-5 ${recipe.yieldMeasured ? 'text-muted' : 'text-warning'}`}>
              {recipe.yieldMeasured ? 'ⓘ ' : '⚠️ '}
              {recipe.yieldNote}
            </Text>
          </View>
        ) : null}

        {recipe.steps.length > 0 ? (
          <>
            <SectionTitle>만드는 법</SectionTitle>
            <View className="gap-2">
              {recipe.steps.map((s, i) => (
                <View key={i} className="flex-row gap-2.5">
                  <View className="w-5 h-5 rounded-full bg-herb-light items-center justify-center mt-0.5">
                    <Text className="text-[10px] font-bold text-herb-dark">{i + 1}</Text>
                  </View>
                  <Text className="flex-1 text-sm text-ink leading-5">{s}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {recipe.tips ? (
          <View className="mt-5 bg-topical-light border-l-2 border-topical rounded-xl px-4 py-3">
            <Text className="text-xs text-ink leading-5">
              <Text className="font-bold text-topical-dark">tip. </Text>
              {recipe.tips}
            </Text>
          </View>
        ) : null}

        {/* 계산기 */}
        <View className="mt-7 bg-white border border-gray-200 rounded-2xl px-4 py-4">
          <Text className="text-base font-bold text-ink">🧮 배치 계산기</Text>
          <Text className="text-xs text-muted mt-1">
            {recipe.category === 'topical'
              ? '만들 총량을 정하면 재료 비율대로 계산돼요.'
              : isStandard
              ? '병·통 단위로 만들 총량을 정하면, 이번에 먹일 반려견의 1회 급여량과 며칠치인지 계산해요.'
              : '체중·급여일수에 맞춰 이번 배치에 필요한 재료 양을 계산해요.'}
          </Text>

          {recipe.category === 'topical' ? (
            <View className="mt-4">
              <Text className="text-xs font-semibold text-muted mb-1">만들고 싶은 총량 ({recipe.batchYield.unit})</Text>
              <TextInput
                className="bg-herb-light rounded-xl px-3 py-2.5 text-base text-ink"
                keyboardType="numeric"
                value={String(desiredTotal)}
                onChangeText={(v) => setDesiredTotal(parseFloat(v) || 0)}
              />
            </View>
          ) : isStandard && oral && d ? (
            <View className="mt-4 gap-4">
              <View>
                <Text className="text-xs font-semibold text-muted mb-1">만들고 싶은 총량 ({recipe.batchYield.unit})</Text>
                <TextInput
                  className="bg-herb-light rounded-xl px-3 py-2.5 text-base text-ink"
                  keyboardType="numeric"
                  value={String(desiredTotal)}
                  onChangeText={(v) => setDesiredTotal(parseFloat(v) || 0)}
                />
                <Text className="text-[11px] text-muted mt-1">원 레시피 완성량({fmtNum(recipe.batchYield.amount, recipe.batchYield.unit)}) 그대로 만들어도 돼요.</Text>
              </View>

              <View>
                <Text className="text-xs font-semibold text-muted mb-1">이번에 먹일 반려견 체중 (kg)</Text>
                <TextInput
                  className="bg-herb-light rounded-xl px-3 py-2.5 text-base text-ink"
                  keyboardType="decimal-pad"
                  value={weightText}
                  onChangeText={handleWeightChange}
                />
              </View>

              <Stepper
                label={`1회 급여량 (${d.perBodyWeightKg}kg 기준 — 세기 선택)`}
                value={oral.dose}
                unit={d.doseUnit}
                min={d.doseMin}
                max={d.doseMax}
                step={(d.doseMax - d.doseMin) / 10 || 0.01}
                hint={`권장 범위 ${fmtNum(d.doseMin, d.doseUnit)} ~ ${fmtNum(d.doseMax, d.doseUnit)} / ${d.perBodyWeightKg}kg`}
                onChange={(v) => setOral({ ...oral, dose: v })}
              />

              <Stepper
                label="1일 급여 횟수"
                value={oral.freq}
                unit=""
                min={d.freqMin}
                max={d.freqMax}
                step={1}
                hint={d.freqMin === d.freqMax ? `1일 ${d.freqMin}회 (고정)` : `권장 범위 1일 ${d.freqMin}~${d.freqMax}회`}
                onChange={(v) => setOral({ ...oral, freq: v })}
              />

              {d.note ? (
                <View className="flex-row gap-2 bg-topical-light rounded-xl px-3 py-2.5">
                  <Text className="text-xs text-topical-dark flex-1 leading-5">ⓘ {d.note}</Text>
                </View>
              ) : null}
            </View>
          ) : !isStandard && oral && d ? (
            <View className="mt-4 gap-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-muted mb-1">반려견 체중 (kg)</Text>
                  <TextInput
                    className="bg-herb-light rounded-xl px-3 py-2.5 text-base text-ink"
                    keyboardType="decimal-pad"
                    value={weightText}
                    onChangeText={handleWeightChange}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-muted mb-1">급여 일수</Text>
                  <TextInput
                    className="bg-herb-light rounded-xl px-3 py-2.5 text-base text-ink"
                    keyboardType="number-pad"
                    value={daysText}
                    onChangeText={handleDaysChange}
                  />
                </View>
              </View>

              <Stepper
                label={`1회 급여량 (${d.perBodyWeightKg}kg 기준 — 세기 선택)`}
                value={oral.dose}
                unit={d.doseUnit}
                min={d.doseMin}
                max={d.doseMax}
                step={(d.doseMax - d.doseMin) / 10 || 0.01}
                hint={`권장 범위 ${fmtNum(d.doseMin, d.doseUnit)} ~ ${fmtNum(d.doseMax, d.doseUnit)} / ${d.perBodyWeightKg}kg`}
                onChange={(v) => setOral({ ...oral, dose: v })}
              />

              <View className="bg-herb-light rounded-xl px-3.5 py-3 flex-row items-baseline justify-between">
                <Text className="text-xs text-herb-dark flex-1">
                  → {fmtNum(oral.weightKg, undefined)}kg 반려견의 실제 1회 급여량
                </Text>
                <Text className="text-lg font-bold text-herb-dark">
                  {fmtNum(oral.dose * (oral.weightKg / d.perBodyWeightKg), d.doseUnit)}
                </Text>
              </View>

              <Stepper
                label="1일 급여 횟수"
                value={oral.freq}
                unit=""
                min={d.freqMin}
                max={d.freqMax}
                step={1}
                hint={d.freqMin === d.freqMax ? `1일 ${d.freqMin}회 (고정)` : `권장 범위 1일 ${d.freqMin}~${d.freqMax}회`}
                onChange={(v) => setOral({ ...oral, freq: v })}
              />

              {d.note ? (
                <View className="flex-row gap-2 bg-topical-light rounded-xl px-3 py-2.5">
                  <Text className="text-xs text-topical-dark flex-1 leading-5">ⓘ {d.note}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {!recipe.yieldMeasured ? (
            <View className="bg-warning-light rounded-xl px-3 py-2.5 mt-4">
              <Text className="text-[11px] text-warning leading-5">
                ⚠️ 이 레시피의 완성량({fmtNum(recipe.batchYield.amount, recipe.batchYield.unit)})은 아직 추정치예요. 아래 재료 계산은 이 값을 기준으로 하므로, 한 번 만들어보고 걸러낸 실제 양을 재서 편집에 반영하면 정확해져요.
              </Text>
            </View>
          ) : null}

          {result ? (
            <>
              <View className="flex-row items-baseline gap-2 mt-5">
                <Text className="text-2xl font-bold text-herb-dark">{fmtNum(result.batchTotal, result.unit)}</Text>
                <Text className="text-xs text-muted">이번에 만들 총량</Text>
              </View>

              {isStandard ? (
                <View className="flex-row gap-2 mt-3">
                  <View className="flex-1 bg-herb-light rounded-xl px-3.5 py-3">
                    <Text className="text-[11px] text-herb-dark">1회 급여량</Text>
                    <Text className="text-lg font-bold text-herb-dark mt-0.5">
                      {fmtNum((result as StandardBatchResult).perDoseForWeight, (result as StandardBatchResult).doseUnit)}
                    </Text>
                  </View>
                  <View className="flex-1 bg-herb-light rounded-xl px-3.5 py-3">
                    <Text className="text-[11px] text-herb-dark">이 배치로</Text>
                    <Text className="text-lg font-bold text-herb-dark mt-0.5">
                      {(result as StandardBatchResult).daysSupply == null ? '—' : `약 ${fmtNum((result as StandardBatchResult).daysSupply, undefined)}일치`}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View className="mt-3 border-t border-gray-100 pt-2">
                {recipe.ingredients.map((ing, i) => (
                  <View key={ing.name + i} className="flex-row justify-between py-1.5">
                    <Text className="flex-1 text-sm text-ink">{ing.name}</Text>
                    <Text className="text-[11px] text-muted w-16 text-right">
                      {ing.amount == null ? '' : fmtNum(ing.amount, ing.unit)}
                    </Text>
                    <Text className="text-sm font-bold text-herb-dark w-20 text-right">
                      {ing.amount == null ? ing.unit || '적당량' : fmtNum(ing.amount * result.scale, ing.unit)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stepper({
  label,
  value,
  unit,
  min,
  max,
  step,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  hint: string;
  onChange: (v: number) => void;
}) {
  const locked = min === max;
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <View>
      <Text className="text-xs font-semibold text-muted mb-1">{label}</Text>
      {locked ? (
        <Text className="text-base text-ink font-semibold">{fmtNum(value, unit)}</Text>
      ) : (
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            className="w-9 h-9 rounded-lg bg-herb-light items-center justify-center"
            activeOpacity={0.8}
            onPress={() => onChange(Number(clamp(value - step).toFixed(3)))}
          >
            <Text className="text-herb-dark text-lg font-bold">−</Text>
          </TouchableOpacity>
          <Text className="text-base font-semibold text-ink w-20 text-center">{fmtNum(value, unit)}</Text>
          <TouchableOpacity
            className="w-9 h-9 rounded-lg bg-herb-light items-center justify-center"
            activeOpacity={0.8}
            onPress={() => onChange(Number(clamp(value + step).toFixed(3)))}
          >
            <Text className="text-herb-dark text-lg font-bold">+</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text className="text-[11px] text-muted mt-1">{hint}</Text>
    </View>
  );
}
