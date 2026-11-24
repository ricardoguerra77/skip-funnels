import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Copy,
  Download,
  ExternalLink,
  File,
  FolderInput,
  FolderMinus,
  FilePlus,
  LayoutTemplate,
  Pencil,
  TextCursorInput,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { FloatingMenu, type MenuEntry, type MenuState } from '@/components/FloatingMenu'
import { useDialogs } from '@/components/dialogs/DialogProvider'
import { emptyFile, parseFile, serialize } from '@/funnel/doc'
import { Gallery, type GalleryItem } from '@/funnel/gallery'
import '@/funnel/styles.css'
import '@/funnel/theme.css'
import { useRealtime } from '@/hooks/use-realtime'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  BUILTIN_TEMPLATES,
  downloadFunnel,
  pickFunnelFiles,
  templateChoices,
} from '@/lib/funnel-files'
import {
  createFunnel,
  deleteFunnel,
  listFunnels,
  funnelAccess,
  updateFunnel,
  type FunnelRecord,
} from '@/services/funnels'
import pb from '@/lib/pocketbase/client'
import { acceptInvites, listMembers, listMyTeams, syncRoster } from '@/services/teams'
import {
  createFolder,
  deleteFolder,
  listFolders,
  renameFolder,
  type FolderRecord,
} from '@/services/folders'
const COLLAPSED_KEY = 'funis-gallery-collapsed'
export default function Index() {
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const rootRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<Gallery | null>(null)
  const [funnels, setFunnels] = useState<FunnelRecord[] | null>(null)
  const [folders, setFolders] = useState<FolderRecord[] | null>(null)
  const foldersRef = useRef<FolderRecord[]>([])
  foldersRef.current = folders ?? []
  const [menu, setMenu] = useState<MenuState | null>(null)
  const funnelsRef = useRef<FunnelRecord[]>([])
  funnelsRef.current = funnels ?? []
  const load = useCallback(async () => {
    try {
      try {
        await acceptInvites()
        const me = pb.authStore.record?.id ?? ''
        const owned = (await listMyTeams()).find((team) => team.owner === me)
        if (owned) await syncRoster(owned, await listMembers(owned.id))
      } catch {
        /* a galeria abre mesmo se o time falhar */
      }
      setFunnels(await listFunnels())
      try {
        setFolders(await listFolders())
      } catch {
        setFolders([])
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
      setFunnels((f) => f ?? [])
      setFolders((current) => current ?? [])
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])
  useRealtime('funnels', () => void load())
  useRealtime('folders', () => void load())
  // ------------------------------------------------------------ ações
  const createAndOpen = useCallback(
    async (name: string, content: string, folderId?: string) => {
      try {
        const rec = await createFunnel({ name, content })
        if (folderId) await updateFunnel(rec.id, { folder: folderId })
        navigate(`/f/${rec.id}`)
      } catch (err) {
        toast.error(`Não consegui criar o funil: ${getErrorMessage(err)}`)
      }
    },
    [navigate],
  )
  const newFunnelDialog = useCallback(
    async (templateId?: string, folderId?: string) => {
      const choices = templateChoices(funnelsRef.current)
      const pre = choices.find((c) => c.id === templateId)
      const res = await dialogs.newFunnel({
        templates: choices.map((c) => ({ id: c.id, label: c.name })),
        templateId: pre?.id,
        defaultName: pre?.name ?? 'Novo funil',
      })
      if (!res) return
      const choice = choices.find((c) => c.id === res.templateId)
      await createAndOpen(res.name, choice ? choice.content() : serialize(emptyFile()), folderId)
    },
    [dialogs, createAndOpen],
  )
  const rename = useCallback(
    async (f: FunnelRecord) => {
      const name = await dialogs.prompt({
        title: f.is_template ? 'Renomear modelo' : 'Renomear funil',
        value: f.name,
        cta: 'Renomear',
      })
      if (!name || name === f.name) return
      try {
        await updateFunnel(f.id, { name })
      } catch (err) {
        toast.error(getErrorMessage(err))
      }
    },
    [dialogs],
  )
  const duplicate = useCallback(async (f: FunnelRecord) => {
    try {
      await createFunnel({
        name: `${f.name} (cópia)`,
        content: f.content,
        is_template: f.is_template,
      })
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [])
  const saveAsTemplate = useCallback(
    async (f: FunnelRecord) => {
      const name = await dialogs.prompt({
        title: 'Transformar em modelo',
        value: f.name,
        cta: 'Criar modelo',
      })
      if (!name) return
      try {
        await createFunnel({ name, content: f.content, is_template: true })
        toast.success(`Modelo “${name}” criado. Ele aparece em “Novo funil” e na seção Modelos.`)
      } catch (err) {
        toast.error(`Não consegui criar o modelo: ${getErrorMessage(err)}`)
      }
    },
    [dialogs],
  )
  const remove = useCallback(
    async (f: FunnelRecord) => {
      const ok = await dialogs.confirm(
        f.is_template
          ? {
              title: 'Excluir modelo',
              message: `O modelo “${f.name}” será excluído. Funis criados a partir dele não mudam.`,
              cta: 'Excluir',
            }
          : {
              title: 'Excluir funil',
              message: `“${f.name}” será excluído permanentemente.`,
              cta: 'Excluir',
            },
      )
      if (!ok) return
      try {
        await deleteFunnel(f.id)
      } catch (err) {
        toast.error(getErrorMessage(err))
      }
    },
    [dialogs],
  )
  /** Modelo pronto vira antes uma cópia editável. */
  const editTemplate = useCallback(
    async (id: string) => {
      const builtin = BUILTIN_TEMPLATES.find((b) => b.id === id)
      if (!builtin) {
        navigate(`/f/${id}`)
        return
      }
      try {
        const rec = await createFunnel({
          name: builtin.name,
          content: builtin.content(),
          is_template: true,
        })
        navigate(`/f/${rec.id}`)
      } catch (err) {
        toast.error(getErrorMessage(err))
      }
    },
    [navigate],
  )
  const importFiles = useCallback(async () => {
    const files = await pickFunnelFiles()
    let ok = 0
    for (const f of files) {
      try {
        const content = serialize(parseFile(f.text))
        await createFunnel({ name: f.name || 'Funil importado', content })
        ok++
      } catch {
        toast.error(`“${f.name}” não é um arquivo .funil válido.`)
      }
    }
    if (ok) toast.success(`${ok} ${ok === 1 ? 'funil importado' : 'funis importados'}.`)
  }, [])
  const moveTo = useCallback(async (funnel: FunnelRecord, folder: string) => {
    try {
      await updateFunnel(funnel.id, { folder })
      toast.success(folder ? 'Funil movido para a pasta.' : 'Funil tirado da pasta.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [])

  const folderMoves = useCallback(
    (funnel: FunnelRecord): MenuEntry[] => {
      const moves: MenuEntry[] = foldersRef.current
        .filter((folder) => folder.id !== funnel.folder)
        .map((folder) => ({
          label: `Mover para ${folder.name}`,
          icon: <FolderInput size={15} />,
          onClick: () => void moveTo(funnel, folder.id),
        }))
      if (funnel.folder) {
        moves.push({
          label: 'Tirar da pasta',
          icon: <FolderMinus size={15} />,
          onClick: () => void moveTo(funnel, ''),
        })
      }
      return moves.length ? [...moves, 'sep'] : []
    },
    [moveTo],
  )

  const askNewFolder = useCallback(async () => {
    const name = await dialogs.prompt({ title: 'Nova pasta', cta: 'Criar', label: 'Nome' })
    const trimmed = name?.trim() ?? ''
    if (!trimmed) return
    try {
      await createFolder(trimmed)
      toast.success('Pasta criada.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [dialogs])

  const openFolderMenu = useCallback(
    async (event: MouseEvent, folderId: string) => {
      const folder = foldersRef.current.find((item) => item.id === folderId)
      if (!folder) return
      setMenu({
        x: event.clientX,
        y: event.clientY,
        items: [
          {
            label: 'Renomear…',
            icon: <Pencil size={15} />,
            onClick: () =>
              void (async () => {
                const name = await dialogs.prompt({
                  title: 'Renomear pasta',
                  value: folder.name,
                  cta: 'Salvar',
                  label: 'Nome',
                })
                const trimmed = name?.trim() ?? ''
                if (!trimmed || trimmed === folder.name) return
                try {
                  await renameFolder(folder.id, trimmed)
                } catch (err) {
                  toast.error(getErrorMessage(err))
                }
              })(),
          },
          {
            label: 'Excluir pasta…',
            icon: <Trash2 size={15} />,
            danger: true,
            onClick: () =>
              void (async () => {
                const ok = await dialogs.confirm({
                  title: 'Excluir pasta',
                  message: 'Os funis desta pasta voltam para Seus funis.',
                  cta: 'Excluir',
                })
                if (!ok) return
                try {
                  for (const funnel of funnelsRef.current.filter(
                    (item) => item.folder === folder.id,
                  )) {
                    await updateFunnel(funnel.id, { folder: '' })
                  }
                  await deleteFolder(folder.id)
                } catch (err) {
                  toast.error(getErrorMessage(err))
                }
              })(),
          },
        ],
      })
    },
    [dialogs],
  )

  const openCardMenu = useCallback(
    (e: MouseEvent, id: string) => {
      const builtin = BUILTIN_TEMPLATES.find((b) => b.id === id)
      const f = funnelsRef.current.find((x) => x.id === id)
      let items: MenuEntry[]
      if (builtin) {
        items = [
          {
            label: 'Usar modelo (novo funil)',
            icon: <FilePlus size={15} />,
            onClick: () => void newFunnelDialog(id),
          },
          {
            label: 'Editar modelo (cria uma cópia editável)',
            icon: <Pencil size={15} />,
            onClick: () => void editTemplate(id),
          },
          'sep',
          {
            label: 'Exportar .funil',
            icon: <Download size={15} />,
            onClick: () => downloadFunnel(builtin.name, builtin.content()),
          },
        ]
      } else if (f?.is_template && f.owner !== (pb.authStore.record?.id ?? '')) {
        items = [
          {
            label: 'Usar modelo (novo funil)',
            icon: <FilePlus size={15} />,
            onClick: () => void newFunnelDialog(id),
          },
          {
            label: 'Exportar .funil',
            icon: <Download size={15} />,
            onClick: () => downloadFunnel(f.name, f.content),
          },
        ]
      } else if (f && f.owner !== (pb.authStore.record?.id ?? '')) {
        const editable = funnelAccess(f) === 'edit'
        const viewUrl = f.share_token ? `/v/${f.share_token}` : `/f/${id}`
        items = [
          { label: 'Ver', icon: <File size={15} />, onClick: () => navigate(viewUrl) },
          ...(editable
            ? [{ label: 'Editar', icon: <Pencil size={15} />, onClick: () => navigate(`/f/${id}`) }]
            : []),
        ]
      } else if (f?.is_template) {
        items = [
          {
            label: 'Usar modelo (novo funil)',
            icon: <FilePlus size={15} />,
            onClick: () => void newFunnelDialog(id),
          },
          {
            label: 'Editar modelo',
            icon: <Pencil size={15} />,
            onClick: () => navigate(`/f/${id}`),
          },
          'sep',
          {
            label: 'Renomear…',
            icon: <TextCursorInput size={15} />,
            onClick: () => void rename(f),
          },
          { label: 'Duplicar', icon: <Copy size={15} />, onClick: () => void duplicate(f) },
          {
            label: 'Exportar .funil',
            icon: <Download size={15} />,
            onClick: () => downloadFunnel(f.name, f.content),
          },
          'sep',
          {
            label: 'Excluir modelo…',
            icon: <Trash2 size={15} />,
            danger: true,
            onClick: () => void remove(f),
          },
        ]
      } else if (f) {
        items = [
          { label: 'Abrir', icon: <File size={15} />, onClick: () => navigate(`/f/${id}`) },
          {
            label: 'Abrir em nova aba',
            icon: <ExternalLink size={15} />,
            onClick: () => window.open(`/f/${id}`, '_blank'),
          },
          'sep',
          { label: 'Renomear…', icon: <Pencil size={15} />, onClick: () => void rename(f) },
          { label: 'Duplicar', icon: <Copy size={15} />, onClick: () => void duplicate(f) },
          {
            label: 'Transformar em modelo…',
            icon: <LayoutTemplate size={15} />,
            onClick: () => void saveAsTemplate(f),
          },
          ...folderMoves(f),
          {
            label: 'Exportar .funil',
            icon: <Download size={15} />,
            onClick: () => downloadFunnel(f.name, f.content),
          },
          'sep',
          {
            label: 'Excluir…',
            icon: <Trash2 size={15} />,
            danger: true,
            onClick: () => void remove(f),
          },
        ]
      } else return
      setMenu({ x: e.clientX, y: e.clientY, items })
    },
    [
      navigate,
      newFunnelDialog,
      editTemplate,
      rename,
      duplicate,
      saveAsTemplate,
      remove,
      folderMoves,
    ],
  )
  // a classe Gallery é DOM puro: criada uma vez, chama sempre as ações mais recentes
  const actions = useRef({ newFunnelDialog, openCardMenu, navigate, askNewFolder, openFolderMenu })
  actions.current = { newFunnelDialog, openCardMenu, navigate, askNewFolder, openFolderMenu }
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const g = new Gallery(
      root,
      {
        open: (id, newTab) =>
          (() => {
            const found = funnelsRef.current.find((x) => x.id === id)
            const access = found ? funnelAccess(found) : 'owner'
            const url =
              access === 'view' && found?.share_token ? `/v/${found.share_token}` : `/f/${id}`
            if (newTab) window.open(url, '_blank')
            else actions.current.navigate(url)
          })(),
        create: (folderId) => void actions.current.newFunnelDialog(undefined, folderId),
        createFolder: () => void actions.current.askNewFolder(),
        folderMenu: (event, id) => void actions.current.openFolderMenu(event, id),
        useTemplate: (id, folderId) => void actions.current.newFunnelDialog(id, folderId),
        menu: (e, id) => actions.current.openCardMenu(e, id),
        loadCollapsed: () => {
          try {
            return JSON.parse(localStorage.getItem(COLLAPSED_KEY) || 'null') as Record<
              string,
              boolean
            > | null
          } catch {
            return null
          }
        },
        saveCollapsed: (s) => localStorage.setItem(COLLAPSED_KEY, JSON.stringify(s)),
      },
      '',
    )
    galleryRef.current = g
    return () => {
      galleryRef.current = null
      root.replaceChildren()
    }
  }, [])
  useEffect(() => {
    const g = galleryRef.current
    if (!g || !funnels || !folders) return
    const me = pb.authStore.record?.id ?? ''
    const items: GalleryItem[] = funnels.map((f) => {
      const mine = f.owner === me
      const access = funnelAccess(f, me)
      const badge = mine
        ? f.visibility === 'public'
          ? 'público'
          : f.visibility === 'team'
            ? 'time'
            : undefined
        : access === 'edit'
          ? 'pode editar'
          : 'pode ver'
      return {
        path: f.id,
        name: f.name,
        mtime: Date.parse(f.updated) || 0,
        text: f.content ?? '',
        outside: false,
        kind: f.is_template ? 'template' : 'funnel',
        shared: !mine && !f.is_template,
        folderId: mine && !f.is_template ? f.folder : undefined,
        badge,
      }
    })
    for (const c of templateChoices(funnels).filter((c) => c.builtin)) {
      items.push({
        path: c.id,
        name: c.name,
        mtime: 0,
        text: c.content(),
        outside: false,
        kind: 'builtin',
      })
    }
    g.setFolders(folders)
    g.setItems(items)
  }, [funnels, folders])
  return (
    <div className="fn-gallery-page">
      <div ref={rootRef} />
      <FloatingMenu menu={menu} onClose={() => setMenu(null)} />
    </div>
  )
}
