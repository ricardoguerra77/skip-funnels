import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { McpCodeBlock } from './McpCodeBlock'

interface Snippet {
  id: string
  label: string
  hint: string
  code: string
}

const buildSnippets = (url: string, token: string): Snippet[] => {
  const bearer = `Bearer ${token}`
  return [
    {
      id: 'maestro',
      label: 'Maestro',
      hint: 'Em qualquer cliente que aceite servidor MCP por HTTP (Streamable HTTP), use a URL e o cabeçalho abaixo.',
      code: `URL: ${url}\nTransporte: HTTP (Streamable HTTP)\nCabeçalho: Authorization: ${bearer}`,
    },
    {
      id: 'claude-code',
      label: 'Claude Code',
      hint: 'Rode no terminal para registrar o servidor.',
      code: `claude mcp add --transport http skip-funnels ${url} --header "Authorization: ${bearer}"`,
    },
    {
      id: 'cursor',
      label: 'Cursor',
      hint: 'Adicione em ~/.cursor/mcp.json (ou .cursor/mcp.json no projeto).',
      code: JSON.stringify(
        {
          mcpServers: {
            'skip-funnels': { url, headers: { Authorization: bearer } },
          },
        },
        null,
        2,
      ),
    },
    {
      id: 'vscode',
      label: 'VS Code',
      hint: 'Adicione em .vscode/mcp.json do projeto.',
      code: JSON.stringify(
        {
          servers: {
            'skip-funnels': { type: 'http', url, headers: { Authorization: bearer } },
          },
        },
        null,
        2,
      ),
    },
    {
      id: 'claude-desktop',
      label: 'Claude Desktop',
      hint: 'Em claude_desktop_config.json (exige Node.js instalado, usa o pacote mcp-remote).',
      code: JSON.stringify(
        {
          mcpServers: {
            'skip-funnels': {
              command: 'npx',
              args: ['mcp-remote', url, '--header', `Authorization: ${bearer}`],
            },
          },
        },
        null,
        2,
      ),
    },
  ]
}

/** Abas com os snippets de configuração de cada cliente. */
export function McpConnect({ url, token }: { url: string; token: string }) {
  const snippets = buildSnippets(url, token)
  const [active, setActive] = useState(snippets[0].id)
  return (
    <Tabs value={active} onValueChange={setActive} className="grid gap-3">
      <TabsList className="flex h-auto flex-wrap justify-start">
        {snippets.map((s) => (
          <TabsTrigger key={s.id} value={s.id}>
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {snippets.map((s) => (
        <TabsContent key={s.id} value={s.id} className="grid gap-2">
          <p className="text-sm text-muted-foreground">{s.hint}</p>
          <McpCodeBlock code={s.code} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
