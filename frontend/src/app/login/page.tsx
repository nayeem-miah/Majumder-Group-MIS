'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { api, ApiError } from '../../lib/api';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function friendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return error.message || 'Invalid email or password.';
    }
    if (error.status === 429) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (error.status === 503) {
      return (
        error.message ||
        'Demo login is not configured. Ask an administrator to check the server settings.'
      );
    }
    if (error.status >= 500) {
      return 'The server is temporarily unavailable. Please try again.';
    }
    return error.message || 'Unable to sign in. Please try again.';
  }

  return 'Unable to connect to the server. Please try again.';
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const pendingRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const busy = isSubmitting || demoBusy;

  const completeLogin = (accessToken: string, message: string) => {
    sessionStorage.setItem('MajumderGroup_token', accessToken);
    toast.dismiss('login-error');
    toast.success(message, { id: 'login-success' });
    router.push('/dashboard');
  };

  const onSubmit = async (values: LoginFormValues) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    try {
      const response = await api<{ accessToken: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: values.email.trim(),
            password: values.password,
          }),
        },
        { skipAuthRedirect: true },
      );
      completeLogin(
        response.data.accessToken,
        'Signed in successfully. Redirecting…',
      );
    } catch (error) {
      toast.error(friendlyErrorMessage(error), { id: 'login-error' });
    } finally {
      pendingRef.current = false;
    }
  };

  const onDemoLogin = async () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setDemoBusy(true);
    try {
      // The server resolves the configured demo credentials and performs a
      // real /auth/login against the existing auth service. Credentials are
      // never shipped to the browser.
      const response = await api<{ accessToken: string }>(
        '/auth/demo-login',
        { method: 'POST' },
        { skipAuthRedirect: true },
      );
      completeLogin(
        response.data.accessToken,
        'Signed in with the demo account. Redirecting…',
      );
    } catch (error) {
      toast.error(friendlyErrorMessage(error), { id: 'login-error' });
    } finally {
      setDemoBusy(false);
      pendingRef.current = false;
    }
  };

  const fieldClass = (invalid: boolean) =>
    `h-12 w-full rounded-xl border bg-white px-4 text-sm text-navy shadow-sm outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
      invalid
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
        : 'border-slate-200 hover:border-slate-300 focus:border-brand focus:ring-brand/10'
    }`;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#eef4fb] px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(16,42,67,0.022)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,42,67,0.022)_1px,transparent_1px)] bg-[size:46px_46px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 right-1/4 h-80 w-80 rounded-full bg-brand/10 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-[440px]">
        <section
          className="rounded-[24px] border border-slate-200/80 bg-white p-8 shadow-[0_30px_80px_-32px_rgba(16,42,67,0.35)] sm:p-10"
          aria-labelledby="login-title"
        >
          <header className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy text-sm font-bold tracking-tight text-white">
              MG
            </span>
            <span className="flex flex-col">
              <span className="text-[15px] font-bold tracking-tight text-navy">
                Majumder Group
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
                GarmentFlow MIS
              </span>
            </span>
          </header>

          <div className="mb-8 mt-9">
            <h1
              id="login-title"
              className="text-[32px] font-bold leading-[1.15] tracking-[-0.03em] text-navy"
            >
              Welcome Back
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Sign in to manage manufacturing and dispatch operations.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[13px] font-semibold text-ink"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="admin@company.com"
                disabled={busy}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={fieldClass(Boolean(errors.email))}
                {...register('email')}
              />
              {errors.email ? (
                <p
                  id="email-error"
                  role="alert"
                  className="mt-2 text-xs text-red-600"
                >
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-[13px] font-semibold text-ink">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="rounded text-xs font-semibold text-brand transition hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={busy}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className={`${fieldClass(Boolean(errors.password))} pr-4`}
                {...register('password')}
              />
              {errors.password ? (
                <p
                  id="password-error"
                  role="alert"
                  className="mt-2 text-xs text-red-600"
                >
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={busy}
              className={`mt-1 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand text-[15px] font-semibold text-white shadow-sm shadow-brand/25 transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                busy ? 'animate-pulse' : ''
              }`}
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              or
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onDemoLogin}
            className={`inline-flex h-12 w-full items-center justify-center rounded-xl border border-brand/25 bg-brand/5 text-[15px] font-semibold text-brand transition hover:border-brand/40 hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${
              demoBusy ? 'animate-pulse' : ''
            }`}
          >
            {demoBusy ? 'Signing in…' : 'Demo Login'}
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            Explore the system with demo admin access.
          </p>

          <footer className="mt-8 border-t border-slate-100 pt-5 text-center text-xs font-medium tracking-wide text-slate-500">
            Secure Admin Access
          </footer>
        </section>

        <p className="mt-5 text-center text-[11px] tracking-wide text-slate-500">
          © {new Date().getFullYear()} Majumder Group. All rights reserved.
        </p>
      </div>
    </main>
  );
}
