// 관리자 전용 접속 지역 기록 — Google Apps Script 웹앱 URL.
//
// 저장소가 공개라서 URL을 코드에 직접 적지 않고 환경변수로 받는다.
//  - 내 컴퓨터에서 개발할 때: 프로젝트 루트의 `.env.local`에 아래처럼 적어둔다(깃에 올라가지 않음).
//      EXPO_PUBLIC_VISIT_LOG_URL=https://script.google.com/macros/s/.../exec
//  - 깃허브 배포에서 쓰려면: 저장소 Settings → Secrets and variables → Actions에
//      EXPO_PUBLIC_VISIT_LOG_URL 이름으로 같은 값을 등록한다.
//
// 값이 비어 있으면(설정 전) 아무것도 하지 않고 조용히 넘어간다.
export const VISIT_LOG_URL = process.env.EXPO_PUBLIC_VISIT_LOG_URL ?? '';
