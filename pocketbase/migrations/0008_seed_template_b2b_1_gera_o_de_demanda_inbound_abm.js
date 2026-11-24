/// Modelo "B2B 1 — Geração de Demanda (Inbound + ABM)", a partir do funil criado por Edson Muniz.
migrate(
  (app) => {
    const email = 'modelos@funis.goskip.app'
    const owner = app.findAuthRecordByEmail('users', email)
    const name = 'B2B 1 — Geração de Demanda (Inbound + ABM)'
    const content =
      '{\n\t"type": "funil",\n\t"version": 1,\n\t"nodes": [\n\t\t{\n\t\t\t"id": "sec0",\n\t\t\t"type": "section",\n\t\t\t"x": -140,\n\t\t\t"y": -90,\n\t\t\t"data": {\n\t\t\t\t"label": "Atração (ToFU)",\n\t\t\t\t"color": "#3b82f6",\n\t\t\t\t"locked": true\n\t\t\t},\n\t\t\t"w": 650,\n\t\t\t"h": 640\n\t\t},\n\t\t{\n\t\t\t"id": "sec1",\n\t\t\t"type": "section",\n\t\t\t"x": 580,\n\t\t\t"y": -80,\n\t\t\t"data": {\n\t\t\t\t"label": "Nutrição (MoFU)",\n\t\t\t\t"color": "#8b5cf6",\n\t\t\t\t"locked": true\n\t\t\t},\n\t\t\t"w": 1330,\n\t\t\t"h": 650\n\t\t},\n\t\t{\n\t\t\t"id": "sec2",\n\t\t\t"type": "section",\n\t\t\t"x": 1920,\n\t\t\t"y": -80,\n\t\t\t"data": {\n\t\t\t\t"label": "Venda (BoFU)",\n\t\t\t\t"color": "#22c55e"\n\t\t\t},\n\t\t\t"w": 2300,\n\t\t\t"h": 640\n\t\t},\n\t\t{\n\t\t\t"id": "a1",\n\t\t\t"type": "circle",\n\t\t\t"x": -80,\n\t\t\t"y": -10,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:linkedin-ads",\n\t\t\t\t"label": "LinkedIn Ads (ABM)"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a2",\n\t\t\t"type": "circle",\n\t\t\t"x": -80,\n\t\t\t"y": 180,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:seo",\n\t\t\t\t"label": "SEO / Conteúdo de Autoridade"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a3",\n\t\t\t"type": "circle",\n\t\t\t"x": -80,\n\t\t\t"y": 370,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:newsletter",\n\t\t\t\t"label": "Newsletter"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a4",\n\t\t\t"type": "page",\n\t\t\t"x": 250,\n\t\t\t"y": 180,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:blog",\n\t\t\t\t"label": "Blog / Guia do Nicho",\n\t\t\t\t"button": "Ler o material",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a5",\n\t\t\t"type": "page",\n\t\t\t"x": 660,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:captura",\n\t\t\t\t"label": "Captura: Relatório/Benchmark",\n\t\t\t\t"button": "BAIXAR O RELATÓRIO",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a6",\n\t\t\t"type": "circle",\n\t\t\t"x": 990,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:lead",\n\t\t\t\t"label": "Lead Capturado (MQL)"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a7",\n\t\t\t"type": "circle",\n\t\t\t"x": 990,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:crm",\n\t\t\t\t"label": "Lead no CRM + Lead Scoring"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a8",\n\t\t\t"type": "circle",\n\t\t\t"x": 1320,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "messages:sequencia-emails",\n\t\t\t\t"label": "Nurture por E-mail"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a9",\n\t\t\t"type": "page",\n\t\t\t"x": 1650,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:webinar",\n\t\t\t\t"label": "Webinar Educativo",\n\t\t\t\t"button": "ASSISTIR AGORA",\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"showPrice": false\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a10",\n\t\t\t"type": "decision",\n\t\t\t"x": 1980,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:se-ou",\n\t\t\t\t"label": "Engajou com o conteúdo?"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a11",\n\t\t\t"type": "circle",\n\t\t\t"x": 2310,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:recuperacao",\n\t\t\t\t"label": "Reengajar lead frio (90 dias)"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a12",\n\t\t\t"type": "page",\n\t\t\t"x": 2310,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:agendar",\n\t\t\t\t"label": "Agendar Diagnóstico Gratuito",\n\t\t\t\t"button": "AGENDAR",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a13",\n\t\t\t"type": "page",\n\t\t\t"x": 2640,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:reuniao-online",\n\t\t\t\t"label": "Demo / Reunião Técnica",\n\t\t\t\t"button": "ENTRAR NA REUNIÃO",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a14",\n\t\t\t"type": "circle",\n\t\t\t"x": 2970,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:proposta",\n\t\t\t\t"label": "Proposta + Qualificação MEDDIC"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a15",\n\t\t\t"type": "decision",\n\t\t\t"x": 3300,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:se-ou",\n\t\t\t\t"label": "Fechou o contrato?"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a16",\n\t\t\t"type": "circle",\n\t\t\t"x": 3630,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:compra",\n\t\t\t\t"label": "Contrato Assinado"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "a17",\n\t\t\t"type": "circle",\n\t\t\t"x": 3960,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "products:assinatura",\n\t\t\t\t"label": "Assinatura SaaS (MRR)",\n\t\t\t\t"showPrice": true,\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"price": 1997,\n\t\t\t\t"billing": "mensal"\n\t\t\t}\n\t\t}\n\t],\n\t"edges": [\n\t\t{\n\t\t\t"id": "e0",\n\t\t\t"source": "a1",\n\t\t\t"target": "a4",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e1",\n\t\t\t"source": "a2",\n\t\t\t"target": "a4",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e2",\n\t\t\t"source": "a3",\n\t\t\t"target": "a5",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e3",\n\t\t\t"source": "a4",\n\t\t\t"target": "a5",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e4",\n\t\t\t"source": "a5",\n\t\t\t"target": "a6",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l",\n\t\t\t"data": {\n\t\t\t\t"style": "solid"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "e5",\n\t\t\t"source": "a6",\n\t\t\t"target": "a7",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e6",\n\t\t\t"source": "a6",\n\t\t\t"target": "a8",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e7",\n\t\t\t"source": "a8",\n\t\t\t"target": "a9",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e8",\n\t\t\t"source": "a9",\n\t\t\t"target": "a10",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e9",\n\t\t\t"source": "a10",\n\t\t\t"target": "a11",\n\t\t\t"sourceHandle": "no",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e10",\n\t\t\t"source": "a10",\n\t\t\t"target": "a12",\n\t\t\t"sourceHandle": "yes",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e11",\n\t\t\t"source": "a12",\n\t\t\t"target": "a13",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e12",\n\t\t\t"source": "a13",\n\t\t\t"target": "a14",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e13",\n\t\t\t"source": "a14",\n\t\t\t"target": "a15",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e14",\n\t\t\t"source": "a15",\n\t\t\t"target": "a16",\n\t\t\t"sourceHandle": "yes",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e15",\n\t\t\t"source": "a15",\n\t\t\t"target": "a11",\n\t\t\t"sourceHandle": "no",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e16",\n\t\t\t"source": "a16",\n\t\t\t"target": "a17",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t}\n\t]\n}'
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
        { owner: owner.id, name: 'B2B 1 — Geração de Demanda (Inbound + ABM)' },
      )
      for (const row of rows) app.delete(row)
    } catch (err) {}
  },
)
