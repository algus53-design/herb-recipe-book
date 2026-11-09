// 접속 지역 기록 — 관리자만 보는 구글 시트로 국가/지역/도시만 조용히 전송.
// 개인 식별 정보(IP 원본, 이름 등)는 저장하지 않는다. 실패해도 앱 사용에 영향 없음.
import { Platform } from 'react-native';
import { VISIT_LOG_URL } from '../data/visitLogEndpoint';

export async function logVisit() {
  if (!VISIT_LOG_URL) return;
  try {
    const geo = await fetch('https://ipapi.co/json/').then((r) => r.json());
    const payload = {
      country: geo.country_name ?? '',
      region: geo.region ?? '',
      city: geo.city ?? '',
      platform: Platform.OS,
    };
    await fetch(VISIT_LOG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      ...(Platform.OS === 'web' ? { mode: 'no-cors' as RequestMode } : {}),
    });
  } catch {
    // 지역 조회·기록 실패는 조용히 무시
  }
}
