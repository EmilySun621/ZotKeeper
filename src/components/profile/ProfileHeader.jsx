import { useRef } from 'react'
import { useAuth } from '../../context/AuthContext'

function getInitials(username) {
  if (!username) return '?'
  return username.trim().slice(0, 2).toUpperCase()
}

export default function ProfileHeader() {
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)

  const avatarUrl = user?.profile?.avatar ?? ''
  const initials = getInitials(user?.username)

  const handleAvatarChange = (e) => {
    const file = e.target?.files?.[0]
    if (!file || !user) return
    const reader = new FileReader()
    reader.onload = () => {
      updateUser({
        ...user,
        profile: { ...user.profile, avatar: reader.result },
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <header className="rounded-2xl bg-gradient-to-br from-cream-100 to-cream-200/80 p-6 md:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-3xl font-semibold text-honey-600 shadow-lg ring-4 ring-white/80">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-honey-600 hover:text-honey-700"
          >
            Edit photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div className="min-w-0 text-center sm:text-left">
          <h1 className="font-display text-2xl font-semibold text-stone-800">Your Space</h1>
          <p className="mt-1 text-lg text-stone-500">@{user?.username ?? ''}</p>
          <p className="mt-2 text-sm text-stone-500">Your preferences shape your feed and search.</p>
        </div>
      </div>
    </header>
  )
}
