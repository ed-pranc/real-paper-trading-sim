'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { saveProfile } from '@/lib/actions/profile'
import { resetData, deleteAccount } from '@/lib/actions/auth'
import { Loader2, CheckCircle2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

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
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5" suppressHydrationWarning>
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your personal details. Your nickname appears in the sidebar and header.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Account header */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
              {(nickname || email || 'T')[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{nickname || 'No nickname set'}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <Separator />

          {/* Personal details */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Personal Details</p>
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
          </div>

          <Separator />

          {/* Address */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Address</p>
            <Field label="Address Line 1" value={address1} onChange={setAddress1} placeholder="Street and number" />
            <Field label="Address Line 2" value={address2} onChange={setAddress2} placeholder="Apartment, suite, etc." />
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" value={city} onChange={setCity} placeholder="Vilnius" />
              <Field label="Postal Code" value={postalCode} onChange={setPostalCode} placeholder="LT-01001" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={(v) => { if (v) setCountry(v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LT">Lithuania</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

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
        </CardContent>
      </Card>

      {/* Reset Data */}
      <Card className="border-amber-500/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-amber-500">Reset Trading Data</CardTitle>
          <CardDescription className="text-sm">
            Wipe all deposits, trades, positions, and wallet balance back to zero. Your profile and watchlist are kept.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500">Reset Data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all trading data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete all deposits, transactions, positions, and reset your cash balance to $0.
                  Your profile and watchlist will not be affected. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <form action={resetData}>
                  <AlertDialogAction asChild>
                    <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white">Yes, reset my data</Button>
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
          <CardDescription className="text-sm">
            Permanently delete your account and all associated data. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, all trades, positions, wallet history, and profile data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <form action={deleteAccount}>
                  <AlertDialogAction asChild>
                    <Button type="submit" variant="destructive">Yes, delete my account</Button>
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
