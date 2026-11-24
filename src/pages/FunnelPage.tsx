import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  LayoutTemplate,
  MoreHorizontal,
  Trash2,
  Share2,
  Pointer,
} from 'lucide-react'
import { toast } from 'sonner'
import { FloatingMenu, type MenuEntry, type MenuState } from '@/components/FloatingMenu'
import { PresentationLaser } from '@/components/PresentationLaser'
import { LoadingBlock } from '@/components/LoadingBlock'
import { AppTools } from '@/components/AppHeader'
import { Logo } from '@/components/Logo'
import { useDialogs } from '@/components/dialogs/DialogProvider'
import { FunnelEditor, type EditorHandle, type FunnelHost, type Viewport } from '@/funnel'
import { useAppearance } from '@/hooks/use-appearance'
import { useRealtime } from '@/hooks/use-realtime'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { pickLocalFile, templateChoices, type TemplateChoice } from '@/lib/funnel-files'
import { assetUrl, listAssets, uploadAsset, type AssetRecord } from '@/services/assets'
import {
  createFunnel,
  deleteFunnel,
  getFunnel,
  listFunnels,
  updateFunnel,
  funnelAccess,
  type BodyRecord,
  type FunnelRecord,
} from '@/services/funnels'
import pb from '@/lib/pocketbase/client'
import { PublishDialog } from '@/components/PublishDialog'
type SaveStatus = 'saved' | 'pending' | 'saving' | 'error'
const STATUS_TEXT: Record<SaveStatus, string> = {
  saved: 'Salvo',
  pending: 'Alterações não salvas',
  saving: 'Salvando...',
  error: 'Erro ao salvar — clique para tentar de novo',
}
/** Arquivos enviados ficam como "asset/<id>/<nome original>". */
const ASSET_PREFIX = 'asset/'
const assetIdOf = (path: string) =>
  path.startsWith(ASSET_PREFIX) ? path.slice(ASSET_PREFIX.length).split('/')[0] : null
const assetPath = (a: AssetRecord) => `${ASSET_PREFIX}${a.id}/${a.name}`
const SAVE_DELAY = 600
export default function FunnelPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const [appearance] = useAppearance()
  const [record, setRecord] = useState<FunnelRecord | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<SaveStatus>('saved')
  const [menu, setMenu] = useState<MenuState | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const pageRef = useRef<HTMLDivElement>(null)
  const handle = useRef<EditorHandle | null>(null)
  const assets = useRef(new Map<string, AssetRecord>())
  const templateChoicesRef = useRef<TemplateChoice[]>([])
  const templates = useRef<{ id: string; label: string; json: string }[]>([])
  // ------------------------------------------------------------ carregar
  const loadAssets = useCallback(async () => {
    const list = await listAssets()
    assets.current = new Map(list.map((a) => [a.id, a]))
  }, [])
  useEffect(() => {
    let cancelled = false
    setReady(false)
    setRecord(null)
    setLoadError(null)
    Promise.all([getFunnel(id), loadAssets(), listFunnels()])
      .then(([rec, , allFunnels]) => {
        if (cancelled) return
        const choices = templateChoices(allFunnels).filter((t) => t.id !== rec.id)
        templateChoicesRef.current = choices
        templates.current = choices.map((t) => ({
          id: t.id,
          label: t.name,
          json: t.content(),
        }))
        const access = funnelAccess(rec)
        if (access === 'view' && rec.share_token) {
          navigate(`/v/${rec.share_token}`, { replace: true })
          return
        }
        if (access === 'none') {
          setLoadError('Você não tem acesso a este funil.')
          return
        }
        setRecord(rec)
        setName(rec.name)
        setReady(true)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err))
      })
    return () => {
      cancelled = true
    }
  }, [id, loadAssets, navigate])
  // ------------------------------------------------------------ salvar (fila: uma gravação por vez, sempre a mais recente)
  const saver = useRef({ pending: null as string | null, inflight: false, timer: 0 })
  /** Conteúdos que esta aba gravou: o eco deles pelo tempo real é ignorado. */
  const sent = useRef<string[]>([])
  const pump = useCallback(async () => {
    const s = saver.current
    window.clearTimeout(s.timer)
    if (s.inflight || s.pending === null) return
    const text = s.pending
    s.pending = null
    s.inflight = true
    sent.current = [...sent.current.slice(-19), text]
    setStatus('saving')
    try {
      await updateFunnel(id, { content: text })
      s.inflight = false
      if (s.pending !== null) void pump()
      else setStatus('saved')
    } catch (err) {
      s.inflight = false
      if (s.pending === null) s.pending = text
      setStatus('error')
      toast.error(`Não consegui salvar o funil: ${getErrorMessage(err)}`)
    }
  }, [id])
  const schedule = useCallback(
    (text: string) => {
      const s = saver.current
      s.pending = text
      setStatus('pending')
      window.clearTimeout(s.timer)
      s.timer = window.setTimeout(() => void pump(), SAVE_DELAY)
    },
    [pump],
  )
  // sair da página: grava na hora o que estiver pendente
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      handle.current?.flush()
      const s = saver.current
      if (s.pending !== null || s.inflight) {
        void pump()
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
      handle.current?.flush()
      void pump()
    }
  }, [pump])
  // ------------------------------------------------------------ tempo real (outra aba / outro dispositivo)
  useRealtime<FunnelRecord>(
    'funnels',
    (e) => {
      if (e.record.id !== id) return
      if (e.action === 'delete') {
        toast('Este funil foi excluído.')
        navigate('/')
        return
      }
      if (e.action !== 'update') return
      setRecord((r) => (r ? { ...r, name: e.record.name, is_template: e.record.is_template } : r))
      if (document.activeElement?.id !== 'funnel-name') setName(e.record.name)
      const text = e.record.content
      if (sent.current.includes(text) || saver.current.pending !== null || saver.current.inflight)
        return
      handle.current?.loadText(text)
    },
    ready,
  )
  useRealtime<BodyRecord>(
    'funnel_bodies',
    (e) => {
      if (e.action === 'delete' || e.record.funnel !== id) return
      setRecord((r) => (r ? { ...r, name: e.record.name, content: e.record.content } : r))
      if (document.activeElement?.id !== 'funnel-name') setName(e.record.name)
      const text = e.record.content
      if (sent.current.includes(text) || saver.current.pending !== null || saver.current.inflight)
        return
      handle.current?.loadText(text)
    },
    ready,
  )
  useRealtime('assets', () => void loadAssets(), ready)
  // ------------------------------------------------------------ host do editor
  const upload = useCallback(async (files: File[]) => {
    const out: string[] = []
    const t = toast.loading(
      files.length === 1
        ? `Enviando “${files[0].name}”...`
        : `Enviando ${files.length} arquivos...`,
    )
    for (const f of files) {
      try {
        const rec = await uploadAsset(f)
        assets.current.set(rec.id, rec)
        out.push(assetPath(rec))
      } catch (err) {
        toast.error(`“${f.name}”: ${getErrorMessage(err)}`)
      }
    }
    toast.dismiss(t)
    return out
  }, [])
  const vpKey = `funis-viewport:${id}`
  const host = useMemo<FunnelHost>(
    () => ({
      save: schedule,
      notify: (m) => toast(m),
      openUrl: (url) =>
        window.open(/^[a-z]+:/i.test(url) ? url : `https://${url}`, '_blank', 'noopener'),
      openNote: (path) => {
        const asset = assets.current.get(assetIdOf(path) ?? '')
        if (asset) window.open(assetUrl(asset), '_blank', 'noopener')
        else toast.error(`Arquivo não encontrado: ${path.split('/').pop()}`)
      },
      noteExists: (path) => {
        const assetId = assetIdOf(path)
        return !!assetId && assets.current.has(assetId)
      },
      displayName: (path) => {
        const asset = assets.current.get(assetIdOf(path) ?? '')
        return asset?.name ?? path.split('/').pop() ?? path
      },
      pickFile: async () => {
        const file = await pickLocalFile()
        if (!file) return null
        const [path] = await upload([file])
        return path ?? null
      },
      resourceUrl: (path) => {
        const asset = assets.current.get(assetIdOf(path) ?? '')
        return asset ? assetUrl(asset) : null
      },
      uploadFiles: upload,
      loadViewport: () => {
        try {
          return JSON.parse(localStorage.getItem(vpKey) || 'null') as Viewport | null
        } catch {
          return null
        }
      },
      saveViewport: (vp) => localStorage.setItem(vpKey, JSON.stringify(vp)),
      get templates() {
        return templates.current
      },
      pickTemplate: async () => {
        let choices = templateChoicesRef.current
        if (!choices.length) {
          try {
            const all = await listFunnels()
            choices = templateChoices(all).filter((t) => t.id !== id)
            templateChoicesRef.current = choices
            templates.current = choices.map((t) => ({
              id: t.id,
              label: t.name,
              json: t.content(),
            }))
          } catch {
            /* lista em cache abaixo */
          }
        }
        if (!choices.length) {
          toast.error('Nenhum modelo disponível.')
          return null
        }
        const picked = await dialogs.pickTemplate({
          templates: choices.map((t) => ({ id: t.id, label: t.name })),
        })
        if (!picked) return null
        const choice = choices.find((t) => t.id === picked)
        return choice?.content() ?? null
      },
    }),
    [schedule, upload, vpKey, dialogs, id],
  )
  const prefs = useMemo(() => ({ wheelZooms: appearance.wheelZooms }), [appearance.wheelZooms])
  const onReady = useCallback((h: EditorHandle) => {
    handle.current = h
  }, [])
  // ------------------------------------------------------------ barra
  const commitName = async () => {
    const v = name.trim()
    if (!record || !v || v === record.name) {
      setName(record?.name ?? '')
      return
    }
    try {
      await updateFunnel(id, { name: v })
      setRecord({ ...record, name: v })
    } catch (err) {
      toast.error(getErrorMessage(err))
      setName(record.name)
    }
  }
  /** Conteúdo atual (com o que ainda não foi gravado). */
  const currentContent = () => {
    handle.current?.flush()
    return saver.current.pending ?? sent.current[sent.current.length - 1] ?? record?.content ?? ''
  }
  const openMenu = (e: React.MouseEvent) => {
    if (!record) return
    const owner = funnelAccess(record) === 'owner'
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenu({
      x: r.right - 240,
      y: r.bottom + 6,
      items: [
        ...(owner
          ? [{ label: 'Publicar…', icon: <Share2 size={15} />, onClick: () => setPublishing(true) }]
          : []),
        {
          label: 'Duplicar',
          icon: <Copy size={15} />,
          onClick: async () => {
            try {
              const rec = await createFunnel({
                name: `${name} (cópia)`,
                content: currentContent(),
                is_template: record.is_template,
              })
              navigate(`/f/${rec.id}`)
            } catch (err) {
              toast.error(getErrorMessage(err))
            }
          },
        },
        ...(!record.is_template
          ? [
              {
                label: 'Transformar em modelo…',
                icon: <LayoutTemplate size={15} />,
                onClick: async () => {
                  const n = await dialogs.prompt({
                    title: 'Transformar em modelo',
                    value: name,
                    cta: 'Criar modelo',
                  })
                  if (!n) return
                  try {
                    await createFunnel({ name: n, content: currentContent(), is_template: true })
                    toast.success(
                      `Modelo “${n}” criado. Ele aparece em “Novo funil” e na seção Modelos.`,
                    )
                  } catch (err) {
                    toast.error(getErrorMessage(err))
                  }
                },
              },
            ]
          : []),
        ...(owner
          ? [
              'sep',
              {
                label: record.is_template ? 'Excluir modelo…' : 'Excluir funil…',
                icon: <Trash2 size={15} />,
                danger: true,
                onClick: async () => {
                  const ok = await dialogs.confirm({
                    title: record.is_template ? 'Excluir modelo' : 'Excluir funil',
                    message: `“${name}” será excluído permanentemente.`,
                    cta: 'Excluir',
                  })
                  if (!ok) return
                  try {
                    saver.current.pending = null
                    await deleteFunnel(id)
                    navigate('/')
                  } catch (err) {
                    toast.error(getErrorMessage(err))
                  }
                },
              },
            ]
          : []),
      ] as MenuEntry[],
    })
  }
  const stopPresent = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
    setPresenting(false)
  }
  const togglePresent = () => {
    if (presenting) {
      stopPresent()
      return
    }
    setPresenting(true)
    void pageRef.current?.requestFullscreen().catch(() => undefined)
  }
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setPresenting(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-center">
        <Logo className="mb-1 h-12 w-auto text-foreground" />
        <p className="text-lg font-semibold">Não deu para abrir este funil</p>
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <button
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => navigate('/')}
        >
          Voltar para a galeria
        </button>
      </div>
    )
  }
  return (
    <div ref={pageRef} className={`fn-editor-page${presenting ? ' is-presenting' : ''}`}>
      <header className="fn-topbar">
        <button
          className="fn-topbar-btn"
          onClick={() => navigate('/')}
          title="Voltar para a galeria"
        >
          <ArrowLeft size={16} />
          <Logo variant="mark" className="h-5 w-auto" />
        </button>
        <span className="text-[var(--text-faint)]">/</span>
        <input
          id="funnel-name"
          className="fn-topbar-name"
          value={name}
          disabled={!record}
          size={Math.max(12, name.length + 2)}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void commitName()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') {
              setName(record?.name ?? '')
              ;(e.target as HTMLInputElement).blur()
            }
          }}
        />
        {record?.is_template && <span className="fn-topbar-badge">modelo</span>}
        {record?.visibility === 'public' && <span className="fn-topbar-badge">público</span>}
        {record?.visibility === 'team' && <span className="fn-topbar-badge">time</span>}
        <button
          className={`fn-topbar-status${status === 'error' ? ' is-error' : ''}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: status === 'error' ? 'pointer' : 'default',
          }}
          onClick={() => status === 'error' && void pump()}
        >
          {ready ? STATUS_TEXT[status] : ''}
        </button>
        <div className="fn-topbar-spacer" />
        {record && (
          <button
            className={`fn-topbar-btn${presenting ? ' is-on' : ''}`}
            onClick={() => togglePresent()}
            title={presenting ? 'Sair da apresentação' : 'Apresentar com laser'}
          >
            <Pointer size={16} /> {presenting ? 'Sair' : 'Apresentar'}
          </button>
        )}
        {!presenting && (
          <>
            <button
              className="fn-topbar-btn"
              onClick={openMenu}
              title="Mais opções"
              disabled={!record}
            >
              <MoreHorizontal size={18} />
            </button>
            <AppTools />
          </>
        )}
      </header>
      <div className="fn-editor-canvas">
        {ready && record ? (
          <FunnelEditor
            key={record.id}
            text={record.content}
            host={host}
            prefs={prefs}
            readOnly={presenting || funnelAccess(record) === 'view'}
            onReady={onReady}
          />
        ) : (
          <LoadingBlock variant="canvas" label="Carregando funil" />
        )}
      </div>
      {publishing && record && (
        <PublishDialog
          funnel={record}
          onClose={() => setPublishing(false)}
          onSaved={(next) => {
            setRecord(next)
            setName(next.name)
          }}
        />
      )}
      {presenting && <PresentationLaser onExit={stopPresent} />}
      <FloatingMenu menu={menu} onClose={() => setMenu(null)} />
    </div>
  )
}
