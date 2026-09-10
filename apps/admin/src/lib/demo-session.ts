const STORAGE_KEY = 'sp2036-admin-ui-v1-session';

export const DEMO_OPERATOR = {
  name: 'Peter',
  email: 'peter@southislandpeter.nz',
  role: 'Operation Staff',
} as const;

export function isDemoSignedIn(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEY) === 'signed-in';
}

export function signInDemo(): void {
  window.localStorage.setItem(STORAGE_KEY, 'signed-in');
}

export function signOutDemo(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
