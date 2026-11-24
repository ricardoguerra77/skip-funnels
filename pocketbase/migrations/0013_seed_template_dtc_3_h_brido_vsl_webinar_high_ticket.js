/// Modelo "DTC 3 — Híbrido VSL + Webinar (High Ticket)", a partir do funil criado por Edson Muniz.
migrate(
  (app) => {
    const email = 'modelos@funis.goskip.app'
    const owner = app.findAuthRecordByEmail('users', email)
    const name = 'DTC 3 — Híbrido VSL + Webinar (High Ticket)'
    const content =
      '{\n\t"type": "funil",\n\t"version": 1,\n\t"nodes": [\n\t\t{\n\t\t\t"id": "sec0",\n\t\t\t"type": "section",\n\t\t\t"x": -60,\n\t\t\t"y": -80,\n\t\t\t"data": {\n\t\t\t\t"label": "Captura & Qualificação",\n\t\t\t\t"color": "#3b82f6"\n\t\t\t},\n\t\t\t"w": 1310,\n\t\t\t"h": 640\n\t\t},\n\t\t{\n\t\t\t"id": "sec1",\n\t\t\t"type": "section",\n\t\t\t"x": 1260,\n\t\t\t"y": 110,\n\t\t\t"data": {\n\t\t\t\t"label": "Educação & Confiança",\n\t\t\t\t"color": "#8b5cf6"\n\t\t\t},\n\t\t\t"w": 980,\n\t\t\t"h": 450\n\t\t},\n\t\t{\n\t\t\t"id": "sec2",\n\t\t\t"type": "section",\n\t\t\t"x": 1260,\n\t\t\t"y": -80,\n\t\t\t"data": {\n\t\t\t\t"label": "Fechamento (High Ticket)",\n\t\t\t\t"color": "#22c55e"\n\t\t\t},\n\t\t\t"w": 2630,\n\t\t\t"h": 450\n\t\t},\n\t\t{\n\t\t\t"id": "h1",\n\t\t\t"type": "circle",\n\t\t\t"x": 0,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:meta-ads",\n\t\t\t\t"label": "Meta Ads"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h2",\n\t\t\t"type": "circle",\n\t\t\t"x": 0,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:youtube-ads",\n\t\t\t\t"label": "YouTube Ads"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h3",\n\t\t\t"type": "circle",\n\t\t\t"x": 0,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:afiliados",\n\t\t\t\t"label": "Afiliados / Parceiros"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h4",\n\t\t\t"type": "page",\n\t\t\t"x": 330,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:vendas",\n\t\t\t\t"label": "VSL Curto (8-12 min)",\n\t\t\t\t"button": "ASSISTIR AO VÍDEO",\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"format": "vsl",\n\t\t\t\t"showPrice": false\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h5",\n\t\t\t"type": "page",\n\t\t\t"x": 660,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:aplicacao",\n\t\t\t\t"label": "Formulário de Aplicação (5 perguntas)",\n\t\t\t\t"button": "ENVIAR APLICAÇÃO",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h6",\n\t\t\t"type": "decision",\n\t\t\t"x": 990,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:se-ou",\n\t\t\t\t"label": "Qualificado?"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h7",\n\t\t\t"type": "page",\n\t\t\t"x": 1320,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:comunidade",\n\t\t\t\t"label": "Comunidade Gratuita",\n\t\t\t\t"button": "ENTRAR NO GRUPO",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h8",\n\t\t\t"type": "circle",\n\t\t\t"x": 1650,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "messages:sequencia-emails",\n\t\t\t\t"label": "Aquecimento + Convite Semanal"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h9",\n\t\t\t"type": "page",\n\t\t\t"x": 1980,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:webinar",\n\t\t\t\t"label": "Webinar Educativo (30-60 min)",\n\t\t\t\t"button": "ASSISTIR AGORA",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h10",\n\t\t\t"type": "page",\n\t\t\t"x": 1320,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:agendar",\n\t\t\t\t"label": "Agendar Consulta (30 min)",\n\t\t\t\t"button": "AGENDAR",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h11",\n\t\t\t"type": "page",\n\t\t\t"x": 1980,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:reuniao-online",\n\t\t\t\t"label": "Call de Fechamento",\n\t\t\t\t"button": "ENTRAR NA CALL",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h12",\n\t\t\t"type": "circle",\n\t\t\t"x": 2310,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:proposta",\n\t\t\t\t"label": "Proposta / Fechamento"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h13",\n\t\t\t"type": "decision",\n\t\t\t"x": 2640,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:se-ou",\n\t\t\t\t"label": "Fechou?"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h14",\n\t\t\t"type": "circle",\n\t\t\t"x": 2970,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:pix",\n\t\t\t\t"label": "Pix / Boleto / Cartão"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h15",\n\t\t\t"type": "circle",\n\t\t\t"x": 3300,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:compra",\n\t\t\t\t"label": "Compra Aprovada"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h16",\n\t\t\t"type": "circle",\n\t\t\t"x": 3630,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "products:mentoria",\n\t\t\t\t"label": "Mentoria High Ticket",\n\t\t\t\t"showPrice": true,\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"price": 9997,\n\t\t\t\t"billing": "unica"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "h17",\n\t\t\t"type": "circle",\n\t\t\t"x": 2970,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:recuperacao",\n\t\t\t\t"label": "Follow-up 30/60/90 dias"\n\t\t\t}\n\t\t}\n\t],\n\t"edges": [\n\t\t{\n\t\t\t"id": "e0",\n\t\t\t"source": "h1",\n\t\t\t"target": "h4",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e1",\n\t\t\t"source": "h2",\n\t\t\t"target": "h4",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e2",\n\t\t\t"source": "h3",\n\t\t\t"target": "h4",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e3",\n\t\t\t"source": "h4",\n\t\t\t"target": "h5",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e4",\n\t\t\t"source": "h5",\n\t\t\t"target": "h6",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e5",\n\t\t\t"source": "h6",\n\t\t\t"target": "h7",\n\t\t\t"sourceHandle": "no",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e6",\n\t\t\t"source": "h7",\n\t\t\t"target": "h8",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e7",\n\t\t\t"source": "h8",\n\t\t\t"target": "h9",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e8",\n\t\t\t"source": "h9",\n\t\t\t"target": "h11",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e9",\n\t\t\t"source": "h6",\n\t\t\t"target": "h10",\n\t\t\t"sourceHandle": "yes",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e10",\n\t\t\t"source": "h10",\n\t\t\t"target": "h11",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e11",\n\t\t\t"source": "h11",\n\t\t\t"target": "h12",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e12",\n\t\t\t"source": "h12",\n\t\t\t"target": "h13",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e13",\n\t\t\t"source": "h13",\n\t\t\t"target": "h14",\n\t\t\t"sourceHandle": "yes",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e14",\n\t\t\t"source": "h14",\n\t\t\t"target": "h15",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e15",\n\t\t\t"source": "h15",\n\t\t\t"target": "h16",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e16",\n\t\t\t"source": "h13",\n\t\t\t"target": "h17",\n\t\t\t"sourceHandle": "no",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e17",\n\t\t\t"source": "h17",\n\t\t\t"target": "h9",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t}\n\t]\n}'
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
        { owner: owner.id, name: 'DTC 3 — Híbrido VSL + Webinar (High Ticket)' },
      )
      for (const row of rows) app.delete(row)
    } catch (err) {}
  },
)
