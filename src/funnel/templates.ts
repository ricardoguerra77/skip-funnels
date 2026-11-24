// Modelos prontos para começar um funil.
import { DEFAULT_SIZE, serialize } from './doc'
import { getItem } from './catalog'
import type { BaseData, FileEdge, FileNode, FunnelFile, NodeKind } from './types'

class Builder {
  nodes: FileNode[] = []
  edges: FileEdge[] = []
  private n = 0

  add(ref: string, x: number, y: number, data: Partial<BaseData> = {}): string {
    const item = getItem(ref)
    if (!item) throw new Error(`modelo: item desconhecido ${ref}`)
    const id = `t${++this.n}`
    const base: BaseData =
      item.kind === 'page'
        ? {
            ref,
            label: item.label,
            button: item.page!.button,
            currency: 'BRL',
            ...(item.page!.billing ? { billing: 'unica' } : {}),
            ...(item.page!.format ? { format: 'vsl' } : {}),
          }
        : item.kind === 'orderbump'
          ? { ref, label: 'Order Bump', showPrice: true, currency: 'BRL' }
          : { ref, label: item.label }
    this.nodes.push({ id, type: item.kind as NodeKind, x, y, data: { ...base, ...data } })
    return id
  }

  link(source: string, target: string, sourceHandle = 'r', targetHandle = 'l'): void {
    this.edges.push({
      id: `te${this.edges.length + 1}`,
      source,
      target,
      sourceHandle,
      targetHandle,
    })
  }

  /** Seção que envolve os nós informados, com folga. */
  section(label: string, color: string, ids: string[], pad = 40): void {
    const members = this.nodes.filter((n) => ids.includes(n.id))
    const x0 = Math.min(...members.map((n) => n.x)) - pad
    const y0 = Math.min(...members.map((n) => n.y)) - pad - 30
    const x1 = Math.max(...members.map((n) => n.x + DEFAULT_SIZE[n.type].w)) + pad
    const y1 = Math.max(...members.map((n) => n.y + DEFAULT_SIZE[n.type].h)) + pad
    this.nodes.unshift({
      id: `s${this.nodes.length + 1}`,
      type: 'section',
      x: x0,
      y: y0,
      w: x1 - x0,
      h: y1 - y0,
      data: { label, color },
    })
  }

  file(): FunnelFile {
    return { type: 'funil', version: 1, nodes: this.nodes, edges: this.edges }
  }
}

export function webinarTemplate(): FunnelFile {
  const b = new Builder()
  // captação
  const meta = b.add('traffic:meta-ads', 0, 0, { label: 'Meta Ads: Anúncio do Webinar' })
  const google = b.add('traffic:google-ads', 0, 150, { label: 'Google Ads: Pesquisa de Intenção' })
  const remk = b.add('events:remarketing', 0, 300, {
    label: 'Remarketing: Visitou e Não Se Inscreveu',
  })
  const pixel = b.add('traffic:pixel-meta', -180, 300, {
    label: 'Pixel Meta: Remarketing de Visitantes',
  })
  const captura = b.add('pages:captura', 220, 40, {
    label: 'Página de Captura do Webinar',
    button: 'GARANTIR MINHA VAGA',
  })
  b.link(meta, captura)
  b.link(google, captura)
  b.link(remk, captura)
  b.link(pixel, remk)

  // aquecimento
  const obrigado = b.add('pages:obrigado', 560, -60, {
    label: 'Obrigado + Countdown pro Webinar',
    button: 'ENTRAR NO GRUPO VIP',
    buttonColor: '#16a34a',
  })
  const lead = b.add('events:lead', 580, 300, { label: 'Lead Inscrito no Webinar' })
  const tag = b.add('events:tag', 760, 300, { label: 'Tag: Inscrito-Webinar' })
  const seq = b.add('messages:sequencia-emails', 840, -40, {
    label: 'Sequência de Aquecimento (E-mails)',
  })
  const grupo = b.add('events:grupos-whatsapp', 840, 110, {
    label: 'Grupo WhatsApp VIP do Webinar',
  })
  const d1 = b.add('messages:email', 1000, -40, { label: 'E-mail D-1: Falta 1 Dia' })
  const esperar = b.add('events:esperar', 1160, -40, { label: 'Esperar até o Dia do Webinar' })
  b.link(captura, obrigado)
  b.link(captura, lead)
  b.link(lead, tag)
  b.link(obrigado, seq)
  b.link(obrigado, grupo)
  b.link(seq, d1)
  b.link(d1, esperar)

  // evento ao vivo
  const noar = b.add('messages:whatsapp-grupo', 1360, 110, {
    label: 'WhatsApp no Grupo: Estamos no Ar!',
  })
  const webinar = b.add('pages:webinar', 1540, -40, {
    label: 'Webinar Ao Vivo (Pitch)',
    button: 'ASSISTIR AGORA',
  })
  const compareceu = b.add('events:se-ou', 1820, 60, { label: 'Compareceu ao Webinar Ao Vivo?' })
  const tagSim = b.add('events:tag', 2000, 200, { label: 'Tag: Compareceu-AoVivo' })
  const tagNao = b.add('events:tag', 2000, -60, { label: 'Tag: No-Show-Webinar' })
  b.link(esperar, noar)
  b.link(grupo, noar)
  b.link(noar, webinar)
  b.link(webinar, compareceu)
  b.link(compareceu, tagSim, 'yes')
  b.link(compareceu, tagNao, 'no')

  // oferta
  const espReplay = b.add('events:esperar', 2220, -60, { label: 'Esperar até Replay Disponível' })
  const replay = b.add('pages:replay', 2400, -260, {
    label: 'Replay com Countdown (48h)',
    button: 'VER REPLAY E COMPRAR',
  })
  const checkout = b.add('pages:checkout', 2220, 160, {
    label: 'Checkout da Oferta',
    button: 'QUERO ENTRAR AGORA',
    showPrice: true,
    price: 1997,
  })
  const carrinho = b.add('events:carrinho-abandonado', 2480, 200, {
    label: 'Carrinho Abandonado 30min',
  })
  const bump = b.add('events:order-bump', 2460, 360, {
    label: 'Order Bump: Templates Prontos',
    price: 97,
  })
  const comprou = b.add('events:se-ou', 2720, 120, { label: 'Comprou na Oferta?' })
  b.link(tagNao, espReplay)
  b.link(espReplay, replay)
  b.link(tagSim, checkout)
  b.link(replay, comprou)
  b.link(checkout, carrinho)
  b.link(checkout, bump)
  b.link(carrinho, comprou)
  b.link(bump, comprou)

  // pós-venda
  const compra = b.add('events:compra', 2920, 20, { label: 'Compra Aprovada' })
  const membros = b.add('pages:membros', 3100, -70, { label: 'Área de Membros' })
  const recup = b.add('events:recuperacao', 2920, 260, {
    label: 'Sequência de Recuperação (Não-Compradores)',
  })
  const rec1 = b.add('messages:email', 3100, 260, {
    label: 'E-mail Rec 1: Replay + FAQ de Objeções',
  })
  b.link(comprou, compra, 'yes')
  b.link(compra, membros)
  b.link(comprou, recup, 'no')
  b.link(recup, rec1)
  b.link(rec1, checkout, 'b', 'b')

  b.section('Captação', '#3b82f6', [meta, google, remk, pixel, captura])
  b.section('Aquecimento', '#f59e0b', [obrigado, lead, tag, seq, grupo, d1, esperar])
  b.section('Evento ao vivo', '#d946ef', [noar, webinar, compareceu, tagSim, tagNao])
  b.section('Oferta', '#22c55e', [espReplay, replay, checkout, carrinho, bump, comprou])
  b.section('Pós-venda', '#64748b', [compra, membros, recup, rec1])
  return b.file()
}

export const TEMPLATES = [
  { id: 'webinar', label: 'Funil de Webinar', json: () => serialize(webinarTemplate()) },
]
