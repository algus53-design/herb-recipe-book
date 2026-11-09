// 레시피 등록/편집 공용 폼
import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BatchMode, Category, Dosing, Ingredient, Recipe, Unit, DoseUnit } from '../types';
import { SectionTitle } from './ui';

export interface RecipeDraft {
  nameKo: string;
  nameEn: string;
  category: Category;
  batchMode: BatchMode;
  form: string;
  actions: string; // 쉼표 구분 원문 입력
  description: string;
  ingredients: Ingredient[];
  yieldAmount: string;
  yieldUnit: Unit;
  yieldMeasured: boolean;
  yieldNote: string;
  doseBasisAmount: string;
  doseMin: string;
  doseMax: string;
  doseUnit: DoseUnit;
  perBodyWeightKg: string;
  freqMin: string;
  freqMax: string;
  doseNote: string;
  steps: string; // 줄바꿈 구분 원문 입력
  tips: string;
}

export function blankDraft(): RecipeDraft {
  return {
    nameKo: '', nameEn: '', category: 'oral', batchMode: 'personalized', form: '', actions: '', description: '',
    ingredients: [{ name: '', amount: null, unit: 'g' }],
    yieldAmount: '', yieldUnit: 'g', yieldMeasured: true, yieldNote: '', doseBasisAmount: '',
    doseMin: '', doseMax: '', doseUnit: 'g', perBodyWeightKg: '5', freqMin: '1', freqMax: '1',
    doseNote: '', steps: '', tips: '',
  };
}

export function draftFromRecipe(r: Recipe): RecipeDraft {
  return {
    nameKo: r.nameKo, nameEn: r.nameEn, category: r.category, batchMode: r.batchMode ?? 'personalized', form: r.form,
    actions: r.actions.join(', '), description: r.description,
    ingredients: r.ingredients.length ? r.ingredients.map((i) => ({ ...i })) : [{ name: '', amount: null, unit: 'g' }],
    yieldAmount: String(r.batchYield.amount), yieldUnit: r.batchYield.unit,
    yieldMeasured: r.yieldMeasured ?? true, yieldNote: r.yieldNote ?? '',
    doseBasisAmount: r.doseBasis ? String(r.doseBasis.amount) : '',
    doseMin: r.dosing ? String(r.dosing.doseMin) : '',
    doseMax: r.dosing ? String(r.dosing.doseMax) : '',
    doseUnit: r.dosing ? r.dosing.doseUnit : 'g',
    perBodyWeightKg: r.dosing ? String(r.dosing.perBodyWeightKg) : '5',
    freqMin: r.dosing ? String(r.dosing.freqMin) : '1',
    freqMax: r.dosing ? String(r.dosing.freqMax) : '1',
    doseNote: r.dosing ? r.dosing.note : '',
    steps: r.steps.join('\n'), tips: r.tips,
  };
}

function draftToRecipe(d: RecipeDraft): Omit<Recipe, 'id' | 'order'> | null {
  if (!d.nameKo.trim()) {
    Alert.alert('레시피명을 입력해주세요.');
    return null;
  }
  const ingredients = d.ingredients.filter((i) => i.name.trim());
  if (ingredients.length === 0) {
    Alert.alert('재료를 한 가지 이상 입력해주세요.');
    return null;
  }
  const yieldAmount = parseFloat(d.yieldAmount);
  if (!yieldAmount) {
    Alert.alert('완성량을 입력해주세요.');
    return null;
  }
  const batchYield = { amount: yieldAmount, unit: d.yieldUnit };
  const basisAmount = parseFloat(d.doseBasisAmount);
  const doseBasis = d.category === 'oral' ? { amount: basisAmount || yieldAmount, unit: d.yieldUnit } : null;
  let dosing: Dosing | null = null;
  if (d.category === 'oral') {
    const doseMin = parseFloat(d.doseMin) || 0;
    dosing = {
      doseMin,
      doseMax: parseFloat(d.doseMax) || doseMin,
      doseUnit: d.doseUnit,
      perBodyWeightKg: parseFloat(d.perBodyWeightKg) || 1,
      freqMin: parseInt(d.freqMin, 10) || 1,
      freqMax: parseInt(d.freqMax, 10) || parseInt(d.freqMin, 10) || 1,
      note: d.doseNote,
    };
  }
  return {
    nameKo: d.nameKo.trim(), nameEn: d.nameEn.trim(), category: d.category, form: d.form.trim(),
    actions: d.actions.split(',').map((s) => s.trim()).filter(Boolean),
    description: d.description.trim(), ingredients, batchYield,
    yieldMeasured: d.yieldMeasured, yieldNote: d.yieldNote.trim(),
    doseBasis, dosing,
    batchMode: d.category === 'oral' ? d.batchMode : null,
    steps: d.steps.split('\n').map((s) => s.trim()).filter(Boolean),
    tips: d.tips.trim(),
  };
}

const UNIT_OPTIONS: Unit[] = ['g', 'ml'];
const DOSE_UNIT_OPTIONS: { value: DoseUnit; label: string }[] = [
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'ml' },
  { value: 'drop', label: '방울' },
];

export default function RecipeForm({
  initial,
  onSave,
}: {
  initial: RecipeDraft;
  onSave: (recipe: Omit<Recipe, 'id' | 'order'>) => Promise<void>;
}) {
  const [d, setD] = useState<RecipeDraft>(initial);
  const [saving, setSaving] = useState(false);
  const patch = (p: Partial<RecipeDraft>) => setD((s) => ({ ...s, ...p }));

  const updateIngredient = (idx: number, p: Partial<Ingredient>) => {
    const ingredients = d.ingredients.slice();
    ingredients[idx] = { ...ingredients[idx], ...p } as Ingredient;
    patch({ ingredients });
  };
  const addIngredient = () => patch({ ingredients: [...d.ingredients, { name: '', amount: null, unit: 'g' }] });
  const removeIngredient = (idx: number) => {
    const ingredients = d.ingredients.filter((_, i) => i !== idx);
    patch({ ingredients: ingredients.length ? ingredients : [{ name: '', amount: null, unit: 'g' }] });
  };

  const submit = async () => {
    const recipe = draftToRecipe(d);
    if (!recipe) return;
    setSaving(true);
    try {
      await onSave(recipe);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerClassName="px-5 pt-4 pb-10">
      <Field label="레시피명(국문)">
        <Input value={d.nameKo} onChangeText={(v) => patch({ nameKo: v })} placeholder="예: 카모마일 코코넛 파우밤" />
      </Field>
      <Field label="레시피명(영문, 선택)">
        <Input value={d.nameEn} onChangeText={(v) => patch({ nameEn: v })} />
      </Field>

      <Field label="구분">
        <View className="flex-row gap-2">
          {(['oral', 'topical'] as Category[]).map((c) => {
            const on = d.category === c;
            return (
              <TouchableOpacity
                key={c}
                className={`flex-1 py-2.5 rounded-xl border items-center ${on ? 'bg-herb border-herb' : 'bg-white border-gray-200'}`}
                activeOpacity={0.85}
                onPress={() => patch({ category: c })}
              >
                <Text className={`text-sm font-semibold ${on ? 'text-white' : 'text-ink'}`}>{c === 'oral' ? '내복' : '외용'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>

      <Field label="제형">
        <Input value={d.form} onChangeText={(v) => patch({ form: v })} placeholder="예: 파우더, 밤, 시럽" />
      </Field>
      <Field label="효능 (쉼표로 구분)">
        <Input value={d.actions} onChangeText={(v) => patch({ actions: v })} placeholder="소염, 가려움완화" />
      </Field>
      <Field label="설명">
        <Input value={d.description} onChangeText={(v) => patch({ description: v })} multiline />
      </Field>

      <SectionTitle>재료</SectionTitle>
      {d.ingredients.map((ing, idx) => (
        <View key={idx} className="flex-row gap-2 mb-2 items-center">
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-ink"
            placeholder="재료명"
            value={ing.name}
            onChangeText={(v) => updateIngredient(idx, { name: v })}
          />
          <TextInput
            className="w-20 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-ink"
            placeholder="용량"
            keyboardType="numeric"
            value={ing.amount == null ? '' : String(ing.amount)}
            onChangeText={(v) => updateIngredient(idx, { amount: v === '' ? null : parseFloat(v) })}
          />
          <UnitPicker
            value={ing.unit}
            options={['g', 'ml', '적당량']}
            onChange={(u) => updateIngredient(idx, { unit: u as Ingredient['unit'] })}
          />
          <TouchableOpacity onPress={() => removeIngredient(idx)} className="px-2">
            <Text className="text-danger text-base">✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        className="border border-dashed border-gray-300 rounded-lg py-2 items-center mb-2"
        activeOpacity={0.8}
        onPress={addIngredient}
      >
        <Text className="text-xs text-herb-dark font-semibold">+ 재료 추가</Text>
      </TouchableOpacity>

      <Field label={`완성량 (${d.yieldUnit})`}>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-ink"
            keyboardType="numeric"
            value={d.yieldAmount}
            onChangeText={(v) => patch({ yieldAmount: v })}
          />
          <UnitPicker value={d.yieldUnit} options={UNIT_OPTIONS} onChange={(u) => patch({ yieldUnit: u as Unit })} />
        </View>
        <Text className="text-[11px] text-muted mt-1">
          걸러내고 남은 실제 제품의 양이에요. 인퓨즈드 오일·팅쳐·디콕션은 허브가 용매를 머금는 만큼 투입량보다 적게 나와요.
        </Text>
      </Field>

      <Field label="완성량 신뢰도">
        <View className="flex-row gap-2">
          {[true, false].map((m) => {
            const on = d.yieldMeasured === m;
            return (
              <TouchableOpacity
                key={String(m)}
                className={`flex-1 py-2.5 rounded-xl border items-center ${on ? 'bg-herb border-herb' : 'bg-white border-gray-200'}`}
                activeOpacity={0.85}
                onPress={() => patch({ yieldMeasured: m })}
              >
                <Text className={`text-sm font-semibold ${on ? 'text-white' : 'text-ink'}`}>{m ? '실측 (재봄)' : '추정치'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text className="text-[11px] text-muted mt-1">
          {d.yieldMeasured ? '실제로 만들어 저울로 재본 값이에요.' : '아직 안 재본 값이라, 계산기에 경고가 표시돼요.'}
        </Text>
      </Field>

      <Field label="완성량 메모 (선택)">
        <Input value={d.yieldNote} onChangeText={(v) => patch({ yieldNote: v })} placeholder="예: 허브가 오일을 흡수해 실제 회수량은 더 적음" multiline />
      </Field>

      {d.category === 'oral' ? (
        <>
          <Field label="배치 제작 방식">
            <View className="flex-row gap-2">
              {(['personalized', 'standard'] as BatchMode[]).map((m) => {
                const on = d.batchMode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    className={`flex-1 py-2.5 rounded-xl border items-center ${on ? 'bg-herb border-herb' : 'bg-white border-gray-200'}`}
                    activeOpacity={0.85}
                    onPress={() => patch({ batchMode: m })}
                  >
                    <Text className={`text-sm font-semibold ${on ? 'text-white' : 'text-ink'}`}>
                      {m === 'personalized' ? '개체 맞춤 제작' : '표준 배치 제작'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text className="text-[11px] text-muted mt-1">
              {d.batchMode === 'personalized'
                ? '파우더·페이스트처럼, 체중·급여일수에 맞춰 필요한 만큼만 계산해요.'
                : '시럽·디콕션처럼, 원하는 총량으로 만들고 체중별 1회 급여량·며칠치를 계산해요.'}
            </Text>
          </Field>

          <Field label="도시지 기준량 (보통 완성량과 동일 — 활성 재료 합계 등 다를 때만 별도 입력)">
            <Input keyboardType="numeric" value={d.doseBasisAmount} onChangeText={(v) => patch({ doseBasisAmount: v })} placeholder={d.yieldAmount || '완성량과 동일'} />
          </Field>
          <View className="flex-row gap-2">
            <Field label="1회 급여량 최소" style={{ flex: 1 }}>
              <Input keyboardType="numeric" value={d.doseMin} onChangeText={(v) => patch({ doseMin: v })} />
            </Field>
            <Field label="1회 급여량 최대" style={{ flex: 1 }}>
              <Input keyboardType="numeric" value={d.doseMax} onChangeText={(v) => patch({ doseMax: v })} />
            </Field>
          </View>
          <Field label="급여량 단위">
            <UnitPicker value={d.doseUnit} options={DOSE_UNIT_OPTIONS.map((o) => o.value)} onChange={(u) => patch({ doseUnit: u as DoseUnit })} />
          </Field>
          <View className="flex-row gap-2">
            <Field label="기준 체중 (kg)" style={{ flex: 1 }}>
              <Input keyboardType="numeric" value={d.perBodyWeightKg} onChangeText={(v) => patch({ perBodyWeightKg: v })} />
            </Field>
            <Field label="1일 최소 횟수" style={{ flex: 1 }}>
              <Input keyboardType="numeric" value={d.freqMin} onChangeText={(v) => patch({ freqMin: v })} />
            </Field>
            <Field label="1일 최대 횟수" style={{ flex: 1 }}>
              <Input keyboardType="numeric" value={d.freqMax} onChangeText={(v) => patch({ freqMax: v })} />
            </Field>
          </View>
          <Field label="도시지 참고 메모 (선택)">
            <Input value={d.doseNote} onChangeText={(v) => patch({ doseNote: v })} />
          </Field>
        </>
      ) : null}

      <Field label="만드는 법 (한 줄에 한 단계)">
        <Input value={d.steps} onChangeText={(v) => patch({ steps: v })} multiline />
      </Field>
      <Field label="팁 (선택)">
        <Input value={d.tips} onChangeText={(v) => patch({ tips: v })} multiline />
      </Field>

      <TouchableOpacity
        className={`rounded-2xl py-4 items-center mt-4 ${saving ? 'bg-gray-300' : 'bg-herb'}`}
        activeOpacity={0.85}
        disabled={saving}
        onPress={submit}
      >
        <Text className="text-white text-base font-bold">{saving ? '저장 중…' : '저장'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View className="mb-4" style={style}>
      <Text className="text-xs font-semibold text-muted mb-1">{label}</Text>
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      className={`bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-ink ${props.multiline ? 'min-h-[70px]' : ''}`}
      textAlignVertical={props.multiline ? 'top' : 'center'}
      {...props}
    />
  );
}

function UnitPicker({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <View className="flex-row gap-1">
      {options.map((o) => {
        const on = value === o;
        return (
          <TouchableOpacity
            key={o}
            className={`px-2.5 py-2 rounded-lg border ${on ? 'bg-herb border-herb' : 'bg-white border-gray-200'}`}
            activeOpacity={0.85}
            onPress={() => onChange(o)}
          >
            <Text className={`text-xs font-semibold ${on ? 'text-white' : 'text-ink'}`}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
