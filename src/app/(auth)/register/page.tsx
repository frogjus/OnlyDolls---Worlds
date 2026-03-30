'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { showError } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const msg = body.error ?? 'Registration failed'
        setError(msg)
        showError(msg)
        setLoading(false)
        return
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        const msg = 'Account created but sign-in failed. Please log in manually.'
        setError(msg)
        showError(msg)
        setLoading(false)
        return
      }

      window.location.href = '/worlds'
    } catch {
      setError('Something went wrong. Please try again.')
      showError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-10 px-4">
      {/* Logo & tagline */}
      <div className="text-center">
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{
            fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(135deg, var(--od-teal-400), var(--od-cyan-400))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          StoryForge
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--od-text-muted)' }}>
          Your story world, architected.
        </p>
      </div>

      {/* Floating card */}
      <div
        className="w-full max-w-sm rounded-xl border p-6"
        style={{
          background: 'var(--od-bg-surface)',
          borderColor: 'var(--od-border-default)',
          boxShadow: 'var(--od-shadow-elevated)',
        }}
      >
        <div className="mb-5">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--od-text-primary)' }}
          >
            Create account
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--od-text-secondary)' }}>
            Get started with StoryForge
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div
              className="rounded-lg border px-3 py-2.5 text-sm"
              style={{
                borderColor: 'rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)',
                color: '#f87171',
              }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name" className="text-xs font-medium" style={{ color: 'var(--od-text-secondary)' }}>
              Name
            </Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border bg-[var(--od-bg-input)] text-[var(--od-text-primary)] placeholder:text-[var(--od-text-disabled)] focus-visible:ring-[var(--od-teal-500)] focus-visible:border-[var(--od-border-teal)]"
              style={{ borderColor: 'var(--od-border-emphasis)' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-xs font-medium" style={{ color: 'var(--od-text-secondary)' }}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border bg-[var(--od-bg-input)] text-[var(--od-text-primary)] placeholder:text-[var(--od-text-disabled)] focus-visible:ring-[var(--od-teal-500)] focus-visible:border-[var(--od-border-teal)]"
              style={{ borderColor: 'var(--od-border-emphasis)' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-xs font-medium" style={{ color: 'var(--od-text-secondary)' }}>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border bg-[var(--od-bg-input)] text-[var(--od-text-primary)] placeholder:text-[var(--od-text-disabled)] focus-visible:ring-[var(--od-teal-500)] focus-visible:border-[var(--od-border-teal)]"
              style={{ borderColor: 'var(--od-border-emphasis)' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm" className="text-xs font-medium" style={{ color: 'var(--od-text-secondary)' }}>
              Confirm password
            </Label>
            <Input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="border bg-[var(--od-bg-input)] text-[var(--od-text-primary)] placeholder:text-[var(--od-text-disabled)] focus-visible:ring-[var(--od-teal-500)] focus-visible:border-[var(--od-border-teal)]"
              style={{ borderColor: 'var(--od-border-emphasis)' }}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-1 w-full bg-[var(--od-teal-500)] font-medium text-[var(--od-bg-base)] hover:bg-[var(--od-teal-600)] disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </Button>

          <p className="text-center text-sm" style={{ color: 'var(--od-text-muted)' }}>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium transition-colors hover:underline"
              style={{ color: 'var(--od-teal-400)' }}
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
