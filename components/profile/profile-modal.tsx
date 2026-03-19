'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ProfileForm } from '@/components/profile/profile-form'

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

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: ProfileData | null
  email: string
  /** When true, the modal cannot be dismissed — used for first-login completion gate */
  locked?: boolean
  onSaveSuccess?: () => void
}

export function ProfileModal({
  open,
  onOpenChange,
  profile,
  email,
  locked = false,
  onSaveSuccess,
}: ProfileModalProps) {
  return (
    <Dialog open={open} onOpenChange={locked ? undefined : onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        showCloseButton={!locked}
        onPointerDownOutside={locked ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={locked ? (e) => e.preventDefault() : undefined}
      >
        {locked && (
          <DialogHeader>
            <DialogTitle>Complete your profile</DialogTitle>
            <DialogDescription>
              Please set a nickname to personalise your experience before continuing.
            </DialogDescription>
          </DialogHeader>
        )}
        <ProfileForm
          profile={profile}
          email={email}
          onSaveSuccess={onSaveSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
