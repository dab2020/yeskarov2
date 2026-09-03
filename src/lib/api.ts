import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';
let authToken: string | null = null;

export function setApiToken(token: string | null) { authToken = token; }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(String(body.error ?? 'Something went wrong. Please try again.'));
  return body as T;
}

export function login(email: string, password: string) {
  return request<{ token: string; user: import('@/types/domain').User }>('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
}
export function signup(name: string, email: string, password: string, role: 'buyer' | 'seller') {
  return request<{ token: string; user: import('@/types/domain').User }>('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, role }) });
}
export function me() { return request<{ user: import('@/types/domain').User }>('/api/auth/me'); }

export async function transcribeAudio(audio: Blob | string, language?: 'ur' | 'en') {
  const form = new FormData();
  if (typeof audio === 'string') {
    form.append('file', { uri: audio, name: 'project-terms.m4a', type: 'audio/mp4' } as unknown as Blob);
  } else {
    form.append('file', audio, 'project-terms.webm');
  }
  if (language) form.append('language', language);
  return request<{ transcript: string; detectedLanguage?: string }>('/api/ai/transcribe', { method: 'POST', body: form });
}

export function structureTerms(transcript: string) {
  return request<{ scope: string; deliverables: string[]; exclusions: string[]; deadline: string | null; totalAmount: number | null; currency: string }>(
    '/api/ai/structure-terms',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript }) },
  );
}

export function isApiConfigured() {
  return Boolean(process.env.EXPO_PUBLIC_API_URL) && (Platform.OS === 'web' || API_URL !== 'http://localhost:8787');
}
