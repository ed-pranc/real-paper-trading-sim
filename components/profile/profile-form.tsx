'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { saveProfile } from '@/lib/actions/profile'
import { Loader2, CheckCircle2, User } from 'lucide-react'

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

interface ProfileFormProps {
  profile: ProfileData | null
  email: string
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium leading-none">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  )
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [address1, setAddress1] = useState(profile?.address_1 ?? '')
  const [address2, setAddress2] = useState(profile?.address_2 ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [postalCode, setPostalCode] = useState(profile?.postal_code ?? '')
  const [country, setCountry] = useState(profile?.country ?? 'LT')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!nickname.trim()) { setError('Nickname is required'); return }
    setError('')
    startTransition(async () => {
      try {
        await saveProfile({
          nickname: nickname.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          address_1: address1.trim(),
          address_2: address2.trim(),
          city: city.trim(),
          postal_code: postalCode.trim(),
          country,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  return (
    <div className="space-y-6 max-w-xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your personal details. Your nickname appears in the sidebar and header.
        </p>
      </div>

      {/* Account info card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold shrink-0">
              {(nickname || email || 'T')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{nickname || 'No nickname set'}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal details card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Nickname"
            value={nickname}
            onChange={setNickname}
            placeholder="e.g. TradingPro"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="John" />
            <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="Smith" />
          </div>
        </CardContent>
      </Card>

      {/* Address card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Address Line 1" value={address1} onChange={setAddress1} placeholder="Street and number" />
          <Field label="Address Line 2" value={address2} onChange={setAddress2} placeholder="Apartment, suite, etc." />

          <div className="grid grid-cols-2 gap-4">
            <Field label="City" value={city} onChange={setCity} placeholder="Vilnius" />
            <Field label="Postal Code" value={postalCode} onChange={setPostalCode} placeholder="LT-01001" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">Country</label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LT">Lithuania</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-full bg-green-600 hover:bg-green-700 px-8"
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
          ) : (
            'Save Profile'
          )}
        </Button>

        {saved && (
          <div className="flex items-center gap-1.5 text-sm text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            Profile saved
          </div>
        )}
      </div>
    </div>
  )
}
