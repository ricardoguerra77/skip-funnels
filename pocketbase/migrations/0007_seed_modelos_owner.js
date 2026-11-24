/// Conta técnica que só existe para ser dona dos modelos compartilhados.
migrate(
  (app) => {
    const email = 'modelos@funis.goskip.app'
    const users = app.findCollectionByNameOrId('users')
    let owner
    try {
      owner = app.findAuthRecordByEmail('users', email)
    } catch (err) {
      owner = new Record(users)
      owner.setEmail(email)
      owner.setPassword('iV3uvdngtu9WoFuGIbiM5_naPZ0YzmZm')
      owner.setVerified(true)
      owner.set('name', 'Modelos')
      app.save(owner)
    }
    const funnelsCol = app.findCollectionByNameOrId('funnels')
    const bodiesCol = app.findCollectionByNameOrId('funnel_bodies')
    const clause = "is_template = true && owner.email = '" + email + "' && @request.auth.id != ''"
    if ((funnelsCol.listRule || '').indexOf(email) < 0) {
      funnelsCol.listRule = '(' + funnelsCol.listRule + ') || (' + clause + ')'
      funnelsCol.viewRule = '(' + funnelsCol.viewRule + ') || (' + clause + ')'
      app.save(funnelsCol)
    }
    const bodyClause =
      "funnel.is_template = true && funnel.owner.email = '" + email + "' && @request.auth.id != ''"
    if ((bodiesCol.listRule || '').indexOf(email) < 0) {
      bodiesCol.listRule = '(' + bodiesCol.listRule + ') || (' + bodyClause + ')'
      bodiesCol.viewRule = '(' + bodiesCol.viewRule + ') || (' + bodyClause + ')'
      app.save(bodiesCol)
    }
  },
  (app) => {
    const email = 'modelos@funis.goskip.app'
    const unwrap = (rule, marker) => {
      const text = rule || ''
      const at = text.indexOf(marker)
      if (at < 0) return text
      let head = text.slice(0, at)
      if (head.charAt(0) === '(' && head.charAt(head.length - 1) === ')') head = head.slice(1, -1)
      return head
    }
    const funnelsCol = app.findCollectionByNameOrId('funnels')
    const bodiesCol = app.findCollectionByNameOrId('funnel_bodies')
    if ((funnelsCol.listRule || '').indexOf(email) >= 0) {
      const marker = " || (is_template = true && owner.email = '" + email + "'"
      funnelsCol.listRule = unwrap(funnelsCol.listRule, marker)
      funnelsCol.viewRule = unwrap(funnelsCol.viewRule, marker)
      app.save(funnelsCol)
    }
    if ((bodiesCol.listRule || '').indexOf(email) >= 0) {
      const marker = " || (funnel.is_template = true && funnel.owner.email = '" + email + "'"
      bodiesCol.listRule = unwrap(bodiesCol.listRule, marker)
      bodiesCol.viewRule = unwrap(bodiesCol.viewRule, marker)
      app.save(bodiesCol)
    }
    try {
      const owner = app.findAuthRecordByEmail('users', email)
      const funnels = app.findRecordsByFilter('funnels', 'owner = {:owner}', '', 50, 0, {
        owner: owner.id,
      })
      for (const funnel of funnels) app.delete(funnel)
      app.delete(owner)
    } catch (err) {}
  },
)
