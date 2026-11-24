import { serialize } from '@/funnel/doc'
import { webinarTemplate } from '@/funnel/templates'
import type { FunnelRecord } from '@/services/funnels'

/** Modelos prontos (somem da lista quando o usuário tem um modelo com o mesmo nome). */
export const BUILTIN_TEMPLATES: { id: string; name: string; content: () => string }[] = [
  { id: 'builtin:webinar', name: 'Funil de Webinar', content: () => serialize(webinarTemplate()) },
]

export interface TemplateChoice {
  id: string
  name: string
  builtin: boolean
  content: () => string
}

export function templateChoices(funnels: FunnelRecord[]): TemplateChoice[] {
  const mine = funnels
    .filter((f) => f.is_template)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    .map<TemplateChoice>((f) => ({
      id: f.id,
      name: f.name,
      builtin: false,
      content: () => f.content,
    }))
  const builtins = BUILTIN_TEMPLATES.filter(
    (b) => !mine.some((m) => m.name === b.name),
  ).map<TemplateChoice>((b) => ({ id: b.id, name: b.name, builtin: true, content: b.content }))
  return [...mine, ...builtins]
}

/** Baixa o funil como arquivo .funil (o mesmo formato do plugin do Obsidian). */
export function downloadFunnel(name: string, content: string) {
  const safe =
    name
      .replace(/[\\/:*?"<>|#^[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || 'Funil'
  const blob = new Blob(
    [content || serialize({ type: 'funil', version: 1, nodes: [], edges: [] })],
    {
      type: 'application/json',
    },
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safe}.funil`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Abre o seletor de arquivos para importar um ou mais .funil. */
export function pickFunnelFiles(): Promise<{ name: string; text: string }[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.funil,application/json'
    input.multiple = true
    input.onchange = async () => {
      const files = Array.from(input.files ?? [])
      const out = await Promise.all(
        files.map(async (f) => ({
          name: f.name.replace(/\.(funil|json)$/i, ''),
          text: await f.text(),
        })),
      )
      resolve(out)
    }
    input.click()
  })
}

/** Seletor de arquivo genérico (para enviar arquivos ao funil). */
export function pickLocalFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.addEventListener('cancel', () => resolve(null))
    input.click()
  })
}
