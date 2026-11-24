/// Modelo "DTC 1 — Quiz Funnel (Personalização)", a partir do funil criado por Edson Muniz.
migrate(
  (app) => {
    const email = 'modelos@funis.goskip.app'
    const owner = app.findAuthRecordByEmail('users', email)
    const name = 'DTC 1 — Quiz Funnel (Personalização)'
    const content =
      '{\n\t"type": "funil",\n\t"version": 1,\n\t"nodes": [\n\t\t{\n\t\t\t"id": "sec0",\n\t\t\t"type": "section",\n\t\t\t"x": -60,\n\t\t\t"y": -80,\n\t\t\t"data": {\n\t\t\t\t"label": "Descoberta (Quiz)",\n\t\t\t\t"color": "#3b82f6"\n\t\t\t},\n\t\t\t"w": 1310,\n\t\t\t"h": 640\n\t\t},\n\t\t{\n\t\t\t"id": "sec1",\n\t\t\t"type": "section",\n\t\t\t"x": 1260,\n\t\t\t"y": -80,\n\t\t\t"data": {\n\t\t\t\t"label": "Oferta",\n\t\t\t\t"color": "#22c55e"\n\t\t\t},\n\t\t\t"w": 1640,\n\t\t\t"h": 640\n\t\t},\n\t\t{\n\t\t\t"id": "sec2",\n\t\t\t"type": "section",\n\t\t\t"x": 1920,\n\t\t\t"y": 300,\n\t\t\t"data": {\n\t\t\t\t"label": "Recuperação",\n\t\t\t\t"color": "#ef4444"\n\t\t\t},\n\t\t\t"w": 980,\n\t\t\t"h": 260\n\t\t},\n\t\t{\n\t\t\t"id": "d1",\n\t\t\t"type": "circle",\n\t\t\t"x": 0,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:meta-ads",\n\t\t\t\t"label": "Meta Ads (Criativo Nativo)"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d2",\n\t\t\t"type": "circle",\n\t\t\t"x": 0,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:tiktok-ads",\n\t\t\t\t"label": "TikTok Ads"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d3",\n\t\t\t"type": "circle",\n\t\t\t"x": 0,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:influenciador",\n\t\t\t\t"label": "Influenciadores"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d4",\n\t\t\t"type": "page",\n\t\t\t"x": 330,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:pesquisa",\n\t\t\t\t"label": "Quiz: Descubra seu Perfil",\n\t\t\t\t"button": "COMEÇAR O QUIZ",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d5",\n\t\t\t"type": "circle",\n\t\t\t"x": 660,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:lead",\n\t\t\t\t"label": "Captura de E-mail / WhatsApp"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d6",\n\t\t\t"type": "page",\n\t\t\t"x": 990,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:avaliacao",\n\t\t\t\t"label": "Resultado Personalizado + Autoridade",\n\t\t\t\t"button": "VER MINHA RECOMENDAÇÃO",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d7",\n\t\t\t"type": "page",\n\t\t\t"x": 1320,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:checkout",\n\t\t\t\t"label": "Oferta Personalizada",\n\t\t\t\t"button": "QUERO MEU KIT",\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"billing": "unica",\n\t\t\t\t"showPrice": true,\n\t\t\t\t"price": 297\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d8",\n\t\t\t"type": "decision",\n\t\t\t"x": 1650,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:se-ou",\n\t\t\t\t"label": "Comprou?"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d9",\n\t\t\t"type": "orderbump",\n\t\t\t"x": 1650,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:order-bump",\n\t\t\t\t"label": "Order Bump: Kit Complementar",\n\t\t\t\t"showPrice": true,\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"price": 67\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d10",\n\t\t\t"type": "circle",\n\t\t\t"x": 1980,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:compra",\n\t\t\t\t"label": "Compra Aprovada"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d11",\n\t\t\t"type": "circle",\n\t\t\t"x": 2310,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "products:fisico",\n\t\t\t\t"label": "Kit Personalizado"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d12",\n\t\t\t"type": "circle",\n\t\t\t"x": 2640,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "products:assinatura",\n\t\t\t\t"label": "Clube de Recompra (Recorrência)",\n\t\t\t\t"showPrice": true,\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"price": 149,\n\t\t\t\t"billing": "mensal"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d13",\n\t\t\t"type": "circle",\n\t\t\t"x": 1980,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:carrinho-abandonado",\n\t\t\t\t"label": "Carrinho Abandonado"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d14",\n\t\t\t"type": "circle",\n\t\t\t"x": 2310,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "messages:whatsapp",\n\t\t\t\t"label": "WhatsApp de Recuperação"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "d15",\n\t\t\t"type": "circle",\n\t\t\t"x": 2640,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "messages:sequencia-emails",\n\t\t\t\t"label": "Sequência de Prova Social"\n\t\t\t}\n\t\t}\n\t],\n\t"edges": [\n\t\t{\n\t\t\t"id": "e0",\n\t\t\t"source": "d1",\n\t\t\t"target": "d4",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e1",\n\t\t\t"source": "d2",\n\t\t\t"target": "d4",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e2",\n\t\t\t"source": "d3",\n\t\t\t"target": "d4",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e3",\n\t\t\t"source": "d4",\n\t\t\t"target": "d5",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e4",\n\t\t\t"source": "d5",\n\t\t\t"target": "d6",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e5",\n\t\t\t"source": "d6",\n\t\t\t"target": "d7",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e6",\n\t\t\t"source": "d7",\n\t\t\t"target": "d8",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e7",\n\t\t\t"source": "d7",\n\t\t\t"target": "d9",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e8",\n\t\t\t"source": "d8",\n\t\t\t"target": "d10",\n\t\t\t"sourceHandle": "yes",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e9",\n\t\t\t"source": "d10",\n\t\t\t"target": "d11",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e10",\n\t\t\t"source": "d11",\n\t\t\t"target": "d12",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e11",\n\t\t\t"source": "d8",\n\t\t\t"target": "d13",\n\t\t\t"sourceHandle": "no",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e12",\n\t\t\t"source": "d13",\n\t\t\t"target": "d14",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e13",\n\t\t\t"source": "d14",\n\t\t\t"target": "d15",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t}\n\t]\n}'
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
        { owner: owner.id, name: 'DTC 1 — Quiz Funnel (Personalização)' },
      )
      for (const row of rows) app.delete(row)
    } catch (err) {}
  },
)
