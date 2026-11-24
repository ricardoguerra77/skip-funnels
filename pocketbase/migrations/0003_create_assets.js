migrate(
  (app) => {
    const collection = new Collection({
      name: 'assets',
      type: 'base',
      listRule: "@request.auth.id != '' && owner = @request.auth.id",
      viewRule: "@request.auth.id != '' && owner = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && owner = @request.auth.id && (@request.body.owner = '' || @request.body.owner = @request.auth.id)",
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
        { name: 'file', type: 'file', required: true, maxSelect: 1, maxSize: 52428800 },
        { name: 'name', type: 'text', required: true, max: 255 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_assets_owner ON assets (owner)'],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('assets'))
  },
)
