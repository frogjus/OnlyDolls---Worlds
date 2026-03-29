'use client'

import { useState } from 'react'
import { BookOpen, Film, Gamepad2, Monitor, Sparkles, Users, User, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to OnlyDolls</h1>
        <p className="mt-1 text-muted-foreground">
          A couple of quick questions to get you started
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How will you use OnlyDolls?</CardTitle>
          <CardDescription>Pick whichever fits best</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {usageOptions.map((opt) => {
            const Icon = opt.icon
            const selected = usage === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUsage(opt.value)}
                className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                  selected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {opt.label}
              </button>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What are you working on?</CardTitle>
          <CardDescription>You can always change this later</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {projectOptions.map((opt) => {
            const Icon = opt.icon
            const selected = projectType === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setProjectType(opt.value)}
                className={`flex flex-col items-center gap-1.5 rounded-md border px-3 py-3 text-sm transition-colors ${
                  selected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <Icon className="h-5 w-5" />
                {opt.label}
              </button>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onComplete}>
          Skip
        </Button>
        <Button onClick={handleContinue} disabled={!usage && !projectType}>
          Continue
        </Button>
      </div>
    </div>
  )
}
