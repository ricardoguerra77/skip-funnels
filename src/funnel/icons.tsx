import type { CSSProperties, ComponentType } from 'react'
import {
  AppWindow,
  Award,
  Barcode,
  Bell,
  BookOpen,
  Bot,
  Calendar,
  CalendarCheck,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleHelp,
  ClipboardList,
  Clock,
  Code,
  CornerUpRight,
  Database,
  Download,
  File,
  FilePen,
  FileText,
  FileUp,
  GitBranch,
  GraduationCap,
  HandCoins,
  Headset,
  KeyRound,
  Layers,
  ListChecks,
  LockOpen,
  Magnet,
  Mail,
  MailPlus,
  Mails,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  MessagesSquare,
  Monitor,
  MousePointer2,
  MousePointerClick,
  Newspaper,
  Phone,
  PhoneCall,
  Play,
  Plug,
  Plus,
  Podcast,
  QrCode,
  Radio,
  Receipt,
  Repeat,
  Rocket,
  RotateCcw,
  Search,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  SquarePlus,
  Star,
  Tag,
  ThumbsDown,
  Ticket,
  TrendingDown,
  TrendingUp,
  Undo2,
  UserPlus,
  Users,
  UsersRound,
  Video,
  Workflow,
  Zap,
  // produtos
  Box,
  Boxes,
  Briefcase,
  Gift,
  Handshake,
  LayoutTemplate,
  MonitorPlay,
  Package,
  Presentation,
  Sheet,
  ShieldCheck,
  Wrench,
  type LucideProps,
} from 'lucide-react'
import brands from './data/brands.json'
import type { IconSpec } from './catalog'

const LUCIDE: Record<string, ComponentType<LucideProps>> = {
  AppWindow,
  Award,
  Barcode,
  Bell,
  BookOpen,
  Bot,
  Calendar,
  CalendarCheck,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleHelp,
  ClipboardList,
  Clock,
  Code,
  CornerUpRight,
  Database,
  Download,
  File,
  FilePen,
  FileText,
  FileUp,
  GitBranch,
  GraduationCap,
  HandCoins,
  Headset,
  KeyRound,
  Layers,
  ListChecks,
  LockOpen,
  Magnet,
  Mail,
  MailPlus,
  Mails,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  MessagesSquare,
  Monitor,
  MousePointer2,
  MousePointerClick,
  Newspaper,
  Phone,
  PhoneCall,
  Play,
  Plug,
  Plus,
  Podcast,
  QrCode,
  Radio,
  Receipt,
  Repeat,
  Rocket,
  RotateCcw,
  Search,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  SquarePlus,
  Star,
  Tag,
  ThumbsDown,
  Ticket,
  TrendingDown,
  TrendingUp,
  Undo2,
  UserPlus,
  Users,
  UsersRound,
  Video,
  Workflow,
  Zap,
  Box,
  Boxes,
  Briefcase,
  Gift,
  Handshake,
  LayoutTemplate,
  MonitorPlay,
  Package,
  Presentation,
  Sheet,
  ShieldCheck,
  Wrench,
}

const BRANDS = brands as Record<string, { hex: string; path: string }>

export function hasLucide(name: string): boolean {
  return name in LUCIDE
}

/** Desenha o ícone de um item (lucide, marca ou sigla) na cor pedida. */
export function Glyph({
  spec,
  size,
  color,
  style,
}: {
  spec: IconSpec
  size: number
  color: string
  style?: CSSProperties
}) {
  if (spec.brand && BRANDS[spec.brand]) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color}
        style={style}
        aria-hidden="true"
      >
        <path d={BRANDS[spec.brand].path} />
      </svg>
    )
  }
  if (spec.mono) {
    const len = spec.mono.length
    const fs = size * (len <= 1 ? 0.95 : len === 2 ? 0.72 : len === 3 ? 0.55 : 0.42)
    return (
      <span
        className="fn-mono"
        style={{ color, fontSize: fs, lineHeight: 1, ...style }}
        aria-hidden="true"
      >
        {spec.mono}
      </span>
    )
  }
  const Comp = (spec.lucide && LUCIDE[spec.lucide]) || Circle
  return <Comp size={size} color={color} strokeWidth={2.2} style={style} aria-hidden="true" />
}
