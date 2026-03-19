'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileModal } from '@/components/profile/profile-modal'

interface ProfileData {
  nickname: string | null
  first_name: string | null
  last_name: string | null
  address_1: string | null
  address_2: string | null
  city: string | null
  postal_code: string | null
  country: string | null
}

interface ProfileCompletionGateProps {
  profileComplete: boolean
  profile: ProfileData | null
  email: string
  children: React.ReactNode
}

export function ProfileCompletionGate({
  profileComplete,
  profile,
  email,
  children,
}: ProfileCompletionGateProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(profileComplete)

  function handleSaveSuccess() {
    setDismissed(true)
    router.refresh()
  }

  return (
    <>
      {children}
      <ProfileModal
        open={!dismissed}
        onOpenChange={() => {}}
        profile={profile}
        email={email}
        locked
        onSaveSuccess={handleSaveSuccess}
      />
    </>
  )
}
