import { useState, type ReactNode } from 'react'
import { Copy } from 'lucide-react'
import { McpConnect } from '@/components/mcp/McpConnect'
import { copyText } from '@/components/mcp/McpCodeBlock'
import { McpCurlTest } from '@/components/mcp/McpCurlTest'
import { McpTokens } from '@/components/mcp/McpTokens'
import { Button } from '@/components/ui/button'
import { mcpUrl } from '@/services/mcp'

/** Ferramentas expostas pelo servidor (mesmos nomes do hook pocketbase/hooks/mcp.pb.js). */
const TOOLS = [
  {
    name: 'funnels_list',
    description: 'Lista os seus funis, com busca por título e paginação.',
    args: 'search?, page?, perPage? (até 100)',
  },
  {
    name: 'funnels_get',
    description: 'Devolve um funil completo pelo id, com nós e arestas.',
    args: 'id',
  },
  {
    name: 'funnels_create',
    description: 'Cria um funil novo no seu nome a partir de { nodes, edges }.',
    args: 'name, data',
  },
  {
    name: 'funnels_update',
    description: 'Atualiza o nome e/ou o conteúdo de um dos seus funis.',
    args: 'id, name?, data?',
  },
  {
    name: 'teams_list',
    description: 'Lista os times em que você é dono, gerente ou membro.',
    args: '—',
  },
]

const PLACEHOLDER_TOKEN = 'SEU_TOKEN_AQUI'

const Section = ({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) => (
  <section className="grid gap-3 rounded-xl border p-4">
    <div className="grid gap-1">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {children}
  </section>
)

/** Página “Autorizações”: conecta assistentes de IA (servidor MCP) à conta do usuário. */
export default function McpPage() {
  const url = mcpUrl()
  const [token, setToken] = useState<string | null>(null)
  const shownToken = token ?? PLACEHOLDER_TOKEN

  return (
    <div className="mx-auto grid max-w-2xl gap-6 px-4 py-8">
      <h1 className="text-lg font-semibold">Autorizações</h1>
      <p className="text-sm text-muted-foreground">
        Conecte assistentes de IA aos seus dados do Skip Funnels. Cada token age como você: o
        assistente vê e altera apenas os funis e times que você pode acessar.
      </p>

      <Section
        title="URL do servidor"
        description="Endereço do servidor MCP. Use-o no seu cliente de IA, junto com um token."
      >
        <div className="flex gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md border bg-muted/50 px-3 py-2 text-xs">
            {url}
          </code>
          <Button variant="outline" size="sm" onClick={() => copyText(url)}>
            <Copy /> Copiar
          </Button>
        </div>
      </Section>

      <Section
        title="Tokens"
        description="Cada token dá acesso à sua conta. Revogue o que não usa mais."
      >
        <McpTokens onToken={setToken} />
      </Section>

      <Section title="Ferramentas" description="O que o assistente pode fazer depois de conectado.">
        <ul className="grid gap-2">
          {TOOLS.map((tool) => (
            <li key={tool.name} className="rounded-lg border p-3">
              <div className="text-sm font-medium">
                <code>{tool.name}</code>
              </div>
              <div className="text-sm text-muted-foreground">{tool.description}</div>
              <div className="text-xs text-muted-foreground">Argumentos: {tool.args}</div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Como conectar"
        description={
          token
            ? 'Os trechos abaixo já trazem o token que acabou de ser criado.'
            : `Substitua ${PLACEHOLDER_TOKEN} por um token criado acima.`
        }
      >
        <McpConnect url={url} token={shownToken} />
      </Section>

      <Section
        title="Teste com cURL"
        description="Confirme que o servidor responde antes de configurar um cliente."
      >
        <McpCurlTest url={url} token={shownToken} />
      </Section>
    </div>
  )
}
