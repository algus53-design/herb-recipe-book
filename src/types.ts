// 레시피 데이터 모델 — 확정된 레시피의 재료를 체중·급여일수에 맞춰 스케일링하기 위한 구조.
// pet-herbs-lab의 Recipe(자동 제안 결과)와는 별개 타입이다.

export type Category = 'oral' | 'topical'; // 내복 | 외용(도포)
export type Unit = 'g' | 'ml';
export type DoseUnit = 'g' | 'ml' | 'drop';
/**
 * 배치 제작 방식 — 내복 레시피에만 의미가 있다(외용은 항상 표준배치와 동일하게 동작).
 * personalized(개체 맞춤 제작): 파우더·페이스트처럼 저울로 정확히 계량하기 쉬워, 이번에 먹일
 *   반려견의 체중·급여일수에 맞춰 "필요한 만큼만" 배치 총량을 계산한다.
 * standard(표준 배치 제작): 시럽·디콕션·수프처럼 병/통 단위로 만들어두고 여러 날에 걸쳐 나눠
 *   먹이는 제품. 배치는 원하는 총량(100g, 200g 등)으로 만들고, 반려견 체중에 따른 1회 급여량과
 *   그 배치가 며칠치인지를 계산해 보여준다.
 */
export type BatchMode = 'personalized' | 'standard';

export interface Ingredient {
  name: string;
  /** null이면 "적당량" 등 계량 없는 재료 (계산에서 제외, 표시만) */
  amount: number | null;
  unit: Unit | '적당량';
}

export interface Amount {
  amount: number;
  unit: Unit;
}

export interface Dosing {
  doseMin: number;
  doseMax: number;
  doseUnit: DoseUnit;
  /** 이 용량 기준이 되는 반려견 체중(kg) */
  perBodyWeightKg: number;
  freqMin: number;
  freqMax: number;
  /** 원본 자료의 단위 혼재·환산 등 참고 메모 */
  note: string;
}

export interface Recipe {
  id: string;
  order: number;
  category: Category;
  /** 제형: 파우더, 밤, 시럽 등 */
  form: string;
  nameKo: string;
  nameEn: string;
  actions: string[];
  description: string;
  ingredients: Ingredient[];
  /**
   * 완성량 — 걸러내고 남은 "실제 제품의 양". 인퓨즈드 오일·팅쳐·디콕션처럼 허브가 용매를
   * 흡수하는 제형은 투입량 합보다 훨씬 적게 나오므로, 투입량을 그대로 쓰면 안 된다.
   */
  batchYield: Amount;
  /** true = 실제로 만들어 재본 값, false = 투입량 합 등으로 추정한 값(화면에 경고 표시) */
  yieldMeasured: boolean;
  /** 완성량에 대한 메모 (예: "허브가 오일을 흡수해 실제 회수량은 더 적음") */
  yieldNote: string;
  /** 내복 레시피만 존재. 도시지 계산의 기준량(보통 batchYield와 같지만, 활성 재료 합계만 기준일 수도 있음) */
  doseBasis: Amount | null;
  dosing: Dosing | null;
  /** 내복 레시피만 존재(외용은 항상 표준배치처럼 동작하므로 null). */
  batchMode: BatchMode | null;
  steps: string[];
  tips: string;
}
