import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ThemeSwitch } from '@/components/ThemeSwitch'
import { UserMenu } from '@/components/UserMenu'
import { Logo } from '@/components/Logo'
import { useAuth } from '@/hooks/use-auth'

/**
 * Marca do cabeçalho: a logo do Skip Funnels volta sempre para a galeria (rota "/").
 */
export function AppBrand() {
  return (
    <Link
      to="/"
      className="-ml-1 inline-flex shrink-0 items-center rounded-md px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title="Skip Funnels"
    >
      {/* cor da marca: a mesma que a barra da galeria usava antes do header
          global existir — var(--text-normal) de theme.css (#1f2430 claro /
          #e6e6ea escuro), não o --foreground do Tailwind (mais escuro/azulado) */}
      <Logo className="h-8 w-auto text-[color:var(--text-normal)]" />
      <span className="sr-only">Skip Funnels — voltar para a galeria</span>
    </Link>
  )
}

/**
 * Controles de conta que devem existir em todas as telas: tema + menu do
 * usuário (que inclui a página Autorizações).
 */
export function AppTools() {
  const { isAuthenticated } = useAuth()
  return (
    <>
      <ThemeSwitch />
      {isAuthenticated && <UserMenu />}
    </>
  )
}

/**
 * Cabeçalho global do app, presente em todas as páginas: logo à esquerda
 * (volta para a galeria) e perfil/tema à direita.
 */
export function AppHeader() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background px-3">
      <AppBrand />
      {!onHome && (
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft size={16} /> Funis
        </Link>
      )}
      <div className="ml-auto flex items-center gap-1.5">
        <AppTools />
      </div>
    </header>
  )
}
