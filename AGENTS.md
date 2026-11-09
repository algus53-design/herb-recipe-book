# 허브 레시피북 — 작업 가이드 (AI 에이전트용)

## Expo 버전 주의
Expo 57을 사용한다(2026-09-04 SDK 56→57 업그레이드). API가 자주 바뀌므로 코드 작성 전 정확한 버전 문서를 확인할 것:
https://docs.expo.dev/versions/latest/

## 이 앱의 정체성
- **확정된 레시피 전용**: `pet-herbs-lab`처럼 배합 비율을 자동 제안하지 않는다. 이미 완성된 레시피(재료·완성량·도시지)를 저장해두고, 반려견 체중·급여일수에 맞춰 재료량만 스케일링한다.
- **배치 제작 방식 2종 (`Recipe.batchMode`, 내복만 해당)**:
  - `personalized`(개체 맞춤 제작) — 파우더·페이스트류. 체중·급여일수로 정확한 필요 총량을 계산(`calcOral`). 저울로 계량하기 쉬워 그때그때 필요한 만큼만 만드는 제품.
  - `standard`(표준 배치 제작) — 시럽·디콕션·수프 등 액상류. 원하는 총량(병/통 단위)을 직접 입력해 배치를 만들고, 그 체중의 개가 1회 얼마나 먹어야 하는지·그 배치가 며칠치인지를 계산(`calcStandardBatch`). 외용은 이 구분이 없고 항상 표준 배치처럼(원하는 총량 입력) 동작한다(`calcTopical`).
- **배치 스케일링 공식**: `personalized` = `1일필요량 = 1회량 × (체중/기준체중) × 1일횟수`, `총필요량 = 1일필요량 × 급여일수`, `배율 = 총필요량 / doseBasis`. `standard`/외용 = `배율 = 원하는총량 / batchYield`, 1회급여량 = `1회량 × (체중/기준체중)`(총량과 무관하게 그 체중 기준 그대로). 모든 재료 = `원 재료량 × 배율`.
- **완성량(batchYield)은 "걸러내고 남은 실제 제품의 양"**: 인퓨즈드 오일·팅쳐·디콕션은 허브가 용매를 머금은 채 걸러지므로 투입량 합보다 훨씬 적게 나온다. 투입량 합을 완성량으로 쓰면 표준 배치형에서 재료가 과소 계산된다(`배율 = 원하는총량 / 완성량`). 아직 실측하지 않은 값은 `yieldMeasured: false` + `yieldNote`로 표시하고, 화면에 경고를 띄운다. 실제로 만들어 재본 뒤 편집에서 값을 고치고 '실측'으로 바꾼다.
- **doseBasis ≠ batchYield일 수 있음**: 대부분은 완성량과 같지만, 밀크시슬 비스킷처럼 도시지가 활성 허브 합계만을 기준으로 할 때는 doseBasis를 그 합계로 따로 둔다 — 배율은 여전히 전체 재료에 동일 적용.
- **단위 환산**: drop(방울) → ml은 `DROP_ML = 0.05`(약 20방울/ml, 추정치)로 통일. `src/lib/calc.ts`의 `toBaseUnit` 참고.

## 접속 비밀번호
- `src/data/accessCode.ts`의 `ACCESS_CODE` 값이 공통 비번. 앱 실행마다 재인증(영속화 안 함) — `pet-herbs-lab`의 AuthGate와 동일 패턴.

## 접속 지역 기록 (관리자 전용)
- 비밀번호 인증에 성공할 때마다 `src/lib/logVisit.ts`가 IP 기반으로 국가/지역/도시만 조회(ipapi.co)해 구글 시트로 전송한다. 이름·IP 원본 등 식별 정보는 저장하지 않는다.
- `src/data/visitLogEndpoint.ts`의 `VISIT_LOG_URL`이 비어 있으면 아무것도 하지 않고 조용히 넘어간다 — 시트/Apps Script 설정 전에는 안전하게 no-op.
- 설정 방법:
  1. 구글 시트를 새로 만들고 1행에 헤더(시각/국가/지역/도시/플랫폼)를 적는다.
  2. 확장 프로그램 → Apps Script → 아래 코드를 붙여넣는다.
     ```js
     function doPost(e) {
       var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
       var data = JSON.parse(e.postData.contents);
       sheet.appendRow([new Date(), data.country || '', data.region || '', data.city || '', data.platform || '']);
       return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
     }
     ```
  3. 배포 → 새 배포 → 유형: 웹앱, 실행: 나, 액세스 권한: 전체 사용자 → 배포 후 나오는 웹앱 URL을 복사.
  4. 그 URL을 `src/data/visitLogEndpoint.ts`의 `VISIT_LOG_URL`에 붙여넣는다.
- 앱에는 별도의 관리자 화면을 두지 않았다 — 기록은 그 구글 시트를 열어서 직접 확인한다(시트 접근 권한 자체가 곧 접근 제어).

## 구조
- `src/types.ts` — Recipe / Ingredient / Dosing / BatchYield 타입
- `src/data/recipes.ts` — 시드 레시피 11개 (허벌리스트 스터디 PDF에서 이식, 임의로 수치를 새로 만들지 말 것)
- `src/lib/calc.ts` — 계산 순수 함수 (toBaseUnit / calcOral / calcTopical / calcStandardBatch / fmtNum)
- `src/store/recipeStore.ts` — zustand + AsyncStorage, 레시피 CRUD + hydrate
- `app/*` — expo-router 화면 (index, recipe/[id], recipe/new, recipe/[id]/edit)

## 검증
- `npm run typecheck` — 타입 체크
- `npm run web` — Expo 웹 개발 서버 (Browser 프리뷰로 확인)
