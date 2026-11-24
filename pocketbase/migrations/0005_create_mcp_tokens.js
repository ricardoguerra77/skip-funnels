/// Tokens pessoais do servidor MCP. Só o hash (SHA-256) e o prefixo são guardados;
/// o token completo é devolvido uma única vez pela rota POST /backend/v1/mcp-tokens.
migrate(
  (app) => {
    const collection = new Collection({
      name: 'mcp_tokens',
      type: 'base',
      listRule: "@request.auth.id != '' && owner = @request.auth.id",
      viewRule: "@request.auth.id != '' && owner = @request.auth.id",
      createRule: null,
      updateRule: null,
      deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
      fields: [
        {
          name: 'owner',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true, max: 100 },
        { name: 'token_hash', type: 'text', required: true, hidden: true, max: 128 },
        { name: 'token_prefix', type: 'text', required: true, max: 20 },
        { name: 'last_used_at', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_mcp_tokens_hash ON mcp_tokens (token_hash)',
        'CREATE INDEX idx_mcp_tokens_owner ON mcp_tokens (owner)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('mcp_tokens'))
  },
)
