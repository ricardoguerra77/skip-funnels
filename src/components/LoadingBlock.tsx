/** Esqueleto exibido enquanto uma tela ou lista ainda está carregando. */
export function LoadingBlock({
  variant = 'page',
  label = 'Carregando',
}: {
  variant?: 'page' | 'canvas' | 'list' | 'rows'
  label?: string
}) {
  if (variant === 'canvas') {
    return (
      <div className="fn-skel-canvas" role="status" aria-label={label}>
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="fn-skel fn-skel-node" />
        ))}
      </div>
    )
  }
  if (variant === 'rows') {
    return (
      <div className="fn-skel-rows" role="status" aria-label={label}>
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className="fn-skel fn-skel-row" />
        ))}
      </div>
    )
  }
  if (variant === 'list') {
    return (
      <div className="fn-skel-list" role="status" aria-label={label}>
        <span className="fn-skel fn-skel-line is-title" />
        <span className="fn-skel fn-skel-line is-short" />
        <span className="fn-skel fn-skel-row" />
        <span className="fn-skel fn-skel-row" />
        <span className="fn-skel fn-skel-row" />
      </div>
    )
  }
  return (
    <div className="fn-skel-page" role="status" aria-label={label}>
      <span className="fn-skel fn-skel-line is-title" />
      <div className="fn-skel-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="fn-skel fn-skel-card" />
        ))}
      </div>
    </div>
  )
}
