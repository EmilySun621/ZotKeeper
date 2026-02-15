import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  DIETARY_OPTIONS,
  ALLERGY_OPTIONS,
  CUISINE_OPTIONS,
  SPICE_OPTIONS,
  syncProfileToPreferences,
} from '../../data/profileOptions'

const ONBOARDING_STEPS = [
  { id: 'intro', title: 'A quick check-in', description: "We'd like to ask a few optional questions to personalize your recipe picks.", type: 'intro' },
  { id: 'dietaryRestrictions', title: 'Dietary preferences', description: "Pick any that apply. We'll avoid ingredients that don't fit.", type: 'multi', options: DIETARY_OPTIONS },
  { id: 'allergies', title: 'Allergies to avoid', description: 'Select common allergens we should exclude for you.', type: 'multi', options: ALLERGY_OPTIONS },
  { id: 'preferredCuisines', title: 'Favorite cuisines', description: 'Choose cuisines you enjoy most.', type: 'multi', options: CUISINE_OPTIONS },
  { id: 'spiceLevel', title: 'Spice level', description: 'How spicy do you like your food?', type: 'single', options: SPICE_OPTIONS },
]

export default function OnboardingFlow({ onDone }) {
  const { user, updateUser } = useAuth()
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState(() => ({
    dietaryRestrictions: [...(user?.profile?.dietaryRestrictions || [])],
    allergies: [...(user?.profile?.allergies || [])],
    preferredCuisines: [...(user?.profile?.preferredCuisines || [])],
    spiceLevel: user?.profile?.spiceLevel || '',
  }))

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-stone-500">Loading…</p>
      </div>
    )
  }

  const step = ONBOARDING_STEPS[stepIndex]
  const totalQuestions = ONBOARDING_STEPS.length - 1
  const questionNum = step.type === 'intro' ? 0 : stepIndex
  const progressPercent = totalQuestions > 0 ? (questionNum / totalQuestions) * 100 : 0

  const applyAnswers = () => {
    if (!user) return
    const updated = {
      ...user,
      profile: {
        ...user.profile,
        dietaryRestrictions: answers.dietaryRestrictions,
        allergies: answers.allergies,
        preferredCuisines: answers.preferredCuisines,
        spiceLevel: answers.spiceLevel,
        onboardingCompleted: true,
      },
    }
    updateUser(updated)
    syncProfileToPreferences(updated.profile)
  }

  const handleNext = () => {
    if (step.type === 'intro') {
      setStepIndex(1)
      return
    }
    if (stepIndex === ONBOARDING_STEPS.length - 1) {
      applyAnswers()
      onDone()
      return
    }
    setStepIndex(stepIndex + 1)
  }

  const handleSkip = () => {
    if (step.type === 'intro') {
      applyAnswers()
      onDone()
      return
    }
    if (step.type === 'multi') setAnswers((a) => ({ ...a, [step.id]: [] }))
    if (step.type === 'single') setAnswers((a) => ({ ...a, [step.id]: '' }))
    if (stepIndex === ONBOARDING_STEPS.length - 1) {
      applyAnswers()
      onDone()
      return
    }
    setStepIndex(stepIndex + 1)
  }

  const toggleMulti = (id, option) => {
    setAnswers((a) => {
      const arr = a[id] || []
      const next = arr.includes(option) ? arr.filter((x) => x !== option) : [...arr, option]
      return { ...a, [id]: next }
    })
  }

  const setSingle = (id, value) => {
    setAnswers((a) => ({ ...a, [id]: value }))
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center px-6 py-8">
      <div className="w-full max-w-[860px] rounded-2xl border-2 border-stone-200 bg-white p-8 shadow-lg sm:p-12">
        <div className="mb-8 space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#f4efe9]">
            <div
              className="h-full rounded-full bg-[#b79e83] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-stone-500">
            Step {questionNum} of {totalQuestions}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="font-playfair text-2xl font-medium text-stone-800">{step.title}</h2>
          <p className="mt-2 text-stone-500">{step.description}</p>
          <div className="mt-6">
            {step.type === 'intro' && (
              <p className="text-sm text-stone-500">
                You can skip any question and update later in your profile.
              </p>
            )}
            {step.type === 'multi' && (
              <div className="flex flex-wrap gap-2">
                {(step.options || []).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMulti(step.id, opt)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      (answers[step.id] || []).includes(opt)
                        ? 'border-[#b79e83] bg-[#f4efe9] text-stone-800'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
            {step.type === 'single' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(step.options || []).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSingle(step.id, opt)}
                    className={`rounded-2xl border px-4 py-3 text-center text-sm transition ${
                      answers[step.id] === opt
                        ? 'border-[#b79e83] bg-[#f4efe9] text-stone-800'
                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex(stepIndex - 1)}
              className="rounded-xl border border-stone-200 bg-transparent px-4 py-2 text-sm text-stone-800-300 hover:bg-[#f4efe9]"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-xl border border-stone-200 bg-transparent px-4 py-2 text-sm text-stone-500 hover:bg-[#f4efe9]"
          >
            {step.type === 'intro' ? 'Skip for now' : 'Skip'}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-xl bg-[#b79e83] px-4 py-2 text-sm font-medium text-white hover:bg-[#a08a6e]"
          >
            {step.type === 'intro' ? 'Start' : stepIndex === ONBOARDING_STEPS.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
