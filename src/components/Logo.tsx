import { LOGO_INNER } from '@/brand/logoMarkup'

/** Marca completa (símbolo roxo + SKIP FUNNELS) ou só o símbolo. O nome segue a cor do texto. */
export function Logo({
  variant = 'lockup',
  className,
}: {
  variant?: 'lockup' | 'mark'
  className?: string
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={variant === 'mark' ? '-16 -12 332 300' : '0 0 1077.66 379'}
      className={className ? `inline-block ${className}` : 'inline-block'}
      role="img"
      aria-label="Skip Funnels"
      dangerouslySetInnerHTML={{ __html: LOGO_INNER }}
    />
  )
}
