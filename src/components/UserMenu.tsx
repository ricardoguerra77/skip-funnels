import { useNavigate } from 'react-router-dom'
import { KeyRound, LogOut, Moon, Mouse, Sun } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppearance, type Theme } from '@/hooks/use-appearance'
import { useAuth } from '@/hooks/use-auth'

/** Conta + preferências (as mesmas configurações que o plugin tinha). */
export function UserMenu() {
  const { user, signOut } = useAuth()
  const [appearance, setAppearance] = useAppearance()
  const label = (user?.name as string) || (user?.email as string) || 'Conta'
  const initial = label.trim().charAt(0).toUpperCase() || '?'
  const navigate = useNavigate()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          title={label}
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-sm font-medium">
            {(user?.name as string) || 'Minha conta'}
          </div>
          <div className="truncate text-xs text-muted-foreground">{user?.email as string}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {appearance.theme === 'dark' ? (
            <Moon className="h-3.5 w-3.5" />
          ) : (
            <Sun className="h-3.5 w-3.5" />
          )}{' '}
          Tema
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={appearance.theme}
          onValueChange={(v) => setAppearance({ theme: v as Theme })}
        >
          <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Mouse className="h-3.5 w-3.5" /> Roda do mouse / dois dedos no touchpad
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={appearance.wheelZooms ? 'zoom' : 'pan'}
          onValueChange={(v) => setAppearance({ wheelZooms: v === 'zoom' })}
        >
          <DropdownMenuRadioItem value="pan">Move o canvas (Ctrl dá zoom)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="zoom">Dá zoom</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/autorizacoes')}>
          <KeyRound /> Autorizações (IA)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} className="text-destructive focus:text-destructive">
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
