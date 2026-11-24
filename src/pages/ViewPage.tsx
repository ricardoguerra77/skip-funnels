import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { AppTools } from '@/components/AppHeader'
import { LoadingBlock } from '@/components/LoadingBlock'
import { Logo } from '@/components/Logo'
import { FunnelEditor, type EditorHandle } from '@/funnel'
import { useAppearance } from '@/hooks/use-appearance'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { funnelAccess, getSharedFunnel, type FunnelRecord } from '@/services/funnels'
import { acceptInvites } from '@/services/teams'

const noop = () => undefined

export default function ViewPage() {
  const { token = '' } = useParams()
  const { isAuthenticated, loading } = useAuth()
  const [appearance] = useAppearance()
  const [funnel, setFunnel] = useState<FunnelRecord | null>(null)
  const [phase, setPhase] = useState<'load' | 'ready' | 'login' | 'denied' | 'error'>('load')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (loading) return
    let cancelled = false
    setPhase('load')
    const run = async () => {
      if (isAuthenticated) await acceptInvites().catch(() => undefined)
      const found = await getSharedFunnel(token)
      if (cancelled) return
      if (found) {
        setFunnel(found)
        setPhase('ready')
        return
      }
      setPhase(isAuthenticated ? 'denied' : 'login')
    }
    run().catch((err) => {
      if (cancelled) return
      setMessage(getErrorMessage(err))
      setPhase('error')
    })
    return () => {
      cancelled = true
    }
  }, [token, loading, isAuthenticated])

  const access = funnel ? funnelAccess(funnel, pb.authStore.record?.id ?? '') : 'none'
  const canEdit = access === 'owner' || access === 'edit'
  const label = funnel?.visibility === 'public' ? 'Público' : 'Time'

  return (
    <div className="fn-editor-page">
      <header className="fn-topbar">
        <Link
          to={isAuthenticated ? '/' : '/login'}
          className="fn-topbar-btn"
          state={{ from: `/v/${token}` }}
          title="Skip Funnels"
        >
          <Logo variant="mark" className="h-5 w-auto" />
        </Link>
        <span className="text-[var(--text-faint)]">/</span>
        <span className="fn-topbar-name" style={{ border: 'none' }}>
          {funnel?.name ?? 'Visualização'}
        </span>
        {funnel && <span className="fn-topbar-badge">{label}</span>}
        <span className="fn-topbar-status">Somente leitura</span>
        <div className="fn-topbar-spacer" />
        {canEdit && funnel && (
          <Link to={`/f/${funnel.id}`} className="fn-topbar-btn">
            <Pencil size={15} /> Editar
          </Link>
        )}
        {isAuthenticated && <AppTools />}
      </header>
      <div className="fn-editor-canvas">
        {phase === 'ready' && funnel ? (
          <FunnelEditor
            key={funnel.id}
            text={funnel.content}
            readOnly
            host={{
              save: noop,
              notify: noop,
              openUrl: (url) =>
                window.open(/^[a-z]+:/i.test(url) ? url : `https://${url}`, '_blank', 'noopener'),
            }}
            prefs={{ wheelZooms: appearance.wheelZooms }}
            onReady={(_h: EditorHandle) => undefined}
          />
        ) : phase === 'login' ? (
          <Gate
            title="Este funil é do time"
            text="Entre com a conta que foi convidada para ver esta visualização."
            action={{
              to: '/login',
              state: { from: `/v/${token}` },
              label: 'Entrar',
            }}
          />
        ) : phase === 'denied' ? (
          <Gate
            title="Você não tem acesso"
            text="Quem publicou não marcou a sua conta para ver este funil."
            action={{ to: '/', label: 'Ir para os meus funis' }}
          />
        ) : phase === 'error' ? (
          <Gate title="Não deu para abrir" text={message} />
        ) : (
          <LoadingBlock variant="canvas" label="Carregando visualização" />
        )}
      </div>
    </div>
  )
}

function Gate({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action?: { to: string; label: string; state?: { from: string } }
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <Logo className="mb-1 h-14 w-auto text-foreground" />
      <p className="text-lg font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{text}</p>
      {action && (
        <Link
          to={action.to}
          state={action.state}
          className="text-sm font-medium text-primary hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
