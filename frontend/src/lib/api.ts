import type { ApiResponse } from './types';
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public detail?: unknown,
    /** Line/field level errors returned by bulk endpoints (e.g. CSV rows). */
    public errors?: unknown,
  ) {
    super(message);
  }
}
export function token() {
  return typeof window === 'undefined'
    ? null
    : sessionStorage.getItem('MajumderGroup_token');
}

export type ApiRequestOptions = {
  /**
   * Skip the automatic redirect to /login when the API returns 401.
   * The login screen uses this so an invalid password is treated as a
   * normal error instead of an expired session.
   */
  skipAuthRedirect?: boolean;
};

export async function api<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const headers = new Headers(init.headers);
  const access = token();
  if (access) headers.set('Authorization', `Bearer ${access}`);
  if (!(init.body instanceof FormData) && init.body)
    headers.set('Content-Type', 'application/json');
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  const body = await res
    .json()
    .catch(() => ({ message: 'Network response was not valid JSON' }));
  if (!res.ok) {
    if (
      res.status === 401 &&
      typeof window !== 'undefined' &&
      !options.skipAuthRedirect
    ) {
      sessionStorage.removeItem('MajumderGroup_token');
      window.location.assign('/login');
    }
    throw new ApiError(
      body.message || 'Request failed',
      res.status,
      body.error,
      body.errors,
    );
  }
  return body;
}
export const query = (p: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams();
  Object.entries(p).forEach(
    ([k, v]) => v !== undefined && v !== '' && s.set(k, String(v)),
  );
  return s.toString();
};
