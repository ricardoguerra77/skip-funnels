/// Servidor MCP (JSON-RPC 2.0 sobre HTTP) e emissão de tokens pessoais.
/// O token age como o dono: todas as leituras e escritas são filtradas pelo owner.
/// Os helpers ficam DENTRO de cada callback: o JSVM executa callbacks em outro pool de VMs,
/// então declarações de topo não são acessíveis em runtime.

routerAdd('POST', '/backend/v1/mcp-tokens', (e) => {
  const tokenHash = (token) => $security.sha256(token)

  if (!e.auth) return e.json(401, { message: 'Entre na sua conta para criar um token' })
  const body = e.requestInfo().body || {}
  const name = String(body.name || '')
    .trim()
    .slice(0, 100)
  if (!name) return e.json(400, { message: 'Dê um nome ao token' })
  const token = 'skf_' + $security.randomString(43)
  const col = $app.findCollectionByNameOrId('mcp_tokens')
  const rec = new Record(col)
  rec.set('owner', e.auth.id)
  rec.set('name', name)
  rec.set('token_hash', tokenHash(token))
  rec.set('token_prefix', token.slice(0, 8))
  $app.save(rec)
  return e.json(200, { id: rec.id, name: name, token: token })
})

routerAdd('POST', '/backend/v1/mcp', (e) => {
  const MCP_PROTOCOL = '2025-06-18'
  const MCP_SERVER = { name: 'skip-funnels', version: '1.0.0' }

  const tokenHash = (token) => $security.sha256(token)

  /** Devolve o id do dono do token Bearer válido, ou null. Atualiza last_used_at. */
  const authFromBearer = () => {
    const header = e.request.header.get('Authorization') || ''
    const m = /^Bearer\s+(\S+)$/i.exec(header)
    if (!m) return null
    let record
    try {
      record = $app.findFirstRecordByFilter('mcp_tokens', 'token_hash = {:h}', {
        h: tokenHash(m[1]),
      })
    } catch (_) {
      return null
    }
    record.set('last_used_at', new Date().toISOString())
    $app.save(record)
    return record.getString('owner')
  }

  const ownFunnel = (uid, id) => {
    const rec = $app.findRecordById('funnels', id)
    if (rec.getString('owner') !== uid) throw new Error('Funil não encontrado')
    return rec
  }

  /** Normaliza o JSON do funil como o parseFile do app: só nós/arestas válidos. */
  const normalizeFunnel = (raw) => {
    if (!raw || typeof raw !== 'object') throw new Error('data precisa ser um objeto')
    const nodes = Array.isArray(raw.nodes) ? raw.nodes.filter((n) => n && n.id && n.type) : []
    const ids = new Set(nodes.map((n) => n.id))
    const edges = Array.isArray(raw.edges)
      ? raw.edges.filter((x) => x && x.id && ids.has(x.source) && ids.has(x.target))
      : []
    return { type: 'funil', version: 1, nodes: nodes, edges: edges }
  }

  const parseContent = (text) => {
    if (!text) return { type: 'funil', version: 1, nodes: [], edges: [] }
    try {
      return JSON.parse(text)
    } catch (_) {
      return text
    }
  }

  const funnelSummary = (rec) => ({
    id: rec.id,
    name: rec.getString('name'),
    is_template: rec.getBool('is_template'),
    visibility: rec.getString('visibility') || 'private',
    updated: rec.getString('updated'),
  })

  const TOOL_IMPLS = {
    funnels_list(uid, args) {
      const perPage = Math.min(Math.max(parseInt(args.perPage || 20, 10) || 20, 1), 100)
      const page = Math.max(parseInt(args.page || 1, 10) || 1, 1)
      let filter = 'owner = {:uid}'
      const params = { uid: uid, q: String(args.search || '') }
      if (params.q) filter += ' && name ~ {:q}'
      const rows = $app.findRecordsByFilter(
        'funnels',
        filter,
        '-updated',
        perPage,
        (page - 1) * perPage,
        params,
      )
      return { page: page, perPage: perPage, items: rows.map(funnelSummary) }
    },

    funnels_get(uid, args) {
      const rec = ownFunnel(uid, String(args.id || ''))
      return Object.assign(funnelSummary(rec), { data: parseContent(rec.getString('content')) })
    },

    funnels_create(uid, args) {
      const name = String(args.name || '').trim()
      if (!name) throw new Error('Informe um nome para o funil')
      const data = normalizeFunnel(args.data)
      const text = JSON.stringify(data, null, '\t')
      const col = $app.findCollectionByNameOrId('funnels')
      const rec = new Record(col)
      rec.set('owner', uid)
      rec.set('name', name.slice(0, 200))
      rec.set('content', text)
      rec.set('is_template', false)
      $app.save(rec)
      const bodyCol = $app.findCollectionByNameOrId('funnel_bodies')
      const body = new Record(bodyCol)
      body.set('funnel', rec.id)
      body.set('name', rec.getString('name'))
      body.set('content', text)
      $app.save(body)
      return Object.assign(funnelSummary(rec), { data: data })
    },

    funnels_update(uid, args) {
      const rec = ownFunnel(uid, String(args.id || ''))
      const text = {}
      if (args.name !== undefined) {
        const name = String(args.name).trim()
        if (!name) throw new Error('O nome não pode ficar vazio')
        rec.set('name', name.slice(0, 200))
      }
      if (args.data !== undefined) {
        text.content = JSON.stringify(normalizeFunnel(args.data), null, '\t')
        rec.set('content', text.content)
      }
      $app.save(rec)
      let body = null
      try {
        body = $app.findFirstRecordByFilter('funnel_bodies', 'funnel = {:id}', { id: rec.id })
      } catch (_) {
        body = new Record($app.findCollectionByNameOrId('funnel_bodies'))
        body.set('funnel', rec.id)
      }
      body.set('name', rec.getString('name'))
      if (text.content !== undefined) body.set('content', text.content)
      else if (!body.getString('content')) body.set('content', rec.getString('content'))
      $app.save(body)
      return Object.assign(funnelSummary(rec), { data: parseContent(rec.getString('content')) })
    },

    teams_list(uid) {
      const rows = $app.findRecordsByFilter(
        'teams',
        'owner = {:uid} || managers ?= {:uid} || members ?= {:uid}',
        '-updated',
        100,
        0,
        { uid: uid },
      )
      return rows.map((t) => ({
        id: t.id,
        name: t.getString('name'),
        role: t.getString('owner') === uid ? 'owner' : 'member',
        updated: t.getString('updated'),
      }))
    },
  }

  const TOOLS = [
    {
      name: 'funnels_list',
      description: 'Lista os seus funis (busca por título, paginação).',
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Trecho do título' },
          page: { type: 'number' },
          perPage: { type: 'number', description: 'Até 100' },
        },
      },
    },
    {
      name: 'funnels_get',
      description: 'Devolve um funil completo por id (nós e arestas em data).',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
    {
      name: 'funnels_create',
      description:
        'Cria um funil novo no seu nome. data = { nodes: [...], edges: [...] } no formato do arquivo .funil.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          data: { type: 'object', description: 'Conteúdo do funil: { nodes, edges }' },
        },
        required: ['name', 'data'],
      },
    },
    {
      name: 'funnels_update',
      description: 'Atualiza o nome e/ou o conteúdo (data) de um dos seus funis.',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          data: { type: 'object', description: 'Conteúdo do funil: { nodes, edges }' },
        },
        required: ['id'],
      },
    },
    {
      name: 'teams_list',
      description: 'Lista os times em que você é dono, gerente ou membro.',
      inputSchema: { type: 'object', properties: {} },
    },
  ]

  const rpcResult = (id, result) => ({ jsonrpc: '2.0', id: id, result: result })

  const rpcError = (id, code, message) => ({
    jsonrpc: '2.0',
    id: id === undefined ? null : id,
    error: { code: code, message: message },
  })

  const handleRpc = (uid, msg) => {
    const id = msg.id
    const params = msg.params || {}
    switch (msg.method) {
      case 'initialize':
        return rpcResult(id, {
          protocolVersion: MCP_PROTOCOL,
          capabilities: { tools: {} },
          serverInfo: MCP_SERVER,
        })
      case 'ping':
        return rpcResult(id, {})
      case 'tools/list':
        return rpcResult(id, { tools: TOOLS })
      case 'tools/call': {
        const name = params.name
        const args = params.arguments || {}
        const impl = TOOL_IMPLS[name]
        if (!impl || !TOOLS.some((t) => t.name === name)) {
          return rpcError(id, -32602, 'Ferramenta desconhecida: ' + name)
        }
        try {
          const out = impl(uid, args)
          return rpcResult(id, {
            content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
            isError: false,
          })
        } catch (err) {
          return rpcResult(id, {
            content: [{ type: 'text', text: String((err && err.message) || err) }],
            isError: true,
          })
        }
      }
      default:
        return rpcError(id, -32601, 'Método não suportado: ' + msg.method)
    }
  }

  const uid = authFromBearer()
  if (!uid) {
    e.response.header().set('WWW-Authenticate', 'Bearer realm="skip-funnels-mcp"')
    return e.json(401, { error: 'unauthorized', message: 'Token MCP ausente ou inválido' })
  }
  const msg = e.requestInfo().body || {}
  // notificações (sem id) não têm resposta
  if (msg.id === undefined && String(msg.method || '').indexOf('notifications/') === 0) {
    return e.noContent(202)
  }
  if (!msg.method) return e.json(400, rpcError(msg.id, -32600, 'Requisição inválida'))
  return e.json(200, handleRpc(uid, msg))
})
