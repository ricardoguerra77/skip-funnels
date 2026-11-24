import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err } = await requestPasswordReset(email.trim())
    setBusy(false)
    if (err) {
      setError(getErrorMessage(err))
      return
    }
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="h-20 w-auto text-foreground" />
          <p className="text-sm text-muted-foreground">Recuperar a senha do Skip Funnels.</p>
        </div>
        <div className="grid gap-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          {sent ? (
            <p className="text-sm leading-relaxed">
              Se existir uma conta com esse e-mail, o link para criar uma nova senha já foi enviado.
              Olhe também a caixa de spam.
            </p>
          ) : (
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                Enviar link
              </Button>
            </form>
          )}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Voltar para entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
