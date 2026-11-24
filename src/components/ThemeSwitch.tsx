import { Moon, Sun } from 'lucide-react'
import { useAppearance, type Theme } from '@/hooks/use-appearance'

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Tema claro', icon: Sun },
  { value: 'dark', label: 'Tema escuro', icon: Moon },
]

/** Seletor de tema (claro / escuro) para as barras do topo. */
export function ThemeSwitch() {
  const [appearance, setAppearance] = useAppearance()
  return (
    <div className="fn-theme-switch" role="radiogroup" aria-label="Tema">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={appearance.theme === value}
          className={appearance.theme === value ? 'is-on' : undefined}
          title={label}
          onClick={() => setAppearance({ theme: value })}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}
