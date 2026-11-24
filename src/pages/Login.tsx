import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/hooks/use-auth'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'

const FIELD_PT: Record<string, string> = {
  email: 'E-mail inválido ou já cadastrado.',
  password: 'A senha precisa ter pelo menos 8 caracteres.',
}

export default function Login() {
  const { isAuthenticated, loading, signIn, signUp } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const from = (location.state as { from?: string } | null)?.from ?? '/'
  if (!loading && isAuthenticated) return <Navigate to={from} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setFieldErrors({})
    const { error: err } =
      mode === 'in'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, name.trim())
    setBusy(false)
    if (!err) return
    const fields = extractFieldErrors(err)
    if (Object.keys(fields).length) {
      setFieldErrors(
        Object.fromEntries(Object.keys(fields).map((k) => [k, FIELD_PT[k] ?? fields[k]])),
      )
    } else if (mode === 'in') {
      setError('E-mail ou senha incorretos.')
    } else {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="h-20 w-auto text-foreground" />
          <p className="text-sm text-muted-foreground">
            Construtor visual de funis de venda: tráfego, páginas, eventos, mensagens e ticket
            total.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="grid gap-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm"
        >
          {mode === 'up' && (
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}
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
            {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={mode === 'up' ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            />
            {fieldErrors.password && (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {mode === 'in' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        {mode === 'in' && (
          <p className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              Esqueci a senha
            </Link>
          </p>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {mode === 'in' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => {
              setMode(mode === 'in' ? 'up' : 'in')
              setError('')
              setFieldErrors({})
            }}
          >
            {mode === 'in' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  )
}
