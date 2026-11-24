import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface TemplateOption {
  id: string
  label: string
}

interface PromptOpts {
  title: string
  value?: string
  cta: string
  label?: string
}

interface ConfirmOpts {
  title: string
  message: string
  cta: string
}

interface NewFunnelOpts {
  templates: TemplateOption[]
  templateId?: string
  defaultName?: string
}

interface PickTemplateOpts {
  templates: TemplateOption[]
  templateId?: string
}

interface DialogApi {
  prompt(opts: PromptOpts): Promise<string | null>
  confirm(opts: ConfirmOpts): Promise<boolean>
  newFunnel(opts: NewFunnelOpts): Promise<{ name: string; templateId: string } | null>
  pickTemplate(opts: PickTemplateOpts): Promise<string | null>
}

const Ctx = createContext<DialogApi | null>(null)

export function useDialogs(): DialogApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDialogs must be used within DialogProvider')
  return ctx
}

type State =
  | { kind: 'prompt'; opts: PromptOpts }
  | { kind: 'confirm'; opts: ConfirmOpts }
  | { kind: 'new'; opts: NewFunnelOpts }
  | { kind: 'pickTemplate'; opts: PickTemplateOpts }
  | null

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(null)
  const resolver = useRef<((v: unknown) => void) | null>(null)

  const open = useCallback(<T,>(s: State, empty: T) => {
    resolver.current?.(empty)
    return new Promise<T>((resolve) => {
      resolver.current = (v) => resolve(v as T)
      setState(s)
    })
  }, [])

  const finish = useCallback((value: unknown) => {
    const r = resolver.current
    resolver.current = null
    setState(null)
    r?.(value)
  }, [])

  const api = useMemo<DialogApi>(
    () => ({
      prompt: (opts) => open({ kind: 'prompt', opts }, null),
      confirm: (opts) => open({ kind: 'confirm', opts }, false),
      newFunnel: (opts) => open({ kind: 'new', opts }, null),
      pickTemplate: (opts) => open({ kind: 'pickTemplate', opts }, null),
    }),
    [open],
  )

  return (
    <Ctx.Provider value={api}>
      {children}
      {state?.kind === 'prompt' && <PromptDialog opts={state.opts} onDone={(v) => finish(v)} />}
      {state?.kind === 'confirm' && (
        <AlertDialog open onOpenChange={(o) => !o && finish(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{state.opts.title}</AlertDialogTitle>
              <AlertDialogDescription>{state.opts.message}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => finish(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => finish(true)}
              >
                {state.opts.cta}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {state?.kind === 'new' && <NewFunnelDialog opts={state.opts} onDone={(v) => finish(v)} />}
      {state?.kind === 'pickTemplate' && (
        <PickTemplateDialog opts={state.opts} onDone={(v) => finish(v)} />
      )}
    </Ctx.Provider>
  )
}

function PromptDialog({ opts, onDone }: { opts: PromptOpts; onDone: (v: string | null) => void }) {
  const [value, setValue] = useState(opts.value ?? '')
  const submit = () => {
    const v = value.trim()
    onDone(v || null)
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onDone(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{opts.title}</DialogTitle>
          <DialogDescription className="sr-only">{opts.title}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {opts.label && <Label htmlFor="prompt-input">{opts.label}</Label>}
          <Input
            id="prompt-input"
            autoFocus
            value={value}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onDone(null)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!value.trim()}>
            {opts.cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PickTemplateDialog({
  opts,
  onDone,
}: {
  opts: PickTemplateOpts
  onDone: (v: string | null) => void
}) {
  const [templateId, setTemplateId] = useState(opts.templateId ?? opts.templates[0]?.id ?? '')
  const submit = () => onDone(templateId || null)
  return (
    <Dialog open onOpenChange={(o) => !o && onDone(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolher template</DialogTitle>
          <DialogDescription>
            Selecione um modelo para preencher este funil. Você pode editar tudo depois.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="pick-template">Modelo</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger id="pick-template">
              <SelectValue placeholder="Selecione um modelo" />
            </SelectTrigger>
            <SelectContent>
              {opts.templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onDone(null)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!templateId}>
            Aplicar template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NewFunnelDialog({
  opts,
  onDone,
}: {
  opts: NewFunnelOpts
  onDone: (v: { name: string; templateId: string } | null) => void
}) {
  const [name, setName] = useState(opts.defaultName ?? 'Novo funil')
  const [templateId, setTemplateId] = useState(opts.templateId ?? 'vazio')
  const submit = () => onDone({ name: name.trim() || 'Funil sem título', templateId })
  return (
    <Dialog open onOpenChange={(o) => !o && onDone(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo funil</DialogTitle>
          <DialogDescription>Dê um nome e escolha por onde começar.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-funnel-name">Nome</Label>
            <Input
              id="new-funnel-name"
              autoFocus
              value={name}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submit()
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label>Começar com</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vazio">Em branco</SelectItem>
                {opts.templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    Modelo: {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onDone(null)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
