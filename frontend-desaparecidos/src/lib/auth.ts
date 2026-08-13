const TOKEN_KEY = 'desaparecidos_token';
const USER_KEY = 'desaparecidos_user';

interface UserData {
  token: string;
  rol: string;
}

export function saveAuth(token: string, rol: string): void {
  if (typeof window === 'undefined') return;
  const data: UserData = { token, rol };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('auth-change'));
  window.dispatchEvent(new Event('storage'));
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): UserData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.rol === 'ADMIN';
}

export function isFamiliar(): boolean {
  const user = getUser();
  return user?.rol === 'FAMILIAR';
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('auth-change'));
  window.dispatchEvent(new Event('storage'));
}
