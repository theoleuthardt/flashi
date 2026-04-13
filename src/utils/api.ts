const TOKEN_KEY = 'flashi-token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function decodeToken(): { username: string; isAdmin: boolean } | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload)) as { username: string; isAdmin: boolean };
  } catch {
    return null;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ message: 'Server error' }))) as {
      message?: string;
    };
    throw new Error(err.message ?? 'Unknown error');
  }
  return res.json() as Promise<T>;
}

export async function getAuthStatus(): Promise<{ setup: boolean }> {
  return request<{ setup: boolean }>('/auth/status');
}

export async function setupPassword(
  password: string,
  username?: string
): Promise<{ token: string }> {
  return request<{ token: string }>('/auth/setup', {
    method: 'POST',
    body: JSON.stringify({ password, username }),
  });
}

export async function login(
  password: string,
  username?: string
): Promise<{ token: string; username: string; isAdmin: boolean }> {
  return request<{ token: string; username: string; isAdmin: boolean }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password, username }),
  });
}

export async function verifyToken(): Promise<boolean> {
  try {
    await request('/auth/verify');
    return true;
  } catch {
    return false;
  }
}

// ── Admin ─────────────────────────────────────────────────────────

export async function getAdminUsers(): Promise<{
  users: Array<{ username: string; isAdmin: boolean }>;
}> {
  return request('/admin/users');
}

export async function createAdminUser(username: string, password: string): Promise<void> {
  await request('/admin/users', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function updateAdminUser(
  username: string,
  data: { password?: string; isAdmin?: boolean }
): Promise<void> {
  await request(`/admin/users/${encodeURIComponent(username)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteAdminUser(username: string): Promise<void> {
  await request(`/admin/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
}
