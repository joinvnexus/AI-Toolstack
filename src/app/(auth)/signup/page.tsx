'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, Loader2 } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    });

    if (signUpError) {
      const errorMessage = signUpError.message.toLowerCase();
      if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
        setError('Too many signup attempts. Please wait 60 seconds and try again.');
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    router.push('/login?registered=true');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-brand-surface p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Join us to discover and review AI tools
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                {...register('name')}
                type="text"
                placeholder="John Doe"
                className="w-full rounded-lg border border-white/15 bg-black/20 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/15 bg-black/20 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                {...register('password')}
                type="password"
                placeholder="Create a password"
                className="w-full rounded-lg border border-white/15 bg-black/20 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                {...register('confirmPassword')}
                type="password"
                placeholder="Confirm your password"
                className="w-full rounded-lg border border-white/15 bg-black/20 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-primary py-2.5 text-sm font-medium transition hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-brand-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
