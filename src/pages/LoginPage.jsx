import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Login/signup screen (friend's design): Welcome, tabs, forms.
 * After signup or login with incomplete onboarding, shows onboarding then goes to profile.
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const { user, login, signup } = useAuth()
  const [mode, setMode] = useState('signin')

  useEffect(() => {
    if (!user) return
    const t = setTimeout(() => navigate('/profile', { replace: true }), 0)
    return () => clearTimeout(t)
  }, [user, navigate])

  const [message, setMessage] = useState({ text: '', success: false })

  const handleSignIn = (e) => {
    e.preventDefault()
    const form = e.target
    const username = form.querySelector('#signin-username')?.value?.trim() ?? ''
    const password = form.querySelector('#signin-password')?.value ?? ''
    const result = login(username, password)
    if (!result.ok) {
      setMessage({ text: result.error, success: false })
      return
    }
    setMessage({ text: '', success: false })
  }

  const handleSignUp = (e) => {
    e.preventDefault()
    const form = e.target
    const username = form.querySelector('#signup-username')?.value?.trim() ?? ''
    const password = form.querySelector('#signup-password')?.value ?? ''
    const result = signup(username, password)
    if (!result.ok) {
      setMessage({ text: result.error, success: false })
      return
    }
    setMessage({ text: '', success: false })
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12">
      <div className="font-dancing absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 select-none text-[clamp(4.5rem,14vw,12rem)] font-semibold tracking-wide text-[#f1ece5] opacity-80 pointer-events-none whitespace-nowrap">
        Welcome
      </div>

      <div className="relative z-10 w-full max-w-[500px] flex flex-col items-center gap-5">
        <div className="text-center">
          <h1 className="font-dancing text-4xl font-semibold text-stone-800 sm:text-5xl">
            Welcome
          </h1>
          <p className="mt-2.5 text-stone-600">
            Your cozy recipe corner — save favorites and find new cravings.
          </p>
        </div>

        <div className="flex w-full gap-2.5 rounded-xl p-1">
          <button
            type="button"
            onClick={() => { setMode('signin'); setMessage({ text: '', success: false }) }}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              mode === 'signin'
                ? 'border-transparent bg-[#b79e83] text-white'
                : 'border-stone-200 bg-[#f4efe9] text-stone-700 hover:bg-stone-100'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setMessage({ text: '', success: false }) }}
            className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
              mode === 'signup'
                ? 'border-transparent bg-[#b79e83] text-white'
                : 'border-stone-200 bg-[#f4efe9] text-stone-700 hover:bg-stone-100'
            }`}
          >
            Create Account
          </button>
        </div>

        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="flex w-full flex-col gap-3.5">
            <label className="flex flex-col gap-1.5 text-left text-sm">
              <span>Account name</span>
              <input
                id="signin-username"
                name="username"
                type="text"
                autoComplete="username"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-stone-800 focus:border-[#b79e83] focus:outline-none focus:ring-2 focus:ring-[#b79e83]/20"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-left text-sm">
              <span>Password</span>
              <input
                id="signin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-stone-800 focus:border-[#b79e83] focus:outline-none focus:ring-2 focus:ring-[#b79e83]/20"
              />
            </label>
            <div className={`min-h-[18px] text-sm ${message.success ? 'text-[#3f7b5e]' : 'text-[#c0513c]'}`} role="alert">
              {message.text}
            </div>
            <button
              type="submit"
              className="w-full rounded-xl border-0 bg-[#b79e83] px-4 py-2.5 text-white font-medium shadow-sm hover:bg-[#a08a6e]"
            >
              Sign in
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="flex w-full flex-col gap-3.5">
            <label className="flex flex-col gap-1.5 text-left text-sm">
              <span>Account name</span>
              <input
                id="signup-username"
                name="username"
                type="text"
                autoComplete="username"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-stone-800 focus:border-[#b79e83] focus:outline-none focus:ring-2 focus:ring-[#b79e83]/20"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-left text-sm">
              <span>Password</span>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-stone-800 focus:border-[#b79e83] focus:outline-none focus:ring-2 focus:ring-[#b79e83]/20"
              />
            </label>
            <div className={`min-h-[18px] text-sm ${message.success ? 'text-[#3f7b5e]' : 'text-[#c0513c]'}`} role="alert">
              {message.text}
            </div>
            <button
              type="submit"
              className="w-full rounded-xl border-0 bg-[#b79e83] px-4 py-2.5 text-white font-medium shadow-sm hover:bg-[#a08a6e]"
            >
              Create account
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
