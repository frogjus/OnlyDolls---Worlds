'use client'

import { useState } from 'react'
import { BookOpen, Film, Gamepad2, Monitor, Sparkles, Users, User, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOnboardingStore } from '@/stores/onboarding-store'

const usageOptions = [
  { value: 'solo', label: 'Solo writer', icon: User },
  { value: 'team', label: 'Writing team', icon: Users },
  { value: 'exploring', label: 'Just exploring', icon: Compass },
] as const

const projectOptions = [
  { value: 'novel', label: 'Novel', icon: BookOpen },
  { value: 'screenplay', label: 'Screenplay', icon: Film },
  { value: 'tv', label: 'TV Series', icon: Monitor },
  { value: 'game', label: 'Game', icon: Gamepad2 },
  { value: 'other', label: 'Other', icon: Sparkles },
] as const

interface SignupSurveyProps {
  onComplete: () => void
}

export function SignupSurvey({ onComplete }: SignupSurveyProps) {
  const setSurveyResponses = useOnboardingStore((s) => s.setSurveyResponses)
  const [usage, setUsage] = useState('')
  const [projectType, setProjectType] = useState('')

  function handleContinue() {
    setSurveyResponses({ usage, projectType })
    onComplete()
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--od-text-primary)' }}
        >
          Welcome to StoryForge
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--od-text-secondary)' }}>
          A couple of quick questions to get you started
        </p>
      </div>

      {/* Usage question */}
      <div
        className="rounded-xl border p-5"
        style={{
          background: 'var(--od-bg-surface)',
          borderColor: 'var(--od-border-default)',
          boxShadow: 'var(--od-shadow-card)',
        }}
      >
        <div className="mb-3">
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--od-text-primary)' }}
          >
            How will you use StoryForge?
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--od-text-muted)' }}>
            Pick whichever fits best
          </p>
        </div>
        <div className="grid gap-2">
          {usageOptions.map((opt) => {
            const Icon = opt.icon
            const selected = usage === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUsage(opt.value)}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all duration-150"
                style={{
                  borderColor: selected ? 'var(--od-border-teal)' : 'var(--od-border-emphasis)',
                  background: selected ? 'rgba(20,184,166,0.08)' : 'transparent',
                  color: selected ? 'var(--od-teal-300)' : 'var(--od-text-secondary)',
                  boxShadow: selected ? 'var(--od-glow-teal-sm)' : 'none',
                }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Project type question */}
      <div
        className="rounded-xl border p-5"
        style={{
          background: 'var(--od-bg-surface)',
          borderColor: 'var(--od-border-default)',
          boxShadow: 'var(--od-shadow-card)',
        }}
      >
        <div className="mb-3">
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--od-text-primary)' }}
          >
            What are you working on?
          </h2>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--od-text-muted)' }}>
            You can always change this later
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {projectOptions.map((opt) => {
            const Icon = opt.icon
            const selected = projectType === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setProjectType(opt.value)}
                className="flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-all duration-150"
                style={{
                  borderColor: selected ? 'var(--od-border-teal)' : 'var(--od-border-emphasis)',
                  background: selected ? 'rgba(20,184,166,0.08)' : 'transparent',
                  color: selected ? 'var(--od-teal-300)' : 'var(--od-text-secondary)',
                  boxShadow: selected ? 'var(--od-glow-teal-sm)' : 'none',
                }}
              >
                <Icon className="h-5 w-5" />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={onComplete}
          className="text-[var(--od-text-muted)] hover:text-[var(--od-text-secondary)] hover:bg-[var(--od-bg-surface)]"
        >
          Skip
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!usage && !projectType}
          className="bg-[var(--od-teal-500)] font-medium text-[var(--od-bg-base)] hover:bg-[var(--od-teal-600)] disabled:opacity-50"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
