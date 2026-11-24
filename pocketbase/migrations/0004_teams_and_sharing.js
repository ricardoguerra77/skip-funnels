/// Times, convites e publicação de funil (público ou para pessoas do time).
migrate(
  (app) => {
    const users = '_pb_users_auth_'

    const teams = new Collection({
      name: 'teams',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (owner = @request.auth.id || managers ?= @request.auth.id || members ?= @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (owner = @request.auth.id || managers ?= @request.auth.id || members ?= @request.auth.id)",
      createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && owner = @request.auth.id && (@request.body.owner = '' || @request.body.owner = @request.auth.id)",
      deleteRule: "@request.auth.id != '' && owner = @request.auth.id",
      fields: [
        {
          name: 'owner',
          type: 'relation',
          required: true,
          collectionId: users,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true, max: 120 },
        { name: 'members', type: 'relation', collectionId: users, maxSelect: 50 },
        { name: 'managers', type: 'relation', collectionId: users, maxSelect: 50 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(teams)

    const members = new Collection({
      name: 'team_members',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (user = @request.auth.id || email = @request.auth.email || team.owner = @request.auth.id || team.managers ?= @request.auth.id || team.members ?= @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (user = @request.auth.id || email = @request.auth.email || team.owner = @request.auth.id || team.managers ?= @request.auth.id || team.members ?= @request.auth.id)",
      createRule:
        "@request.auth.id != '' && @request.body.status = 'pending' && @request.body.user = '' && (team.owner = @request.auth.id || (team.managers ?= @request.auth.id && @request.body.role != 'admin'))",
      updateRule:
        "@request.auth.id != '' && @request.body.team = team && @request.body.email = email && ((status = 'pending' && email = @request.auth.email && @request.body.user = @request.auth.id && @request.body.status = 'active' && @request.body.role = role) || (team.owner = @request.auth.id) || (team.managers ?= @request.auth.id && role != 'admin' && @request.body.role != 'admin' && @request.body.user = user))",
      deleteRule:
        "@request.auth.id != '' && (team.owner = @request.auth.id || (team.managers ?= @request.auth.id && role != 'admin'))",
      fields: [
        {
          name: 'team',
          type: 'relation',
          required: true,
          collectionId: teams.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'email', type: 'email', required: true },
        { name: 'user', type: 'relation', collectionId: users, maxSelect: 1 },
        {
          name: 'role',
          type: 'select',
          required: true,
          values: ['viewer', 'editor', 'admin'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pending', 'active'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_team_members_team_email ON team_members (team, email)'],
    })
    app.save(members)

    const teamCol = app.findCollectionByNameOrId('teams')
    const withMembers =
      "@request.auth.id != '' && (owner = @request.auth.id || managers ?= @request.auth.id || members ?= @request.auth.id)"
    teamCol.listRule = withMembers
    teamCol.viewRule = withMembers
    app.save(teamCol)

    const funnels = app.findCollectionByNameOrId('funnels')
    funnels.fields.add(
      new SelectField({
        name: 'visibility',
        values: ['private', 'public', 'team'],
        maxSelect: 1,
      }),
    )
    funnels.fields.add(new TextField({ name: 'share_token', max: 40 }))
    funnels.fields.add(new RelationField({ name: 'viewers', collectionId: users, maxSelect: 50 }))
    funnels.fields.add(new RelationField({ name: 'editors', collectionId: users, maxSelect: 50 }))
    const read =
      "(@request.auth.id != '' && owner = @request.auth.id) || (@request.auth.id != '' && visibility = 'team' && (editors ?= @request.auth.id || viewers ?= @request.auth.id)) || (visibility = 'public' && share_token != '' && share_token = @request.query.share) || (visibility = 'team' && share_token != '' && share_token = @request.query.share && @request.auth.id != '' && (owner = @request.auth.id || editors ?= @request.auth.id || viewers ?= @request.auth.id))"
    funnels.listRule = read
    funnels.viewRule = read
    funnels.updateRule =
      "@request.auth.id != '' && owner = @request.auth.id && (@request.body.owner = '' || @request.body.owner = @request.auth.id)"
    funnels.addIndex('idx_funnels_share_token', true, 'share_token', "share_token != ''")
    app.save(funnels)
    const bodyRead =
      "(@request.auth.id != '' && funnel.owner = @request.auth.id) || (@request.auth.id != '' && funnel.visibility = 'team' && (funnel.editors ?= @request.auth.id || funnel.viewers ?= @request.auth.id)) || (funnel.visibility = 'public' && funnel.share_token != '' && funnel.share_token = @request.query.share) || (funnel.visibility = 'team' && funnel.share_token != '' && funnel.share_token = @request.query.share && @request.auth.id != '' && (funnel.owner = @request.auth.id || funnel.editors ?= @request.auth.id || funnel.viewers ?= @request.auth.id))"
    const bodyWrite =
      "@request.auth.id != '' && (funnel.owner = @request.auth.id || (funnel.visibility = 'team' && funnel.editors ?= @request.auth.id))"
    const bodies = new Collection({
      name: 'funnel_bodies',
      type: 'base',
      listRule: bodyRead,
      viewRule: bodyRead,
      createRule: bodyWrite,
      updateRule: bodyWrite + ' && @request.body.funnel = funnel',
      deleteRule: "@request.auth.id != '' && funnel.owner = @request.auth.id",
      fields: [
        {
          name: 'funnel',
          type: 'relation',
          required: true,
          collectionId: funnels.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true, max: 200 },
        { name: 'content', type: 'text', max: 10000000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_funnel_bodies_funnel ON funnel_bodies (funnel)'],
    })
    app.save(bodies)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('funnel_bodies'))
    app.delete(app.findCollectionByNameOrId('team_members'))
    app.delete(app.findCollectionByNameOrId('teams'))
    const funnels = app.findCollectionByNameOrId('funnels')
    funnels.removeIndex('idx_funnels_share_token')
    funnels.fields.removeByName('editors')
    funnels.fields.removeByName('viewers')
    funnels.fields.removeByName('share_token')
    funnels.fields.removeByName('visibility')
    const own = "@request.auth.id != '' && owner = @request.auth.id"
    funnels.listRule = own
    funnels.viewRule = own
    funnels.updateRule =
      "@request.auth.id != '' && owner = @request.auth.id && (@request.body.owner = '' || @request.body.owner = @request.auth.id)"
    app.save(funnels)
  },
)
