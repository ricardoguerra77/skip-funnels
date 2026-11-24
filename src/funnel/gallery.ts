// Galeria de funis: cartões com miniatura, busca e ações. DOM puro; a página
// só fornece os dados e as ações. Modelos aparecem numa seção própria, acima.
import { fileStats, formatMoney, parseFile } from './doc'
import { funnelThumbnail } from './thumb'

export interface GalleryItem {
  path: string // id do registro (ou "builtin:…" para modelo pronto)
  name: string
  mtime: number
  text: string | null // conteúdo do arquivo (null = não deu para ler)
  outside: boolean // fora da pasta de funis
  kind?: 'funnel' | 'template' | 'builtin'
  shared?: boolean
  folderId?: string
  badge?: string
}

export interface GalleryActions {
  open(path: string, newTab: boolean): void
  menu(e: MouseEvent, path: string): void
  create(folderId?: string): void
  createFolder?(): void
  folderMenu?(e: MouseEvent, folderId: string): void
  /** Clique num modelo: novo funil a partir dele. */
  useTemplate?(path: string, folderId?: string): void
  moveAllInside?(): void
  /** Lembra quais seções ficaram recolhidas. */
  loadCollapsed?(): Record<string, boolean> | null
  saveCollapsed?(state: Record<string, boolean>): void
}

type SectionKey = 'templates' | 'funnels' | 'shared'

/** Conteúdo que desliza ao abrir/fechar (grid 1fr ↔ 0fr no CSS). */
function collapsible(...children: HTMLElement[]): HTMLElement {
  const outer = el('div', 'fn-gal-collapse')
  const inner = el('div', 'fn-gal-collapse-inner')
  inner.append(...children)
  outer.append(inner)
  return outer
}

/** Cabeçalho clicável de seção: setinha (aberto/fechado) + título + contagem. */
function sectionHead(title: string): { head: HTMLElement; count: HTMLElement } {
  const head = el('button', 'fn-gal-section-head is-toggle')
  head.type = 'button'
  const svgNs = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNs, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('class', 'fn-gal-chevron')
  const path = document.createElementNS(svgNs, 'path')
  path.setAttribute('d', 'm6 9 6 6 6-6')
  svg.append(path)
  const count = el('span', 'fn-gal-section-count')
  head.append(svg, el('h3', '', title), count)
  return { head, count }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text !== undefined) e.textContent = text
  return e
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
const isTemplate = (i: GalleryItem) => i.kind === 'template' || i.kind === 'builtin'

/** Mesmo traço dos ícones do sistema (Lucide), na cor de destaque. */
function folderIcon(): SVGElement {
  const svgNs = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNs, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('class', 'fn-gal-folder-icon')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '1.75')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS(svgNs, 'path')
  path.setAttribute(
    'd',
    'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
  )
  svg.append(path)
  return svg
}

function folderMenuButton(onClick: (event: MouseEvent) => void): HTMLButtonElement {
  const more = el('button', 'fn-gal-folder-menu', '\u22ef')
  more.type = 'button'
  more.title = 'Opções da pasta'
  more.addEventListener('click', (event) => {
    event.stopPropagation()
    onClick(event)
  })
  return more
}

export function relativeDate(ts: number, now = Date.now()): string {
  const d = new Date(ts)
  const today = new Date(now)
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (ts >= startToday) return `hoje, ${hm}`
  if (ts >= startToday - 86400000) return `ontem, ${hm}`
  const sameYear = d.getFullYear() === today.getFullYear()
  return d.toLocaleDateString(
    'pt-BR',
    sameYear
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' },
  )
}

export interface GalleryFolder {
  id: string
  name: string
}

export class Gallery {
  private items: GalleryItem[] = []
  private query = ''
  private grid: HTMLElement
  private tplWrap: HTMLElement
  private tplGrid: HTMLElement
  private tplHead: HTMLElement
  private tplCount: HTMLElement
  private funnelsWrap: HTMLElement
  private funnelsHead: HTMLElement
  private funnelsCount: HTMLElement
  private sharedWrap: HTMLElement
  private sharedHead: HTMLElement
  private sharedCount: HTMLElement
  private sharedGrid: HTMLElement
  private folders: GalleryFolder[] = []
  private foldersHost!: HTMLElement
  private openFolderId: string | null = null
  private collapsed: Record<string, boolean>
  private entered = false
  private loading = true
  private empty: HTMLElement
  private outsideBar: HTMLElement
  private thumbs = new Map<string, { text: string | null; html: string; meta: string }>()
  /** Área à direita do cabeçalho, para a página encaixar controles extras. */
  readonly extra: HTMLElement

  constructor(
    private root: HTMLElement,
    private actions: GalleryActions,
    private folderName: string,
  ) {
    root.classList.add('fn-gallery')
    root.replaceChildren()

    // sem logo própria: a marca já vive no header global (AppHeader) da página
    const head = el('div', 'fn-gal-head')
    const tools = el('div', 'fn-gal-tools')
    const search = el('input', 'fn-gal-search')
    search.type = 'search'
    search.placeholder = 'Buscar funil ou modelo...'
    search.addEventListener('input', () => {
      this.query = search.value
      this.draw()
    })
    const create = el('button', 'fn-gal-btn is-primary', '+ Novo funil')
    create.addEventListener('click', () => this.actions.create(this.openFolderId ?? undefined))
    const newFolder = el('button', 'fn-gal-btn', 'Nova pasta')
    newFolder.addEventListener('click', () => this.actions.createFolder?.())
    this.extra = el('div', 'fn-gal-extra')
    tools.append(search, create, newFolder, this.extra)
    head.append(tools)
    root.append(head)

    this.outsideBar = el('div', 'fn-gal-outside is-hidden')
    root.append(this.outsideBar)

    this.collapsed = { ...(this.actions.loadCollapsed?.() ?? {}) }

    this.tplWrap = el('div', 'fn-gal-section')
    const t = sectionHead('Modelos')
    this.tplHead = t.head
    this.tplCount = t.count
    this.tplGrid = el('div', 'fn-gal-grid is-templates')
    this.tplWrap.append(this.tplHead, collapsible(this.tplGrid))
    root.append(this.tplWrap)

    this.funnelsWrap = el('div', 'fn-gal-section')
    const f = sectionHead('Seus funis')
    this.funnelsHead = f.head
    this.funnelsCount = f.count
    this.grid = el('div', 'fn-gal-grid')
    this.empty = el('div', 'fn-gal-empty')
    this.foldersHost = el('div', 'fn-gal-folders is-hidden')
    this.funnelsWrap.append(this.funnelsHead, collapsible(this.foldersHost, this.grid, this.empty))
    root.append(this.funnelsWrap)

    this.tplHead.addEventListener('click', () => this.toggle('templates'))
    this.funnelsHead.addEventListener('click', () => this.toggle('funnels'))
    this.sharedWrap = el('div', 'fn-gal-section')
    const s = sectionHead('Compartilhados comigo')
    this.sharedHead = s.head
    this.sharedCount = s.count
    this.sharedGrid = el('div', 'fn-gal-grid')
    this.sharedWrap.append(this.sharedHead, collapsible(this.sharedGrid))
    root.append(this.sharedWrap)
    this.sharedHead.addEventListener('click', () => this.toggle('shared'))
    this.paintLoading()
  }

  private toggle(key: SectionKey): void {
    this.collapsed[key] = !this.collapsed[key]
    this.actions.saveCollapsed?.({ ...this.collapsed })
    this.applyCollapse() // não redesenha os cartões: só desliza
  }

  /** Aplica aberto/fechado (setinha, aria) sem recriar cartões. */
  private applyCollapse(): void {
    const sets: [SectionKey, HTMLElement, HTMLElement, string][] = [
      ['templates', this.tplWrap, this.tplHead, 'os modelos'],
      ['funnels', this.funnelsWrap, this.funnelsHead, 'os funis'],
      ['shared', this.sharedWrap, this.sharedHead, 'os compartilhados'],
    ]
    for (const [key, wrap, head, what] of sets) {
      const closed = this.isCollapsed(key)
      wrap.classList.toggle('is-collapsed', closed)
      head.setAttribute('aria-expanded', String(!closed))
      head.title = closed ? `Mostrar ${what}` : `Esconder ${what}`
    }
  }

  /** Recolhida só quando não há busca: buscando, os resultados sempre aparecem. */
  private isCollapsed(key: SectionKey): boolean {
    return !!this.collapsed[key] && !this.query.trim()
  }

  setFolderName(name: string): void {
    this.folderName = name
    this.draw()
  }

  setItems(items: GalleryItem[]): void {
    this.loading = false
    this.items = [...items].sort((a, b) => b.mtime - a.mtime)
    this.draw()
  }

  /** Miniatura e resumo em cache: só recalcula se o conteúdo do arquivo mudou. */
  private render(item: GalleryItem): { html: string; meta: string } {
    const cached = this.thumbs.get(item.path)
    if (cached && cached.text === item.text) return cached
    let html = ''
    let meta = ''
    try {
      if (item.text === null) throw new Error('ilegível')
      const file = parseFile(item.text)
      html = funnelThumbnail(file)
      const st = fileStats(file)
      meta = `${st.steps} ${st.steps === 1 ? 'etapa' : 'etapas'}`
      if (st.totals.length)
        meta += ` · ${st.totals.map((t) => formatMoney(t.value, t.currency, true)).join(' · ')}`
    } catch {
      html = `<div class="fn-gal-broken">não deu para ler este funil</div>`
      meta = 'arquivo inválido'
    }
    const out = { text: item.text, html, meta }
    this.thumbs.set(item.path, out)
    return out
  }

  private card(item: GalleryItem, index = 0): HTMLElement {
    const tpl = isTemplate(item)
    const { html, meta } = this.render(item)
    const card = el('div', `fn-gal-card${tpl ? ' is-template' : ''}`)
    card.style.setProperty('--i', String(Math.min(index, 12))) // atraso da cascata de entrada
    card.tabIndex = 0
    card.title = tpl ? `${item.name} — clique para criar um funil a partir deste modelo` : item.name
    const thumb = el('div', 'fn-gal-thumb')
    thumb.innerHTML = html // SVG gerado por funnelThumbnail (cores sanitizadas, sem texto do arquivo)
    card.append(thumb)

    const info = el('div', 'fn-gal-info')
    const row = el('div', 'fn-gal-row')
    row.append(el('div', 'fn-gal-name', item.name))
    const more = el('button', 'fn-gal-more', '⋯')
    more.title = 'Opções'
    more.addEventListener('click', (e) => {
      e.stopPropagation()
      this.actions.menu(e, item.path)
    })
    row.append(more)
    info.append(row)
    const sub = el('div', 'fn-gal-meta')
    sub.append(
      el('span', '', meta),
      el('span', 'fn-gal-dot', '·'),
      el('span', '', item.kind === 'builtin' ? 'modelo pronto' : relativeDate(item.mtime)),
    )
    if (tpl) sub.append(el('span', 'fn-gal-badge is-template', 'modelo'))
    else if (item.outside) sub.append(el('span', 'fn-gal-badge', 'fora da pasta'))
    if (item.badge) sub.append(el('span', 'fn-gal-badge', item.badge))
    info.append(sub)
    card.append(info)

    const activate = (newTab: boolean) => {
      if (tpl && this.actions.useTemplate) {
        this.actions.useTemplate(item.path, this.openFolderId ?? undefined)
      } else this.actions.open(item.path, newTab)
    }
    card.addEventListener('click', (e) => activate(e.ctrlKey || e.metaKey))
    card.addEventListener('auxclick', (e) => {
      if (e.button === 1 && !tpl) this.actions.open(item.path, true)
    })
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      this.actions.menu(e, item.path)
    })
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        activate(false)
      }
    })
    return card
  }

  private paintLoading(): void {
    this.tplWrap.classList.add('is-hidden')
    this.outsideBar.classList.add('is-hidden')
    this.sharedWrap.classList.add('is-hidden')
    this.funnelsWrap.classList.remove('is-hidden')
    this.funnelsCount.textContent = ''
    this.foldersHost.className = 'fn-gal-folders is-hidden'
    this.foldersHost.replaceChildren()
    const heading = this.funnelsHead.querySelector('h3')
    if (heading) heading.textContent = 'Seus funis'
    this.empty.classList.add('is-hidden')
    this.grid.replaceChildren(
      ...Array.from({ length: 6 }, () => {
        const card = el('div', 'fn-gal-card is-skel')
        card.setAttribute('aria-hidden', 'true')
        const info = el('div', 'fn-gal-info')
        info.append(el('div', 'fn-skel fn-skel-line'), el('div', 'fn-skel fn-skel-line is-short'))
        card.append(el('div', 'fn-gal-thumb fn-skel'), info)
        return card
      }),
    )
  }

  setFolders(folders: GalleryFolder[]): void {
    this.folders = [...folders].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    if (!this.loading) this.draw()
  }

  private funnelsIn(funnels: GalleryItem[], folderId: string): GalleryItem[] {
    return funnels.filter((item) => item.folderId === folderId)
  }

  private paintFolders(
    funnels: GalleryItem[],
    match: (item: GalleryItem) => boolean,
    q: string,
  ): void {
    const open = this.folders.find((folder) => folder.id === this.openFolderId) ?? null
    if (this.openFolderId && !open) this.openFolderId = null
    this.foldersHost.replaceChildren()
    const heading = this.funnelsHead.querySelector('h3')
    if (heading) heading.textContent = open ? open.name : 'Seus funis'

    if (open) {
      this.foldersHost.className = 'fn-gal-folder-bar'
      const back = el('button', 'fn-gal-folder-back')
      back.type = 'button'
      back.append(el('span', 'fn-gal-folder-back-mark', '\u2190'), el('span', '', 'Seus funis'))
      back.addEventListener('click', () => {
        this.openFolderId = null
        this.draw()
      })
      this.foldersHost.append(
        back,
        folderMenuButton((event) => this.actions.folderMenu?.(event, open.id)),
      )
      return
    }

    this.foldersHost.className = 'fn-gal-folders is-hidden'
  }

  private folderCards(
    funnels: GalleryItem[],
    match: (item: GalleryItem) => boolean,
    q: string,
  ): HTMLElement[] {
    return this.folders
      .filter((folder) => {
        if (!q) return true
        if (norm(folder.name).includes(q)) return true
        return this.funnelsIn(funnels, folder.id).some(match)
      })
      .map((folder, index) => {
        const count = this.funnelsIn(funnels, folder.id).length
        const card = el('div', 'fn-gal-card')
        card.style.setProperty('--i', String(Math.min(index, 12)))
        card.tabIndex = 0
        card.title = folder.name
        const thumb = el('div', 'fn-gal-thumb')
        thumb.append(folderIcon())
        card.append(thumb)
        const info = el('div', 'fn-gal-info')
        const row = el('div', 'fn-gal-row')
        row.append(el('div', 'fn-gal-name', folder.name))
        const more = el('button', 'fn-gal-more', '\u22ef')
        more.title = 'Opções da pasta'
        more.addEventListener('click', (event) => {
          event.stopPropagation()
          this.actions.folderMenu?.(event, folder.id)
        })
        row.append(more)
        info.append(row)
        info.append(
          el(
            'div',
            'fn-gal-meta',
            count === 0 ? 'vazia' : count === 1 ? '1 funil' : `${count} funis`,
          ),
        )
        card.append(info)
        const open = () => {
          this.openFolderId = folder.id
          this.draw()
        }
        card.addEventListener('click', open)
        card.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            open()
          }
        })
        return card
      })
  }

  private draw(): void {
    if (this.loading) {
      this.paintLoading()
      return
    }
    const q = norm(this.query.trim())
    const match = (i: GalleryItem) => !q || norm(`${i.name} ${i.path}`).includes(q)
    const templates = this.items
      .filter(isTemplate)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    const shared = this.items.filter((i) => i.shared)
    const funnels = this.items.filter((i) => !isTemplate(i) && !i.shared)
    const tplShown = templates.filter(match)
    const list = funnels.filter(match)
    const total = funnels.length

    const outside = funnels.filter((i) => i.outside).length
    this.outsideBar.replaceChildren()
    this.outsideBar.classList.toggle('is-hidden', !outside || !this.actions.moveAllInside)
    if (outside && this.actions.moveAllInside) {
      this.outsideBar.append(
        el(
          'span',
          '',
          `${outside} ${outside === 1 ? 'funil está' : 'funis estão'} fora da pasta “${this.folderName}”.`,
        ),
      )
      const mv = el('button', 'fn-gal-btn', `Mover para “${this.folderName}”`)
      mv.addEventListener('click', () => this.actions.moveAllInside?.())
      this.outsideBar.append(mv)
    }

    // primeira abertura: cartões entram em cascata
    if (!this.entered && this.items.length) {
      this.entered = true
      this.root.classList.add('is-entering')
      window.setTimeout(() => this.root.classList.remove('is-entering'), 1100)
    }

    // os cartões ficam sempre no DOM: fechar a seção só desliza a altura (CSS)
    this.tplCount.textContent = String(tplShown.length)
    this.tplWrap.classList.toggle('is-hidden', tplShown.length === 0)
    this.tplGrid.replaceChildren(...tplShown.map((t, i) => this.card(t, i)))
    const sharedShown = shared.filter(match)
    this.sharedCount.textContent = String(sharedShown.length)
    this.sharedWrap.classList.toggle('is-hidden', sharedShown.length === 0)
    this.sharedGrid.replaceChildren(...sharedShown.map((it, i) => this.card(it, i)))
    const knownFolders = new Set(this.folders.map((folder) => folder.id))
    const loose = list.filter((item) => !item.folderId || !knownFolders.has(item.folderId))
    this.paintFolders(funnels, match, q)
    const open = this.folders.find((folder) => folder.id === this.openFolderId) ?? null
    const shown = open ? this.funnelsIn(funnels, open.id).filter(match) : loose
    const foldersInGrid = open ? [] : this.folderCards(funnels, match, q)
    this.funnelsWrap.classList.remove('is-hidden')
    this.funnelsCount.textContent = String(shown.length + foldersInGrid.length)
    this.grid.replaceChildren(
      ...foldersInGrid,
      ...shown.map((it, i) => this.card(it, i + foldersInGrid.length)),
    )
    this.applyCollapse()

    this.empty.replaceChildren()
    this.empty.classList.toggle('is-hidden', shown.length > 0 || foldersInGrid.length > 0)
    if (!shown.length && foldersInGrid.length === 0) {
      if (open && !q) {
        this.empty.append(el('div', 'fn-gal-empty-title', 'Pasta vazia'))
        this.empty.append(el('div', '', 'Os funis criados agora entram nesta pasta.'))
        const b = el('button', 'fn-gal-btn is-primary', 'Criar funil nesta pasta')
        b.addEventListener('click', () => this.actions.create(open.id))
        this.empty.append(b)
      } else if (total || q) {
        this.empty.append(el('div', '', 'Nenhum funil com esse nome.'))
      } else {
        this.empty.append(el('div', 'fn-gal-empty-title', 'Nenhum funil ainda'))
        this.empty.append(el('div', '', 'Comece do zero ou a partir de um dos modelos acima.'))
        const b = el('button', 'fn-gal-btn is-primary', 'Criar o primeiro funil')
        b.addEventListener('click', () => this.actions.create())
        this.empty.append(b)
      }
    }
  }
}
