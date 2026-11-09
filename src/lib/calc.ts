// 배치 계산 순수 함수 — 웹 아티팩트 프로토타입에서 검증된 공식을 그대로 이식.
import { Recipe, DoseUnit } from '../types';

/** 표준 점적병 기준 추정치 (약 20방울 = 1ml) */
export const DROP_ML = 0.05;

export function toBaseUnit(amount: number, unit: DoseUnit): number {
  if (unit === 'drop') return amount * DROP_ML;
  return amount;
}

export interface OralInputs {
  weightKg: number;
  days: number;
  dose: number;
  freq: number;
}

export interface TopicalInputs {
  desiredTotal: number;
}

export interface CalcResult {
  scale: number;
  batchTotal: number;
  unit: 'g' | 'ml';
}

export function calcOral(recipe: Recipe, inputs: OralInputs): CalcResult {
  const d = recipe.dosing;
  const basis = recipe.doseBasis;
  if (!d || !basis) {
    return { scale: 0, batchTotal: 0, unit: recipe.batchYield.unit };
  }
  const doseBase = toBaseUnit(inputs.dose, d.doseUnit);
  const daily = doseBase * (inputs.weightKg / d.perBodyWeightKg) * inputs.freq;
  const total = daily * inputs.days;
  const scale = basis.amount > 0 ? total / basis.amount : 0;
  return {
    scale,
    batchTotal: recipe.batchYield.amount * scale,
    unit: recipe.batchYield.unit,
  };
}

export function calcTopical(recipe: Recipe, inputs: TopicalInputs): CalcResult {
  const scale = recipe.batchYield.amount > 0 ? inputs.desiredTotal / recipe.batchYield.amount : 0;
  return {
    scale,
    batchTotal: inputs.desiredTotal,
    unit: recipe.batchYield.unit,
  };
}

/**
 * 표준 배치 제작형(시럽·디콕션·수프 등) 계산 — 배치는 원하는 총량(desiredTotal)으로 만들고,
 * 이번에 먹일 반려견 체중에 맞춘 1회 급여량과 그 배치가 며칠치인지를 함께 보여준다.
 * "체중×일수 → 필요 총량"을 계산하는 calcOral과 달리, 총량은 사용자가 직접 정한다.
 */
export interface StandardBatchInputs {
  desiredTotal: number;
  weightKg: number;
  dose: number;
  freq: number;
}

export interface StandardBatchResult extends CalcResult {
  /** 이 체중의 반려견이 1회에 먹을 양 (원본 doseUnit 기준, 환산 없음) */
  perDoseForWeight: number;
  doseUnit: DoseUnit;
  /** 이 배치 하나로 며칠치가 나오는지 (일일 소비량이 0이면 null) */
  daysSupply: number | null;
}

export function calcStandardBatch(recipe: Recipe, inputs: StandardBatchInputs): StandardBatchResult {
  const d = recipe.dosing;
  const base = calcTopical(recipe, { desiredTotal: inputs.desiredTotal });
  if (!d) {
    return { ...base, perDoseForWeight: 0, doseUnit: 'g', daysSupply: null };
  }
  const perDoseForWeight = inputs.dose * (inputs.weightKg / d.perBodyWeightKg);
  const dailyConsumption = toBaseUnit(perDoseForWeight, d.doseUnit) * inputs.freq;
  const daysSupply = dailyConsumption > 0 ? inputs.desiredTotal / dailyConsumption : null;
  return { ...base, perDoseForWeight, doseUnit: d.doseUnit, daysSupply };
}

export function defaultOralInputs(recipe: Recipe): OralInputs {
  const d = recipe.dosing;
  return {
    weightKg: 10,
    days: 7,
    dose: d ? (d.doseMin + d.doseMax) / 2 : 1,
    freq: d ? Math.round((d.freqMin + d.freqMax) / 2) : 1,
  };
}

const UNIT_LABEL: Record<string, string> = { g: 'g', ml: 'ml', drop: '방울', 적당량: '적당량' };

export function fmtNum(n: number | null | undefined, unit?: string): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '적당량';
  const v = Math.abs(n) < 0.05 ? Math.round(n * 1000) / 1000 : Math.round(n * 100) / 100;
  const label = unit ? ` ${UNIT_LABEL[unit] ?? unit}` : '';
  return `${v}${label}`;
}
