// Catálogo de elementos da barra lateral.
// Ícones: `lucide` = nome do componente do lucide-react; `brand` = slug do
// Simple Icons (os dados ficam em data/brands.json, gerado por
// scripts/build-brands.mjs); `mono` = sigla, para marcas sem ícone livre.

export type Group = 'traffic' | 'pages' | 'events' | 'messages' | 'integrations' | 'products'

export interface IconSpec {
  lucide?: string
  brand?: string
  mono?: string
}

export type PageVariant =
  | 'generic'
  | 'sales'
  | 'capture'
  | 'thanks'
  | 'download'
  | 'live'
  | 'ytlive'
  | 'meeting'
  | 'webinar'
  | 'replay'
  | 'launch'
  | 'schedule'
  | 'checkout'
  | 'oto'
  | 'survey'
  | 'review'
  | 'blog'
  | 'community'
  | 'members'
  | 'inperson'
  | 'auth'

export interface PageSpec {
  variant: PageVariant
  button: string
  accent: string
  /** Mostra os campos de cobrança (única/mensal/anual). */
  billing?: boolean
  /** Mostra a escolha VSL/TSL. */
  format?: boolean
}

export interface CatalogItem {
  id: string
  group: Group
  label: string
  tags: string[]
  icon: IconSpec
  bg: string
  fg?: string
  kind: 'circle' | 'page' | 'decision' | 'orderbump' | 'product'
  product?: ProductSpec
  page?: PageSpec
  keywords?: string
}

const IG = 'linear-gradient(45deg,#feda75 0%,#fa7e1e 25%,#d62976 50%,#962fbf 75%,#4f5bd5 100%)'
const W = '#ffffff'

type Opt = Partial<Pick<CatalogItem, 'fg' | 'keywords' | 'kind'>>

function item(
  group: Group,
  id: string,
  label: string,
  tags: string[],
  icon: IconSpec,
  bg: string,
  opt: Opt = {},
): CatalogItem {
  return {
    id: `${group}:${id}`,
    group,
    label,
    tags,
    icon,
    bg,
    kind: opt.kind ?? 'circle',
    fg: opt.fg,
    keywords: opt.keywords,
  }
}

// ---------------------------------------------------------------- tráfego
const T = (id: string, label: string, tag: string, icon: IconSpec, bg: string, opt?: Opt) =>
  item('traffic', id, label, [tag], icon, bg, opt)

const traffic: CatalogItem[] = [
  T('meta-ads', 'Meta Ads', 'Meta', { brand: 'meta' }, '#0866FF', {
    keywords: 'anuncio facebook instagram',
  }),
  T('pixel-meta', 'Pixel Meta', 'Meta', { brand: 'meta' }, '#1d4ed8', { keywords: 'remarketing' }),
  T('facebook', 'Facebook', 'Meta', { brand: 'facebook' }, '#0866FF'),
  T('facebook-ads', 'Facebook Ads', 'Meta', { brand: 'facebook' }, '#0866FF', {
    keywords: 'anuncio',
  }),
  T('facebook-page', 'Facebook Page', 'Meta', { brand: 'facebook' }, '#0866FF'),
  T('instagram-base', 'Instagram (Base)', 'Meta', { brand: 'instagram' }, IG, {
    keywords: 'organico seguidores',
  }),
  T('instagram-pago', 'Instagram (Pago)', 'Meta', { brand: 'instagram' }, IG, {
    keywords: 'anuncio ads',
  }),
  T('instagram-perfil', 'Perfil Instagram', 'Meta', { brand: 'instagram' }, IG, {
    keywords: 'bio',
  }),
  T('instagram-post', 'Post Instagram', 'Meta', { brand: 'instagram' }, IG),
  T('instagram-carrossel', 'Carrossel Instagram', 'Meta', { brand: 'instagram' }, IG),
  T('instagram-reels', 'Reels Instagram', 'Meta', { brand: 'instagram' }, IG),
  T('instagram-story', 'Story Instagram', 'Meta', { brand: 'instagram' }, IG, {
    keywords: 'stories',
  }),
  T('instagram-live', 'Live Instagram', 'Meta', { brand: 'instagram' }, IG),
  T('threads', 'Threads', 'Meta', { brand: 'threads' }, '#000000'),
  T('whatsapp', 'WhatsApp', 'Meta', { brand: 'whatsapp' }, '#25D366'),
  T('messenger', 'Messenger', 'Meta', { brand: 'messenger' }, '#0866FF'),

  T('google', 'Google', 'Google', { brand: 'google' }, W, { fg: '#4285F4' }),
  T('google-ads', 'Google Ads', 'Google', { brand: 'googleads' }, W, {
    fg: '#4285F4',
    keywords: 'anuncio',
  }),
  T('google-pesquisa', 'Google Rede de Pesquisa', 'Google', { brand: 'googleads' }, W, {
    fg: '#1a73e8',
    keywords: 'search ads',
  }),
  T('google-display', 'Google Display', 'Google', { brand: 'googleads' }, W, { fg: '#34A853' }),
  T('google-meu-negocio', 'Google Meu Negócio', 'Google', { brand: 'googlemybusiness' }, W, {
    fg: '#4285F4',
    keywords: 'business profile maps',
  }),
  T('google-analytics', 'Google Analytics', 'Google', { brand: 'googleanalytics' }, W, {
    fg: '#E37400',
  }),
  T('google-tag-manager', 'Google Tag Manager', 'Google', { brand: 'googletagmanager' }, W, {
    fg: '#246FDB',
    keywords: 'gtm',
  }),
  T('seo', 'Busca (SEO)', 'Google', { lucide: 'Search' }, '#22c55e', { keywords: 'organico' }),
  T('youtube', 'YouTube', 'Google', { brand: 'youtube' }, '#FF0000'),
  T('youtube-ads', 'YouTube Ads', 'Google', { brand: 'youtube' }, '#FF0000', {
    keywords: 'anuncio',
  }),
  T('youtube-shorts', 'YouTube Shorts', 'Google', { brand: 'youtubeshorts' }, '#FF0000'),

  T('tiktok', 'TikTok', 'TikTok', { brand: 'tiktok' }, '#000000'),
  T('tiktok-ads', 'TikTok Ads', 'TikTok', { brand: 'tiktok' }, '#000000', { keywords: 'anuncio' }),
  T('tiktok-live', 'TikTok Live', 'TikTok', { brand: 'tiktok' }, '#000000'),

  T('kwai', 'Kwai', 'Kwai', { mono: 'K' }, '#FF6A00'),
  T('kwai-ads', 'Kwai Ads', 'Kwai', { mono: 'K' }, '#FF6A00', { keywords: 'anuncio' }),

  T('pinterest', 'Pinterest', 'Pinterest', { brand: 'pinterest' }, '#E60023'),
  T('pinterest-ads', 'Pinterest Ads', 'Pinterest', { brand: 'pinterest' }, '#E60023', {
    keywords: 'anuncio',
  }),

  T('taboola', 'Taboola', 'Native Ads', { mono: 'T' }, '#1d3f8f'),
  T('outbrain', 'Outbrain', 'Native Ads', { mono: 'ob' }, W, { fg: '#F15A22' }),
  T('mgid', 'MGID', 'Native Ads', { mono: 'MGID' }, '#1e2a78'),
  T('native', 'Native Ads', 'Native Ads', { lucide: 'Newspaper' }, '#0f766e', {
    keywords: 'advertorial',
  }),

  T('behance', 'Behance', 'Outros', { brand: 'behance' }, '#1769FF'),
  T('linkedin', 'LinkedIn', 'Outros', { brand: 'linkedin' }, '#0A66C2'),
  T('linkedin-ads', 'LinkedIn Ads', 'Outros', { brand: 'linkedin' }, '#0A66C2', {
    keywords: 'anuncio',
  }),
  T('x', 'X (Twitter)', 'Outros', { brand: 'x' }, '#000000', { keywords: 'twitter' }),
  T('reddit', 'Reddit', 'Outros', { brand: 'reddit' }, '#FF4500'),
  T('snapchat', 'Snapchat', 'Outros', { brand: 'snapchat' }, '#FFFC00', { fg: '#111111' }),
  T('substack', 'Substack', 'Outros', { brand: 'substack' }, '#FF6719'),
  T('newsletter', 'Newsletter', 'Outros', { lucide: 'Mails' }, '#f59e0b'),
  T('telegram', 'Telegram', 'Outros', { brand: 'telegram' }, '#26A5E4'),
  T('discord', 'Discord', 'Outros', { brand: 'discord' }, '#5865F2'),
  T('twitch', 'Twitch', 'Outros', { brand: 'twitch' }, '#9146FF'),
  T('spotify', 'Spotify', 'Outros', { brand: 'spotify' }, '#1ED760', { fg: '#000000' }),
  T('podcast', 'Podcast', 'Outros', { lucide: 'Podcast' }, '#8b5cf6'),
  T('medium', 'Medium', 'Outros', { brand: 'medium' }, '#000000'),
  T('bing', 'Bing Ads', 'Outros', { brand: 'microsoftbing' }, '#258FFA', { keywords: 'microsoft' }),
  T('qrcode', 'QR Code', 'Outros', { lucide: 'QrCode' }, '#111827'),
  T('direto', 'Tráfego Direto', 'Outros', { lucide: 'MousePointer2' }, '#64748b'),
  T('indicacao', 'Indicação', 'Outros', { lucide: 'Share2' }, '#0ea5e9', {
    keywords: 'boca a boca referral',
  }),
  T('afiliados', 'Afiliados', 'Outros', { lucide: 'HandCoins' }, '#10b981'),
  T('influenciador', 'Influenciador', 'Outros', { lucide: 'Megaphone' }, '#ec4899', {
    keywords: 'publi parceria',
  }),
  T('base-contatos', 'Base de Contatos', 'Outros', { lucide: 'Users' }, '#6366f1', {
    keywords: 'lista leads',
  }),
  T('evento', 'Evento Presencial', 'Outros', { lucide: 'MapPin' }, '#f97316'),
]

// ---------------------------------------------------------------- páginas
function P(
  id: string,
  label: string,
  tag: string,
  icon: string,
  page: PageSpec,
  keywords?: string,
): CatalogItem {
  return {
    id: `pages:${id}`,
    group: 'pages',
    label,
    tags: [tag],
    icon: { lucide: icon },
    bg: page.accent,
    kind: 'page',
    page,
    keywords,
  }
}

const pages: CatalogItem[] = [
  P('pagina', 'Página', 'Outros', 'File', {
    variant: 'generic',
    button: 'Saiba mais',
    accent: '#64748b',
  }),
  P(
    'vendas',
    'Página de Vendas',
    'Front-End',
    'Play',
    { variant: 'sales', button: 'Saiba mais', accent: '#3b82f6', billing: true, format: true },
    'vsl tsl oferta',
  ),
  P(
    'captura',
    'Página de Captura',
    'Front-End',
    'Magnet',
    { variant: 'capture', button: 'Quero receber', accent: '#2563eb' },
    'squeeze lead isca optin',
  ),
  P(
    'obrigado',
    'Página de Obrigado',
    'Front-End',
    'CircleCheck',
    { variant: 'thanks', button: 'Continuar', accent: '#22c55e' },
    'thank you',
  ),
  P('download', 'Página de Download', 'Front-End', 'Download', {
    variant: 'download',
    button: 'Baixar agora',
    accent: '#16a34a',
  }),
  P(
    'live',
    'Live',
    'Front-End',
    'Radio',
    { variant: 'live', button: 'Assistir', accent: '#ef4444' },
    'ao vivo',
  ),
  P('youtube-live', 'YouTube Live', 'Front-End', 'Play', {
    variant: 'ytlive',
    button: 'Assistir no YouTube',
    accent: '#ff0000',
  }),
  P(
    'reuniao-online',
    'Reunião Online',
    'Outros',
    'Video',
    { variant: 'meeting', button: 'Entrar na reunião', accent: '#3b82f6' },
    'zoom meet call',
  ),
  P(
    'webinar',
    'Página de Webinar',
    'Front-End',
    'Play',
    { variant: 'webinar', button: 'Assistir agora', accent: '#d946ef' },
    'webinario aula',
  ),
  P('replay', 'Replay de Webinar', 'Front-End', 'RotateCcw', {
    variant: 'replay',
    button: 'Ver replay',
    accent: '#6366f1',
  }),
  P(
    'lancamento',
    'Lançamento Tradicional',
    'Front-End',
    'Rocket',
    { variant: 'launch', button: 'Assistir aula', accent: '#8b5cf6' },
    'cpl',
  ),
  P(
    'agendar',
    'Agendar Reunião',
    'Outros',
    'CalendarCheck',
    { variant: 'schedule', button: 'Agendar', accent: '#7c3aed' },
    'calendly agenda',
  ),
  P(
    'aplicacao',
    'Formulário de Aplicação',
    'Front-End',
    'ClipboardList',
    { variant: 'survey', button: 'Enviar aplicação', accent: '#0891b2' },
    'high ticket',
  ),
  P(
    'checkout',
    'Checkout',
    'Front-End',
    'ShoppingCart',
    { variant: 'checkout', button: 'Comprar agora', accent: '#16a34a', billing: true },
    'pagamento',
  ),
  P(
    'oto',
    'Página OTO',
    'Back-End',
    'Zap',
    { variant: 'oto', button: 'Sim, eu quero', accent: '#f97316', billing: true, format: true },
    'one time offer',
  ),
  P('upsell', 'Upsell', 'Back-End', 'TrendingUp', {
    variant: 'oto',
    button: 'Adicionar ao pedido',
    accent: '#16a34a',
    billing: true,
    format: true,
  }),
  P('downsell', 'Downsell', 'Back-End', 'TrendingDown', {
    variant: 'oto',
    button: 'Quero essa versão',
    accent: '#f43f5e',
    billing: true,
    format: true,
  }),
  P(
    'pesquisa',
    'Pesquisa',
    'Outros',
    'ListChecks',
    { variant: 'survey', button: 'Enviar respostas', accent: '#06b6d4' },
    'quiz formulario',
  ),
  P(
    'avaliacao',
    'Avaliação',
    'Back-End',
    'Star',
    { variant: 'review', button: 'Avaliar', accent: '#eab308' },
    'depoimento nps',
  ),
  P(
    'blog',
    'Blog',
    'Outros',
    'Newspaper',
    { variant: 'blog', button: 'Ler mais', accent: '#64748b' },
    'artigo',
  ),
  P('comunidade', 'Comunidade', 'Back-End', 'UsersRound', {
    variant: 'community',
    button: 'Entrar',
    accent: '#6366f1',
  }),
  P(
    'membros',
    'Área de Membros',
    'Back-End',
    'GraduationCap',
    { variant: 'members', button: 'Acessar', accent: '#3b82f6' },
    'curso aulas',
  ),
  P(
    'presencial',
    'Reunião Presencial',
    'Outros',
    'MapPin',
    { variant: 'inperson', button: 'Confirmar presença', accent: '#0ea5e9' },
    'evento',
  ),
  P(
    'auth',
    'Página de Auth',
    'Back-End',
    'KeyRound',
    { variant: 'auth', button: 'Entrar', accent: '#0ea5e9' },
    'login cadastro senha',
  ),
]

// ---------------------------------------------------------------- eventos
const E = (id: string, label: string, icon: IconSpec, bg: string, opt?: Opt) =>
  item('events', id, label, [], icon, bg, opt)

const events: CatalogItem[] = [
  E('crm', 'Adicionado ao CRM', { lucide: 'Database' }, '#6366f1'),
  E('add-carrinho', 'Adicionou ao Carrinho', { lucide: 'ShoppingCart' }, '#0ea5e9'),
  E('app', 'App (Assinatura)', { lucide: 'Smartphone' }, '#0ea5e9'),
  E('audiencia', 'Audiência', { lucide: 'Users' }, '#06b6d4', { keywords: 'publico' }),
  E('auth', 'Auth', { lucide: 'LockOpen' }, '#0ea5e9', { keywords: 'login' }),
  E('automacao', 'Automação', { lucide: 'Workflow' }, '#8b5cf6'),
  E('cadastro', 'Cadastro', { lucide: 'ClipboardList' }, '#2563eb'),
  E('carrinho-abandonado', 'Carrinho Abandonado', { lucide: 'ShoppingCart' }, '#ef4444'),
  E('certificado', 'Certificado', { lucide: 'Award' }, '#f59e0b'),
  E('clique', 'Clique', { lucide: 'MousePointerClick' }, '#64748b'),
  E('codigo', 'Código', { lucide: 'Code' }, '#0f172a'),
  E('componente', 'Componente', { lucide: 'Plus' }, '#64748b'),
  E('compra', 'Compra', { lucide: 'ShoppingCart' }, '#22c55e', { keywords: 'venda aprovada' }),
  E('conjunto', 'Conjunto', { lucide: 'Layers' }, '#111827'),
  E('data', 'Data', { lucide: 'Calendar' }, '#0ea5e9'),
  E('ebook', 'Ebook', { lucide: 'BookOpen' }, '#f43f5e'),
  E('boleto', 'Emissão de Boleto', { lucide: 'Barcode' }, '#374151'),
  E('proposta', 'Emissão de Proposta', { lucide: 'FilePen' }, '#64748b'),
  E('arquivo', 'Envio de Arquivo', { lucide: 'FileUp' }, '#3b82f6'),
  E('esperar', 'Esperar', { lucide: 'Clock' }, '#64748b', { keywords: 'delay aguardar tempo' }),
  E('exit-popup', 'Exit Popup', { lucide: 'AppWindow' }, '#a855f7'),
  E('follow-up', 'Follow-up', { lucide: 'PhoneCall' }, '#3b82f6'),
  E('funil-3d', 'Funil 3D', { lucide: 'CircleHelp' }, '#8b5cf6'),
  E('pix', 'Gerou o PIX', { brand: 'pix' }, '#32BCAD'),
  E('grupos-whatsapp', 'Grupos de WhatsApp', { brand: 'whatsapp' }, '#22c55e'),
  E('ingresso', 'Ingresso', { lucide: 'Ticket' }, 'linear-gradient(135deg,#facc15,#ca8a04)'),
  E('invite', 'Invite', { lucide: 'MailPlus' }, '#8b5cf6', { keywords: 'convite' }),
  E('isca', 'Isca', { lucide: 'Magnet' }, '#e11d48', { keywords: 'lead magnet' }),
  E('lead', 'Lead', { lucide: 'UserPlus' }, '#3b82f6'),
  E('link', 'Link', { lucide: 'MousePointerClick' }, '#3b82f6'),
  E('material', 'Material de Apoio', { lucide: 'FileText' }, '#0891b2'),
  E('nota-fiscal', 'Nota Fiscal', { lucide: 'Receipt' }, '#475569'),
  E('order-bump', 'Order Bump', { lucide: 'SquarePlus' }, '#14b8a6', { kind: 'orderbump' }),
  E('planos', 'Planos', { lucide: 'Layers' }, '#6366f1'),
  E('playbook', 'Playbook', { lucide: 'BookOpen' }, '#7c3aed'),
  E('popup', 'Popup', { lucide: 'AppWindow' }, '#8b5cf6'),
  E('presentation', 'Presentation Data', { lucide: 'Play' }, '#0ea5e9', {
    keywords: 'apresentacao',
  }),
  E('produto', 'Produto', { lucide: 'ShoppingBag' }, '#2563eb'),
  E('lotes', 'Progressão de Lotes', { lucide: 'Ticket' }, '#7c3aed'),
  E('recuperacao', 'Recuperação', { lucide: 'RotateCcw' }, '#f59e0b'),
  E('recusou', 'Recusou', { lucide: 'ThumbsDown' }, '#ef4444'),
  E('redirect', 'Redirect', { lucide: 'CornerUpRight' }, '#0ea5e9', { keywords: 'redirecionar' }),
  E('reembolso', 'Reembolso', { lucide: 'Undo2' }, '#ef4444'),
  E('remarketing', 'Remarketing', { lucide: 'Repeat' }, '#8b5cf6', { keywords: 'retargeting' }),
  E('saas', 'SaaS', { lucide: 'Monitor' }, '#6366f1'),
  E('se-ou', 'Se/ou', { lucide: 'GitBranch' }, '#64748b', {
    kind: 'decision',
    keywords: 'condicao decisao sim nao',
  }),
  E('tag', 'Tag', { lucide: 'Tag' }, '#ec4899', { keywords: 'etiqueta' }),
]

// ---------------------------------------------------------------- mensagens
const M = (id: string, label: string, icon: IconSpec, bg: string, opt?: Opt) =>
  item('messages', id, label, [], icon, bg, opt)

const messages: CatalogItem[] = [
  M('email', 'E-mail', { lucide: 'Mail' }, '#3b82f6'),
  M('sequencia-emails', 'Sequência de E-mails', { lucide: 'Mails' }, '#6366f1'),
  M('whatsapp', 'WhatsApp', { brand: 'whatsapp' }, '#25D366'),
  M('whatsapp-grupo', 'Mensagem no Grupo', { lucide: 'MessagesSquare' }, '#22c55e', {
    keywords: 'whatsapp',
  }),
  M('sms', 'SMS', { lucide: 'MessageSquareText' }, '#0ea5e9'),
  M('ligacao', 'Ligação', { lucide: 'Phone' }, '#10b981', { keywords: 'telefone' }),
  M('push', 'Notificação Push', { lucide: 'Bell' }, '#f59e0b'),
  M('dm-instagram', 'DM Instagram', { brand: 'instagram' }, IG, { keywords: 'direct' }),
  M('messenger', 'Messenger', { brand: 'messenger' }, '#0866FF'),
  M('telegram', 'Telegram', { brand: 'telegram' }, '#26A5E4'),
  M('chatbot', 'Chatbot', { lucide: 'Bot' }, '#8b5cf6', { keywords: 'robo ia' }),
  M('suporte', 'Suporte', { lucide: 'Headset' }, '#0891b2', { keywords: 'atendimento' }),
]

// ---------------------------------------------------------------- integrações
const I = (id: string, label: string, tag: string, icon: IconSpec, bg: string, opt?: Opt) =>
  item('integrations', id, label, [tag], icon, bg, opt)

const integrations: CatalogItem[] = [
  I('hotmart', 'Hotmart', 'Pagamento', { mono: 'H' }, '#F04E23'),
  I('kiwify', 'Kiwify', 'Pagamento', { mono: 'K' }, '#10b981'),
  I('eduzz', 'Eduzz', 'Pagamento', { mono: 'E' }, '#FFBC00', { fg: '#1e3a8a' }),
  I('monetizze', 'Monetizze', 'Pagamento', { mono: 'M' }, '#0057FF'),
  I('braip', 'Braip', 'Pagamento', { mono: 'b' }, '#6B2BFF'),
  I('cakto', 'Cakto', 'Pagamento', { mono: 'C' }, '#22a55a'),
  I('ticto', 'Ticto', 'Pagamento', { mono: 'T' }, '#111827'),
  I('greenn', 'Greenn', 'Pagamento', { mono: 'G' }, '#00b35c'),
  I('perfect-pay', 'Perfect Pay', 'Pagamento', { mono: 'PP' }, '#2b59ff'),
  I('appmax', 'Appmax', 'Pagamento', { mono: 'A' }, '#8b5cf6'),
  I('asaas', 'Asaas', 'Pagamento', { mono: 'a' }, '#1e3a8a'),
  I('cartpanda', 'CartPanda', 'Pagamento', { mono: 'CP' }, '#2563eb'),
  I('clickbank', 'ClickBank', 'Pagamento', { mono: 'CB' }, W, { fg: '#333333' }),
  I('digistore24', 'Digistore24', 'Pagamento', { mono: 'D' }, '#2563eb'),
  I('mercado-pago', 'Mercado Pago', 'Pagamento', { brand: 'mercadopago' }, '#00B1EA'),
  I('pagseguro', 'PagSeguro', 'Pagamento', { brand: 'pagseguro' }, '#FFC801', { fg: '#111111' }),
  I('paypal', 'PayPal', 'Pagamento', { brand: 'paypal' }, '#002991'),
  I('stripe', 'Stripe', 'Pagamento', { brand: 'stripe' }, '#635BFF'),
  I('pix', 'Pix', 'Pagamento', { brand: 'pix' }, '#32BCAD'),

  I('activecampaign', 'ActiveCampaign', 'E-mail', { lucide: 'ChevronRight' }, '#356AE6'),
  I('brevo', 'Brevo', 'E-mail', { brand: 'brevo' }, '#0B996E'),
  I('mailchimp', 'Mailchimp', 'E-mail', { brand: 'mailchimp' }, '#FFE01B', { fg: '#111111' }),
  I('convertkit', 'ConvertKit (Kit)', 'E-mail', { brand: 'kit' }, '#FB6970'),
  I('beehiiv', 'Beehiiv', 'E-mail', { mono: 'b' }, 'linear-gradient(135deg,#f472b6,#7c3aed)'),
  I('mailerlite', 'MailerLite', 'E-mail', { mono: 'ML' }, '#09C269'),
  I('klaviyo', 'Klaviyo', 'E-mail', { mono: 'K' }, '#232426'),
  I('gmail', 'Gmail', 'E-mail', { brand: 'gmail' }, W, { fg: '#EA4335' }),
  I('leadlovers', 'Leadlovers', 'E-mail', { mono: 'LL' }, '#E91E63'),
  I('mautic', 'Mautic', 'E-mail', { brand: 'mautic' }, '#4E5E9E'),
  I('resend', 'Resend', 'E-mail', { brand: 'resend' }, '#000000'),

  I('rdstation', 'RD Station', 'CRM', { mono: 'RD' }, '#1A3EF0'),
  I('hubspot', 'HubSpot', 'CRM', { brand: 'hubspot' }, '#FF7A59'),
  I('pipedrive', 'Pipedrive', 'CRM', { mono: 'p' }, '#1f1f1f', { fg: '#3dd68c' }),
  I('salesforce', 'Salesforce', 'CRM', { brand: 'salesforce' }, '#00A1E0'),
  I('kommo', 'Kommo', 'CRM', { mono: 'K' }, '#2B6CB0'),
  I('bitrix24', 'Bitrix24', 'CRM', { mono: '24' }, '#2FC6F6'),
  I('zoho', 'Zoho CRM', 'CRM', { brand: 'zoho' }, '#E42527'),
  I('airtable', 'Airtable', 'CRM', { brand: 'airtable' }, W, { fg: '#18BFFF' }),

  I('zapier', 'Zapier', 'Automação', { brand: 'zapier' }, '#FF4F00'),
  I('make', 'Make', 'Automação', { brand: 'make' }, '#6D00CC'),
  I('n8n', 'n8n', 'Automação', { brand: 'n8n' }, '#EA4B71'),
  I('manychat', 'ManyChat', 'Automação', { mono: 'M' }, '#0084FF'),
  I('pluga', 'Pluga', 'Automação', { mono: 'P' }, '#00b3a4'),
  I('webhook', 'Webhook', 'Automação', { lucide: 'Zap' }, '#f59e0b'),

  I('cademi', 'Cademi', 'Membros', { mono: 'C' }, '#111111', { fg: '#ec4899' }),
  I('circle', 'Circle', 'Membros', { brand: 'circle' }, '#2563eb'),
  I('memberkit', 'Memberkit', 'Membros', { mono: 'MK' }, '#5b21b6'),
  I('kajabi', 'Kajabi', 'Membros', { mono: 'K' }, '#2E91FC'),
  I('skool', 'Skool', 'Membros', { mono: 'S' }, W, { fg: '#1d4ed8' }),
  I('teachable', 'Teachable', 'Membros', { mono: 'T' }, '#111111'),

  I('adobe', 'Adobe', 'Docs & Forms', { brand: 'adobe' }, '#FF0000'),
  I('acrobat', 'Adobe Acrobat', 'Docs & Forms', { brand: 'adobeacrobatreader' }, '#EC1C24', {
    keywords: 'pdf',
  }),
  I('notion', 'Notion', 'Docs & Forms', { brand: 'notion' }, W, { fg: '#000000' }),
  I('google-docs', 'Google Docs', 'Docs & Forms', { brand: 'googledocs' }, W, { fg: '#4285F4' }),
  I('google-sheets', 'Google Sheets', 'Docs & Forms', { brand: 'googlesheets' }, W, {
    fg: '#34A853',
    keywords: 'planilha',
  }),
  I('google-forms', 'Google Forms', 'Docs & Forms', { brand: 'googleforms' }, W, { fg: '#7248B9' }),
  I('google-drive', 'Google Drive', 'Docs & Forms', { brand: 'googledrive' }, W, { fg: '#4285F4' }),
  I('dropbox', 'Dropbox', 'Docs & Forms', { brand: 'dropbox' }, '#0061FF'),
  I('typeform', 'Typeform', 'Docs & Forms', { brand: 'typeform' }, '#262627'),
  I('tally', 'Tally', 'Docs & Forms', { mono: 'T' }, '#000000'),
  I('jotform', 'Jotform', 'Docs & Forms', { mono: 'J' }, '#FF6100'),

  I('calendly', 'Calendly', 'Reunião & Vídeo', { brand: 'calendly' }, '#006BFF'),
  I('zoom', 'Zoom', 'Reunião & Vídeo', { brand: 'zoom' }, '#0B5CFF'),
  I('google-meet', 'Google Meet', 'Reunião & Vídeo', { brand: 'googlemeet' }, W, { fg: '#00897B' }),
  I('teams', 'Microsoft Teams', 'Reunião & Vídeo', { brand: 'microsoftteams' }, '#6264A7'),
  I('google-calendar', 'Google Agenda', 'Reunião & Vídeo', { brand: 'googlecalendar' }, W, {
    fg: '#4285F4',
    keywords: 'calendar',
  }),
  I('youtube', 'YouTube', 'Reunião & Vídeo', { brand: 'youtube' }, '#FF0000'),
  I('vimeo', 'Vimeo', 'Reunião & Vídeo', { brand: 'vimeo' }, '#1AB7EA'),
  I('loom', 'Loom', 'Reunião & Vídeo', { brand: 'loom' }, '#625DF5'),
  I('panda', 'Panda Video', 'Reunião & Vídeo', { mono: 'P' }, '#111111'),
  I('vturb', 'Vturb', 'Reunião & Vídeo', { mono: 'V' }, '#6d28d9'),
  I('streamyard', 'StreamYard', 'Reunião & Vídeo', { mono: 'SY' }, '#4f46e5'),

  I('adapta-one', 'Adapta ONE', 'Adapta', { brand: 'adaptaone' }, '#14B8A1', {
    keywords: 'adapta one ia agente',
  }),
  I('maestro', 'Maestro', 'Adapta', { brand: 'adaptamaestro' }, '#E54D00', {
    keywords: 'adapta maestro funis agente',
  }),
  I('skip', 'Skip', 'Adapta', { brand: 'goskip' }, '#8B51FF', {
    keywords: 'goskip adapta builder no code',
  }),

  I('chatgpt', 'ChatGPT', 'IA', { brand: 'openai' }, W, { fg: '#000000', keywords: 'openai' }),
  I('claude', 'Claude', 'IA', { brand: 'claude' }, '#D97757', { keywords: 'anthropic' }),
  I('gemini', 'Gemini', 'IA', { brand: 'googlegemini' }, W, { fg: '#8E75B2' }),
  I('elevenlabs', 'ElevenLabs', 'IA', { brand: 'elevenlabs' }, W, { fg: '#000000' }),
  I('perplexity', 'Perplexity', 'IA', { brand: 'perplexity' }, '#20808D'),
  I('midjourney', 'Midjourney', 'IA', { mono: 'MJ' }, '#000000'),
  I('heygen', 'HeyGen', 'IA', { mono: 'H' }, '#7559FF'),
  I('grok', 'Grok', 'IA', { brand: 'grok' }, '#000000', { keywords: 'xai grokbot twitter' }),
  I('vercel-ia', 'Vercel', 'IA', { brand: 'vercel' }, '#000000', {
    keywords: 'deploy hosting nextjs',
  }),
  I('supabase-ia', 'Supabase', 'IA', { brand: 'supabase' }, '#1c1c1c', {
    fg: '#3FCF8E',
    keywords: 'postgres banco backend',
  }),

  I('figma', 'Figma', 'Site & Design', { brand: 'figma' }, W, { fg: '#F24E1E' }),
  I('canva', 'Canva', 'Site & Design', { brand: 'canva' }, '#00C4CC'),
  I('wordpress', 'WordPress', 'Site & Design', { brand: 'wordpress' }, '#21759B'),
  I('elementor', 'Elementor', 'Site & Design', { brand: 'elementor' }, '#92003B'),
  I('webflow', 'Webflow', 'Site & Design', { brand: 'webflow' }, '#146EF5'),
  I('framer', 'Framer', 'Site & Design', { brand: 'framer' }, '#000000'),
  I('wix', 'Wix', 'Site & Design', { brand: 'wix' }, '#000000'),
  I('shopify', 'Shopify', 'Site & Design', { brand: 'shopify' }, '#7AB55C'),
  I('clickfunnels', 'ClickFunnels', 'Site & Design', { mono: 'CF' }, '#0E1B3D'),
  I(
    'lovable',
    'Lovable',
    'Site & Design',
    { mono: 'L' },
    'linear-gradient(135deg,#fb7185,#f97316)',
  ),
  I('greatpages', 'Greatpages', 'Site & Design', { mono: 'GP' }, '#2563eb'),
  I('leadpages', 'Leadpages', 'Site & Design', { mono: 'LP' }, '#3D5AFE'),

  I('github', 'GitHub', 'Dev & Código', { brand: 'github' }, W, { fg: '#181717' }),
  I('vercel', 'Vercel', 'Dev & Código', { brand: 'vercel' }, '#000000'),
  I('supabase', 'Supabase', 'Dev & Código', { brand: 'supabase' }, '#1c1c1c', { fg: '#3FCF8E' }),
  I('firebase', 'Firebase', 'Dev & Código', { brand: 'firebase' }, '#FFCA28', { fg: '#DD2C00' }),
  I('netlify', 'Netlify', 'Dev & Código', { brand: 'netlify' }, '#00C7B7'),
  I('replit', 'Replit', 'Dev & Código', { brand: 'replit' }, '#F26207'),
  I('cursor', 'Cursor', 'Dev & Código', { brand: 'cursor' }, '#000000'),

  I('clickup', 'ClickUp', 'Gestão', { brand: 'clickup' }, W, { fg: '#7B68EE' }),
  I('asana', 'Asana', 'Gestão', { brand: 'asana' }, W, { fg: '#F06A6A' }),
  I('trello', 'Trello', 'Gestão', { brand: 'trello' }, '#0052CC'),
  I('jira', 'Jira', 'Gestão', { brand: 'jira' }, '#0052CC'),
  I('monday', 'Monday', 'Gestão', { mono: 'M' }, '#6161FF'),
  I('slack', 'Slack', 'Gestão', { brand: 'slack' }, W, { fg: '#4A154B' }),

  I('google-analytics', 'Google Analytics', 'Rastreio', { brand: 'googleanalytics' }, W, {
    fg: '#E37400',
  }),
  I('gtm', 'Google Tag Manager', 'Rastreio', { brand: 'googletagmanager' }, W, { fg: '#246FDB' }),
  I('pixel-meta', 'Pixel Meta', 'Rastreio', { brand: 'meta' }, '#0467DF'),
  I('hotjar', 'Hotjar', 'Rastreio', { brand: 'hotjar' }, '#FF3C00'),
  I('clarity', 'Microsoft Clarity', 'Rastreio', { mono: 'C' }, '#0078D4'),
  I('mixpanel', 'Mixpanel', 'Rastreio', { brand: 'mixpanel' }, '#7856FF'),
  I('looker', 'Looker Studio', 'Rastreio', { brand: 'looker' }, W, { fg: '#4285F4' }),
  I('utmify', 'UTMify', 'Rastreio', { mono: 'U' }, '#10b981'),
  I('stape', 'Stape', 'Rastreio', { mono: 'S' }, '#f97316'),

  I('discord', 'Discord', 'Outros', { brand: 'discord' }, '#5865F2'),
  I('telegram', 'Telegram', 'Outros', { brand: 'telegram' }, '#26A5E4'),
  I('whatsapp', 'WhatsApp', 'Outros', { brand: 'whatsapp' }, '#25D366'),
  I('nubank', 'Nubank', 'Outros', { brand: 'nubank' }, '#820AD1'),
]

// ---------------------------------------------------------------- produtos
// O que está sendo vendido. Cada produto tem nome, categoria e preço; o
// "Bundle" junta vários produtos do funil numa oferta só.

export interface ProductSpec {
  category: string
  bundle?: boolean
  recurring?: boolean // começa com cobrança mensal
}

/** Categorias do select "Categoria" do produto. */
export const PRODUCT_CATEGORIES = [
  'Infoproduto',
  'Curso online',
  'E-book / PDF',
  'Planilha',
  'Template',
  'Aulas ao vivo',
  'Comunidade',
  'Assinatura',
  'SaaS / Software',
  'Mentoria',
  'Consultoria',
  'Serviço',
  'Evento / Imersão',
  'Workshop',
  'Produto físico',
  'Bônus',
  'Garantia',
  'Bundle',
  'Outro',
]

function PR(
  id: string,
  label: string,
  tag: string,
  icon: string,
  bg: string,
  product: ProductSpec,
  keywords?: string,
): CatalogItem {
  return {
    id: `products:${id}`,
    group: 'products',
    label,
    tags: [tag],
    icon: { lucide: icon },
    bg,
    kind: 'product',
    product,
    keywords,
  }
}

const products: CatalogItem[] = [
  PR(
    'infoproduto',
    'Infoproduto',
    'Digital',
    'Package',
    '#6366f1',
    { category: 'Infoproduto' },
    'produto digital',
  ),
  PR(
    'curso',
    'Curso online',
    'Digital',
    'GraduationCap',
    '#3b82f6',
    { category: 'Curso online' },
    'aulas treinamento',
  ),
  PR(
    'ebook',
    'E-book / PDF',
    'Digital',
    'BookOpen',
    '#f43f5e',
    { category: 'E-book / PDF' },
    'pdf livro guia',
  ),
  PR(
    'planilha',
    'Planilha',
    'Digital',
    'Sheet',
    '#16a34a',
    { category: 'Planilha' },
    'excel sheets',
  ),
  PR(
    'template',
    'Template',
    'Digital',
    'LayoutTemplate',
    '#0ea5e9',
    { category: 'Template' },
    'modelo notion canva',
  ),
  PR(
    'aulas-ao-vivo',
    'Aulas ao vivo',
    'Digital',
    'MonitorPlay',
    '#ef4444',
    { category: 'Aulas ao vivo' },
    'turma live',
  ),
  PR(
    'comunidade',
    'Comunidade',
    'Digital',
    'UsersRound',
    '#8b5cf6',
    { category: 'Comunidade', recurring: true },
    'grupo membros',
  ),
  PR(
    'assinatura',
    'Assinatura',
    'Digital',
    'Repeat',
    '#7c3aed',
    { category: 'Assinatura', recurring: true },
    'recorrencia mensal clube',
  ),
  PR(
    'saas',
    'SaaS / Software',
    'Digital',
    'AppWindow',
    '#0891b2',
    { category: 'SaaS / Software', recurring: true },
    'app ferramenta',
  ),
  PR(
    'mentoria',
    'Mentoria',
    'Serviço',
    'Handshake',
    '#f59e0b',
    { category: 'Mentoria' },
    'high ticket acompanhamento',
  ),
  PR('consultoria', 'Consultoria', 'Serviço', 'Briefcase', '#b45309', { category: 'Consultoria' }),
  PR(
    'servico',
    'Serviço',
    'Serviço',
    'Wrench',
    '#64748b',
    { category: 'Serviço' },
    'done for you agencia',
  ),
  PR(
    'evento',
    'Evento / Imersão',
    'Serviço',
    'Ticket',
    '#ec4899',
    { category: 'Evento / Imersão' },
    'presencial ingresso',
  ),
  PR('workshop', 'Workshop', 'Serviço', 'Presentation', '#d946ef', { category: 'Workshop' }),
  PR(
    'fisico',
    'Produto físico',
    'Físico',
    'Box',
    '#a16207',
    { category: 'Produto físico' },
    'estoque envio loja',
  ),
  PR(
    'bundle',
    'Bundle (combo)',
    'Oferta',
    'Boxes',
    '#14b8a6',
    { category: 'Bundle', bundle: true },
    'conjunto oferta pacote kit combo',
  ),
  PR('bonus', 'Bônus', 'Oferta', 'Gift', '#e11d48', { category: 'Bônus' }, 'brinde'),
  PR(
    'garantia',
    'Garantia',
    'Oferta',
    'ShieldCheck',
    '#22c55e',
    { category: 'Garantia' },
    'reembolso 7 dias',
  ),
]

export const CATALOG: CatalogItem[] = [
  ...traffic,
  ...pages,
  ...events,
  ...messages,
  ...integrations,
  ...products,
]

const BY_ID = new Map(CATALOG.map((c) => [c.id, c]))
export function getItem(ref: string | undefined): CatalogItem | undefined {
  return ref ? BY_ID.get(ref) : undefined
}

export const GROUPS: { id: Group; label: string; title: string; icon: string; chips: string[] }[] =
  [
    {
      id: 'traffic',
      label: 'Tráfego',
      title: 'Fontes de tráfego',
      icon: 'Users',
      chips: ['Meta', 'Google', 'TikTok', 'Kwai', 'Pinterest', 'Native Ads', 'Outros'],
    },
    {
      id: 'pages',
      label: 'Páginas',
      title: 'Páginas',
      icon: 'AppWindow',
      chips: ['Front-End', 'Back-End', 'Outros'],
    },
    {
      id: 'events',
      label: 'Eventos',
      title: 'Eventos e ações',
      icon: 'MousePointerClick',
      chips: [],
    },
    { id: 'messages', label: 'Mensagens', title: 'Mensagens', icon: 'MessageCircle', chips: [] },
    {
      id: 'integrations',
      label: 'Integrações',
      title: 'Integrações e ferramentas',
      icon: 'Plug',
      chips: [
        'Pagamento',
        'E-mail',
        'CRM',
        'Automação',
        'Membros',
        'Docs & Forms',
        'Reunião & Vídeo',
        'Adapta',
        'IA',
        'Site & Design',
        'Dev & Código',
        'Gestão',
        'Rastreio',
        'Outros',
      ],
    },
    {
      id: 'products',
      label: 'Produtos',
      title: 'Produtos e ofertas',
      icon: 'Package',
      chips: ['Digital', 'Serviço', 'Físico', 'Oferta'],
    },
  ]

/** Normaliza para busca sem acento/maiúscula. */
export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function searchCatalog(query: string, group?: Group, chip?: string): CatalogItem[] {
  const q = norm(query.trim())
  return CATALOG.filter((c) => {
    if (group && c.group !== group) return false
    if (chip && !c.tags.includes(chip)) return false
    if (!q) return true
    return norm(`${c.label} ${c.keywords ?? ''} ${c.tags.join(' ')}`).includes(q)
  }).sort((a, b) =>
    group && group !== 'pages' && group !== 'products'
      ? a.label.localeCompare(b.label, 'pt-BR')
      : 0,
  )
}
