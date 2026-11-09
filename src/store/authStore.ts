// 인증 스토어 — 공통 비밀번호 확인 (영속화하지 않음, 앱 실행마다 재인증)
import { create } from 'zustand';
import { ACCESS_CODE } from '../data/accessCode';
import { logVisit } from '../lib/logVisit';

interface AuthState {
  verified: boolean;
  error: string | null;
  verify: (password: string) => void;
}

const useAuthStore = create<AuthState>((set) => ({
  verified: false,
  error: null,
  verify: (password) => {
    if (!password.trim()) {
      set({ error: '비밀번호를 입력해 주세요.' });
      return;
    }
    if (password === ACCESS_CODE) {
      set({ verified: true, error: null });
      logVisit();
    } else {
      set({ error: '비밀번호가 올바르지 않아요.' });
    }
  },
}));

export default useAuthStore;
