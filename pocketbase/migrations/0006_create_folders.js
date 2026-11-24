/// Pastas do dono para organizar os funis na galeria.
migrate(
  (app) => {
    const users = '_pb_users_auth_'
    const own = "@request.auth.id != '' && owner = @request.auth.id"
    let folders
    try {
      folders = app.findCollectionByNameOrId('folders')
    } catch {
      folders = new Collection({
        name: 'folders',
        type: 'base',
        listRule: own,
        viewRule: own,
        createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
        updateRule:
          own + " && (@request.body.owner = '' || @request.body.owner = @request.auth.id)",
        deleteRule: own,
        fields: [
          {
            name: 'owner',
            type: 'relation',
            required: true,
            collectionId: users,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'name', type: 'text', required: true, min: 1, max: 80 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_folders_owner_name ON folders (owner, name)'],
      })
      app.save(folders)
      folders = app.findCollectionByNameOrId('folders')
    }

    const funnels = app.findCollectionByNameOrId('funnels')
    if (!funnels.fields.getByName('folder')) {
      funnels.fields.add(
        new RelationField({
          name: 'folder',
          collectionId: folders.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
      funnels.addIndex('idx_funnels_folder', false, 'folder', '')
      app.save(funnels)
    }
  },
  (app) => {
    const funnels = app.findCollectionByNameOrId('funnels')
    if (funnels.fields.getByName('folder')) {
      funnels.removeIndex('idx_funnels_folder')
      funnels.fields.removeByName('folder')
      app.save(funnels)
    }
    try {
      app.delete(app.findCollectionByNameOrId('folders'))
    } catch {
      /* a coleção já não existe */
    }
  },
)
