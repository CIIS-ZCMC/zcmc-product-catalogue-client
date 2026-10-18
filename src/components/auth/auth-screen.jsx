import { useState } from 'react'
import { CircleCheck } from 'lucide-react'

import zcmcLogo from '@/assets/zcmc-logo.png'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SignInForm } from './auth-forms'
import { ResetPasswordDialog } from './reset-password-dialog'

/** Sign-in screen shown before the app shell. Accounts are created by an administrator, not here. */
export function AuthScreen({ onAuthSuccess }) {
  const [notice, setNotice] = useState('')
  const [signInEmail, setSignInEmail] = useState('')
  const [reset, setReset] = useState({ open: false, email: '', key: 0 })

  const openReset = (email) => setReset((r) => ({ open: true, email, key: r.key + 1 }))

  const handleReset = (email) => {
    setReset((r) => ({ ...r, open: false }))
    setSignInEmail(email)
    setNotice('Your password was reset. Sign in with your new password.')
  }

  return (
    <main className="bg-muted flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md gap-0 py-0">
        <CardHeader className="flex flex-col items-center gap-2 border-b px-6 py-6 text-center">
          <img src={zcmcLogo} alt="" className="h-16 w-auto" />
          <div className="grid gap-0.5">
            <h1 className="text-lg font-semibold">Zamboanga City Medical Center</h1>
            <p className="text-muted-foreground text-sm">Product Catalogue Registry</p>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 px-6 py-6">
          {notice && (
            <Alert>
              <CircleCheck className="text-success" aria-hidden="true" />
              <AlertDescription>{notice}</AlertDescription>
            </Alert>
          )}

          <SignInForm
            key={signInEmail}
            defaultEmail={signInEmail}
            onSuccess={onAuthSuccess}
            onForgotPassword={openReset}
          />

          <p className="text-muted-foreground text-center text-xs">
            Need access? Accounts are created by a system administrator. Contact the Procurement Management Unit.
          </p>
        </CardContent>
      </Card>

      <ResetPasswordDialog
        key={reset.key}
        open={reset.open}
        defaultEmail={reset.email}
        onOpenChange={(open) => setReset((r) => ({ ...r, open }))}
        onReset={handleReset}
      />
    </main>
  )
}
