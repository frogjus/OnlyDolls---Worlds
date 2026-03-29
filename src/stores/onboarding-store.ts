import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SurveyResponses {
  usage: string
  projectType: string
}

interface OnboardingState {
  hasCompletedOnboarding: boolean
  surveyResponses: SurveyResponses
  setCompleted: () => void
  setSurveyResponses: (responses: SurveyResponses) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      surveyResponses: { usage: '', projectType: '' },
      setCompleted: () => set({ hasCompletedOnboarding: true }),
      setSurveyResponses: (responses) => set({ surveyResponses: responses }),
      reset: () =>
        set({
          hasCompletedOnboarding: false,
          surveyResponses: { usage: '', projectType: '' },
        }),
    }),
    { name: 'storyforge-onboarding' },
  ),
)
