// Ilustração do miolo de cada tipo de página (mockup de navegador).
import {
  CalendarCheck,
  Check,
  Download,
  File,
  GraduationCap,
  Image,
  KeyRound,
  Lock,
  Magnet,
  MapPin,
  Mic,
  Play,
  Radio,
  RotateCcw,
  Star,
  User,
  Video,
} from 'lucide-react'
import type { PageVariant } from '../catalog'

const tint = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`

export function Sk({ w = '100%', h = 6, c }: { w?: string | number; h?: number; c?: string }) {
  return <div className="fn-sk" style={{ width: w, height: h, ...(c ? { background: c } : {}) }} />
}

function Lines({ n = 2 }: { n?: number }) {
  const widths = ['78%', '60%', '70%', '50%']
  return (
    <div className="fn-lines">
      {Array.from({ length: n }, (_, i) => (
        <Sk key={i} w={widths[i % widths.length]} />
      ))}
    </div>
  )
}

function Tile({
  accent,
  children,
  round,
}: {
  accent: string
  children: React.ReactNode
  round?: boolean
}) {
  return (
    <div
      className={`fn-tile${round ? ' is-round' : ''}`}
      style={{ background: tint(accent, 16), color: accent }}
    >
      {children}
    </div>
  )
}

function Player({
  accent,
  badge,
  badgeColor,
  icon,
  chat,
  chips,
}: {
  accent: string
  badge?: string
  badgeColor?: string
  icon?: React.ReactNode
  chat?: boolean
  chips?: string[]
}) {
  return (
    <div className="fn-player">
      <div className="fn-player-screen">
        {badge && (
          <span className="fn-player-badge" style={{ background: badgeColor ?? accent }}>
            {badge}
          </span>
        )}
        <span className="fn-player-btn" style={{ background: accent }}>
          {icon ?? <Play size={14} fill="#fff" color="#fff" />}
        </span>
        <div className="fn-player-bar">
          <span style={{ background: accent }} />
        </div>
      </div>
      {chat && (
        <div className="fn-player-chat">
          <Sk w="80%" h={3} c="#334155" />
          <Sk w="60%" h={3} c="#334155" />
          <Sk w="70%" h={3} c="#334155" />
          <Sk w="50%" h={3} c="#334155" />
        </div>
      )}
      {chips && (
        <div className="fn-player-chips">
          {chips.map((c) => (
            <span key={c} style={{ background: tint(accent, 30) }}>
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Field() {
  return <div className="fn-field" />
}

export function PageArt({
  variant,
  accent,
  format,
}: {
  variant: PageVariant
  accent: string
  format?: string
}) {
  switch (variant) {
    case 'sales':
    case 'oto':
      if (format === 'tsl')
        return (
          <div className="fn-art">
            <Sk w="85%" h={8} />
            <Sk w="65%" h={8} />
            <Lines n={4} />
          </div>
        )
      return (
        <div className="fn-art">
          <Player accent={accent} badge={variant === 'oto' ? 'OFERTA ESPECIAL' : undefined} />
        </div>
      )
    case 'capture':
      return (
        <div className="fn-art">
          <Tile accent={accent}>
            <Magnet size={18} />
          </Tile>
          <Lines />
          <Field />
          <Field />
        </div>
      )
    case 'thanks':
      return (
        <div className="fn-art">
          <Tile accent="#22c55e" round>
            <Check size={20} strokeWidth={3} />
          </Tile>
          <Lines />
        </div>
      )
    case 'download':
      return (
        <div className="fn-art">
          <Tile accent={accent}>
            <Download size={18} />
          </Tile>
          <Lines />
        </div>
      )
    case 'live':
      return (
        <div className="fn-art">
          <Player
            accent={accent}
            badge="● AO VIVO"
            badgeColor="#ef4444"
            icon={<Radio size={14} color="#fff" />}
            chat
          />
        </div>
      )
    case 'ytlive':
      return (
        <div className="fn-art">
          <Player accent="#ff0000" badge="● LIVE" badgeColor="#ff0000" chat />
        </div>
      )
    case 'webinar':
      return (
        <div className="fn-art">
          <Player accent={accent} badge="● AO VIVO" badgeColor="#ef4444" chat />
        </div>
      )
    case 'replay':
      return (
        <div className="fn-art">
          <Player accent={accent} badge="REPLAY" icon={<RotateCcw size={14} color="#fff" />} />
        </div>
      )
    case 'launch':
      return (
        <div className="fn-art">
          <Player accent={accent} chips={['CPL 1', 'CPL 2', 'CPL 3']} />
        </div>
      )
    case 'meeting':
      return (
        <div className="fn-art">
          <div className="fn-meet">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="fn-meet-tile">
                <User size={14} color="#94a3b8" />
              </div>
            ))}
            <div className="fn-meet-bar">
              <Mic size={9} color="#cbd5e1" />
              <Video size={9} color="#cbd5e1" />
              <span className="fn-meet-end" />
            </div>
          </div>
        </div>
      )
    case 'schedule':
      return (
        <div className="fn-art">
          <div className="fn-cal">
            <div className="fn-cal-head" style={{ color: accent }}>
              <CalendarCheck size={12} />
              <Sk w="45%" h={5} />
            </div>
            <div className="fn-cal-grid">
              {Array.from({ length: 21 }, (_, i) => (
                <span
                  key={i}
                  style={
                    i === 9
                      ? { background: accent }
                      : i === 16
                        ? { background: tint(accent, 35) }
                        : undefined
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )
    case 'checkout':
      return null // desenhado no PageNode (precisa do preço)
    case 'survey':
      return (
        <div className="fn-art">
          {[0, 1, 2].map((i) => (
            <div key={i} className="fn-radio">
              <span style={i === 1 ? { borderColor: accent, background: accent } : undefined} />
              <Sk w={`${[70, 55, 62][i]}%`} />
            </div>
          ))}
        </div>
      )
    case 'review':
      return (
        <div className="fn-art">
          <div className="fn-stars">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={15} color="#eab308" fill={i < 4 ? '#eab308' : 'transparent'} />
            ))}
          </div>
          <Lines />
        </div>
      )
    case 'blog':
      return (
        <div className="fn-art">
          <div className="fn-img">
            <Image size={18} />
          </div>
          <Sk w="80%" h={7} />
          <Lines />
        </div>
      )
    case 'community':
      return (
        <div className="fn-art">
          {[0, 1, 2].map((i) => (
            <div key={i} className="fn-post">
              <span style={{ background: tint(accent, 40 + i * 15) }} />
              <div>
                <Sk w="60%" h={4} />
                <Sk w="90%" h={4} />
              </div>
            </div>
          ))}
        </div>
      )
    case 'members':
      return (
        <div className="fn-art">
          <div className="fn-courses">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} style={{ background: tint(accent, 22 + i * 10) }}>
                {i === 0 ? (
                  <GraduationCap size={13} color={accent} />
                ) : (
                  <Play size={10} color={accent} />
                )}
              </span>
            ))}
          </div>
          <Sk w="70%" />
        </div>
      )
    case 'inperson':
      return (
        <div className="fn-art">
          <Tile accent={accent}>
            <MapPin size={18} />
          </Tile>
          <Lines />
        </div>
      )
    case 'auth':
      return (
        <div className="fn-art">
          <Tile accent={accent} round>
            <Lock size={16} />
          </Tile>
          <Field />
          <div className="fn-field fn-field-pass">
            <KeyRound size={8} />
            <span>••••••</span>
          </div>
        </div>
      )
    case 'generic':
    default:
      return (
        <div className="fn-art">
          <Tile accent="#64748b">
            <File size={18} />
          </Tile>
          <Lines />
        </div>
      )
  }
}
