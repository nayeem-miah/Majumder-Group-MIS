'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { ApiError, api } from '../../lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('MajumderGroup_token')) {
      router.replace('/login');
      return;
    }
    api('/auth/me')
      .then(() => setReady(true))
      .catch((err) => {
        // Only redirect on explicit 401 — network errors should not log the user out.
        // api() already handles 401 internally (clears token + redirects), but we
        // keep this as a safety net. Any other failure (network down, 5xx) means the
        // token may still be valid, so we show the dashboard instead of kicking the user out.
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login');
        } else {
          setReady(true);
        }
      });
  }, [router]);

  return ready ? (
    <AppShell>{children}</AppShell>
  ) : (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-white px-5 py-4 text-sm text-muted shadow-card">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
        Checking your session…
      </div>
    </div>
  );
}
