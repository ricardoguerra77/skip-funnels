import { McpCodeBlock } from './McpCodeBlock'

/** Mesmos cabeçalhos que o hook POST /backend/v1/mcp lê (Authorization é obrigatório). */
const curlWithToken = (url: string, token: string) =>
  [
    `curl -i -X POST "${url}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -H "Accept: application/json, text/event-stream" \\`,
    `  -H "MCP-Protocol-Version: 2025-06-18" \\`,
    `  -H "Authorization: Bearer ${token}" \\`,
    `  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`,
  ].join('\n')

const curlWithoutToken = (url: string) =>
  [
    `curl -i -X POST "${url}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -H "Accept: application/json, text/event-stream" \\`,
    `  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`,
  ].join('\n')

/** Teste com cURL: com o token responde a lista de ferramentas; sem ele, 401. */
export function McpCurlTest({ url, token }: { url: string; token: string }) {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        Com o token, o servidor responde a lista de ferramentas (JSON-RPC). Sem o cabeçalho
        Authorization, ou com um token inválido, a resposta é <code>401 Unauthorized</code>.
      </p>
      <McpCodeBlock code={curlWithToken(url, token)} />
      <p className="text-sm text-muted-foreground">Sem token (deve responder 401):</p>
      <McpCodeBlock code={curlWithoutToken(url)} />
    </div>
  )
}
