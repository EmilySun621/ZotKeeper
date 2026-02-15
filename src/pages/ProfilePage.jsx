import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ProfileErrorBoundary } from '../components/ProfileErrorBoundary'
import OnboardingFlow from '../components/auth/OnboardingFlow'
import ProfileHeader from '../components/profile/ProfileHeader'
import SavedRecipesTab from '../components/profile/SavedRecipesTab'
import PreferenceSettingsTab from '../components/profile/PreferenceSettingsTab'

const TABS = [
  { id: 'saved', label: 'Saved Recipes' },
  { id: 'preferences', label: 'Preference Settings' },
]

/** Always-visible wrapper so profile content is never "invisible" */
function ProfileShell({ children }) {
  return (
    <div className="min-h-[60vh]">
      {children}
    </div>
  )
}

export default function ProfilePage() {
  const { user, authReady } = useAuth()
  const [tab, setTab] = useState('saved')

  if (!authReady) {
    return (
      <ProfileShell>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-tomato-500 border-t-transparent" />
          <p className="text-sm text-stone-500">Loading profile…</p>
        </div>
      </ProfileShell>
    )
  }

  if (!user) {
    return (
      <>
        <ProfileShell>
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
            <p className="text-sm text-stone-500">Redirecting to login…</p>
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-tomato-500 border-t-transparent" />
          </div>
        </ProfileShell>
        <Navigate to="/login" replace />
      </>
    )
  }

  if (!user.profile?.onboardingCompleted) {
    return (
      <ProfileShell>
        <ProfileErrorBoundary>
          <OnboardingFlow onDone={() => {}} />
        </ProfileErrorBoundary>
      </ProfileShell>
    )
  }

  return (
    <ProfileShell>
      <ProfileErrorBoundary>
        <ProfileHeader />
      </ProfileErrorBoundary>

      <section className="mt-8">
        <div className="mb-4 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                tab === t.id
                  ? 'bg-tomato-500 text-white shadow-warm'
                  : 'bg-cream-200 text-stone-600 hover:bg-cream-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="min-h-[200px]">
          <ProfileErrorBoundary>
            {tab === 'saved' && <SavedRecipesTab />}
            {tab === 'preferences' && <PreferenceSettingsTab />}
          </ProfileErrorBoundary>
        </div>
      </section>
    </ProfileShell>
  )
}
