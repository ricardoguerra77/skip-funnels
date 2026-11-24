import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function copyText(text: string) {
  void navigator.clipboard.writeText(text).then(
    () => toast.success('Copiado'),
    () => toast.error('Não consegui copiar'),
  )
}

/** Bloco de código com botão de copiar. */
export function McpCodeBlock({ code }: { code: string }) {
  return (
    <div className="relative rounded-md border bg-muted/50">
      <pre className="overflow-x-auto p-3 pr-12 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 h-7 w-7"
        title="Copiar"
        aria-label="Copiar"
        onClick={() => copyText(code)}
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
