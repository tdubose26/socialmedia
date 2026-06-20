import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';

let getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  getToken = fn;
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const token = getToken ? await getToken() : null;
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

/**
 * Fetches the stored CSV for a completed request and triggers a browser download.
 * Throws on failure (status not 2xx, etc.) so callers can surface the error.
 */
export async function downloadCsvForRequest(requestId: string): Promise<void> {
  const r = await apiFetch(`/api/content-csv/${requestId}`);
  const json = await r.json();
  if (!r.ok) {
    throw new Error(json?.error ?? `HTTP ${r.status}`);
  }
  const { filename, base64 } = json as { filename: string; base64: string };

  // base64 → raw bytes → Blob. Treating as bytes preserves the UTF-8 BOM exactly.
  const binStr = atob(base64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'text/csv;charset=utf-8' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Mount once at the top of the tree, inside <ClerkProvider>:
 *   1. Wires Clerk's getToken() into apiFetch so any module can make authed calls.
 *   2. Fires a one-time POST to /api/me as soon as the user is signed in, which
 *      triggers the server-side upsert into the Neon `users` table. Runs on every
 *      route, so it doesn't depend on the dashboard being visited first.
 */
export function AuthBridge() {
  const auth = useAuth();
  setTokenGetter(() => auth.getToken());

  const syncedRef = useRef(false);
  useEffect(() => {
    if (!auth.isLoaded || !auth.isSignedIn || syncedRef.current) return;
    syncedRef.current = true;
    apiFetch('/api/me')
      .then((r) => {
        if (!r.ok) console.error('user sync failed:', r.status);
      })
      .catch((err) => console.error('user sync error:', err));
  }, [auth.isLoaded, auth.isSignedIn]);

  return null;
}
