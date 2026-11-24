/// Modelo "B2B 2 — Product-Led Growth (Trial + Sales-Assist)", a partir do funil criado por Edson Muniz.
migrate(
  (app) => {
    const email = 'modelos@funis.goskip.app'
    const owner = app.findAuthRecordByEmail('users', email)
    const name = 'B2B 2 — Product-Led Growth (Trial + Sales-Assist)'
    const content =
      '{"type": "funil", "version": 1, "nodes": [{"id": "b1", "type": "circle", "x": 0, "y": 0, "data": {"ref": "traffic:google-ads", "label": "Google Ads (Intenção)"}}, {"id": "b2", "type": "circle", "x": 0, "y": 190, "data": {"ref": "traffic:seo", "label": "SEO / Comparativos"}}, {"id": "b3", "type": "circle", "x": 0, "y": 380, "data": {"ref": "traffic:indicacao", "label": "Programa de Indicação"}}, {"id": "b4", "type": "page", "x": 330, "y": 190, "data": {"ref": "pages:captura", "label": "Signup Free (Self-Serve)", "button": "CRIAR CONTA GRÁTIS", "currency": "BRL"}}, {"id": "b5", "type": "circle", "x": 660, "y": 190, "data": {"ref": "events:cadastro", "label": "Conta Criada"}}, {"id": "b6", "type": "circle", "x": 990, "y": 190, "data": {"ref": "events:app", "label": "Onboarding no Produto"}}, {"id": "b7", "type": "decision", "x": 1320, "y": 190, "data": {"ref": "events:se-ou", "label": "Ativou (Aha Moment)?"}}, {"id": "b8", "type": "circle", "x": 1650, "y": 380, "data": {"ref": "messages:sequencia-emails", "label": "E-mails de Ativação"}}, {"id": "b9", "type": "circle", "x": 1980, "y": 380, "data": {"ref": "messages:suporte", "label": "Sales-Assist / CSM outreach"}}, {"id": "b10", "type": "decision", "x": 1650, "y": 190, "data": {"ref": "events:se-ou", "label": "Bateu o limite do Free?"}}, {"id": "b11", "type": "page", "x": 1980, "y": 0, "data": {"ref": "pages:checkout", "label": "Upgrade Self-Serve", "button": "FAZER UPGRADE", "currency": "BRL", "billing": "mensal", "showPrice": true, "price": 149}}, {"id": "b12", "type": "circle", "x": 2310, "y": 0, "data": {"ref": "products:saas", "label": "Plano Pago (SaaS)", "showPrice": true, "currency": "BRL", "price": 149, "billing": "mensal"}}, {"id": "b13", "type": "circle", "x": 2640, "y": 0, "data": {"ref": "events:compra", "label": "Upgrade Convertido"}}, {"id": "b14", "type": "circle", "x": 2310, "y": 190, "data": {"ref": "messages:email", "label": "Nudges de Uso / Upgrade"}}, {"id": "b15", "type": "circle", "x": 2970, "y": 0, "data": {"ref": "events:crm", "label": "Conta Qualificada (NRR/Expansão)"}}, {"id": "b16", "type": "circle", "x": 3300, "y": 0, "data": {"ref": "products:assinatura", "label": "Expansão de Assentos / Upsell", "showPrice": true, "currency": "BRL", "price": 497, "billing": "mensal"}}, {"id": "sec0", "type": "section", "x": -60, "y": -80, "data": {"label": "Aquisição", "color": "#3b82f6"}, "w": 650, "h": 640}, {"id": "sec1", "type": "section", "x": 600, "y": 110, "data": {"label": "Ativação", "color": "#f59e0b"}, "w": 1970, "h": 450}, {"id": "sec2", "type": "section", "x": 1920, "y": -80, "data": {"label": "Monetização & Expansão", "color": "#22c55e"}, "w": 1640, "h": 260}], "edges": [{"id": "e0", "source": "b1", "target": "b4", "sourceHandle": "r", "targetHandle": "l"}, {"id": "e1", "source": "b2", "target": "b4", "sourceHandle": "r", "targetHandle": "l"}, {"id": "e2", "source": "b3", "target": "b4", "sourceHandle": "r", "targetHandle": "l"}, {"id": "e3", "source": "b4", "target": "b5", "sourceHandle": "r", "targetHandle": "l"}, {"id": "e4", "source": "b5", "target": "b6", "sourceHandle": "r", "targetHandle": "l"}, {"id": "e5", "source": "b6", "target": "b7", "sourceHandle": "r", "targetHandle": "l"}, {"id": "e6", "source": "b7", "target": "b8", "sourceHandle": "no", "targetHandle": "l"}, {"id": "e7", "source": "b8", "target": "b9", "sourceHandle": "r", "targetHandle": "l"}, {"id": "e8", "source": "b9", "target": "b10", "sourceHandle": "r", "targetHandle": "l"}, {"id": "e9", "source": "b7", "target": "b10", "sourceHandle": "yes", "targetHandle": "l"}, {"id": "e10", "source": "b10", "target": "b11", "sourceHandle": "yes", "targetHandle": "l"}, {"id": "e11", "source": "b11", "target": "b12", "sourceHandle": "r", "targetHandle": "l"}, {"id": "e12", "source": "b12", "target": "b13", "sourceHandle": "r", "targetHandle": "l"}, {"id": "e13", "source": "b13", "target": "b15", "sourceHandle": "r", "targetHandle": "l"}, {"id": "e14", "source": "b15", "target": "b16", "sourceHandle": "r", "targetHandle": "l"}, {"id": "e15", "source": "b10", "target": "b14", "sourceHandle": "no", "targetHandle": "l"}]}'
    const existing = app.findRecordsByFilter(
      'funnels',
      'owner = {:owner} && name = {:name} && is_template = true',
      '',
      1,
      0,
      { owner: owner.id, name: name },
    )
    if (existing.length) return
    const funnelsCol = app.findCollectionByNameOrId('funnels')
    const bodiesCol = app.findCollectionByNameOrId('funnel_bodies')
    const funnel = new Record(funnelsCol)
    funnel.set('owner', owner.id)
    funnel.set('name', name)
    funnel.set('content', content)
    funnel.set('is_template', true)
    app.save(funnel)
    const body = new Record(bodiesCol)
    body.set('funnel', funnel.id)
    body.set('name', name)
    body.set('content', content)
    app.save(body)
  },
  (app) => {
    try {
      const owner = app.findAuthRecordByEmail('users', 'modelos@funis.goskip.app')
      const rows = app.findRecordsByFilter(
        'funnels',
        'owner = {:owner} && name = {:name} && is_template = true',
        '',
        5,
        0,
        { owner: owner.id, name: 'B2B 2 — Product-Led Growth (Trial + Sales-Assist)' },
      )
      for (const row of rows) app.delete(row)
    } catch (err) {}
  },
)
