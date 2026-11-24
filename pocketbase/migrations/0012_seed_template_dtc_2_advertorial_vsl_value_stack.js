/// Modelo "DTC 2 — Advertorial + VSL (Value Stack)", a partir do funil criado por Edson Muniz.
migrate(
  (app) => {
    const email = 'modelos@funis.goskip.app'
    const owner = app.findAuthRecordByEmail('users', email)
    const name = 'DTC 2 — Advertorial + VSL (Value Stack)'
    const content =
      '{\n\t"type": "funil",\n\t"version": 1,\n\t"nodes": [\n\t\t{\n\t\t\t"id": "sec0",\n\t\t\t"type": "section",\n\t\t\t"x": -60,\n\t\t\t"y": -80,\n\t\t\t"data": {\n\t\t\t\t"label": "Pré-sell (Advertorial)",\n\t\t\t\t"color": "#3b82f6",\n\t\t\t\t"locked": true\n\t\t\t},\n\t\t\t"w": 980,\n\t\t\t"h": 610\n\t\t},\n\t\t{\n\t\t\t"id": "sec1",\n\t\t\t"type": "section",\n\t\t\t"x": 930,\n\t\t\t"y": -80,\n\t\t\t"data": {\n\t\t\t\t"label": "Oferta & Value Stack",\n\t\t\t\t"color": "#22c55e"\n\t\t\t},\n\t\t\t"w": 1310,\n\t\t\t"h": 640\n\t\t},\n\t\t{\n\t\t\t"id": "sec2",\n\t\t\t"type": "section",\n\t\t\t"x": 1920,\n\t\t\t"y": -80,\n\t\t\t"data": {\n\t\t\t\t"label": "Fechamento & Recuperação",\n\t\t\t\t"color": "#f59e0b"\n\t\t\t},\n\t\t\t"w": 980,\n\t\t\t"h": 640\n\t\t},\n\t\t{\n\t\t\t"id": "f1",\n\t\t\t"type": "circle",\n\t\t\t"x": 0,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:native",\n\t\t\t\t"label": "Native Ads (Taboola/MGID)"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f2",\n\t\t\t"type": "circle",\n\t\t\t"x": 0,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:meta-ads",\n\t\t\t\t"label": "Meta Ads"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f3",\n\t\t\t"type": "page",\n\t\t\t"x": 330,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:blog",\n\t\t\t\t"label": "Advertorial (Matéria Patrocinada)",\n\t\t\t\t"button": "LER A MATÉRIA",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f4",\n\t\t\t"type": "page",\n\t\t\t"x": 660,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:vendas",\n\t\t\t\t"label": "Página de Vendas com VSL",\n\t\t\t\t"button": "VER A OFERTA",\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"format": "vsl",\n\t\t\t\t"showPrice": false\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f5",\n\t\t\t"type": "page",\n\t\t\t"x": 990,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:checkout",\n\t\t\t\t"label": "Oferta Principal (Tripwire)",\n\t\t\t\t"button": "COMPRAR AGORA",\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"billing": "unica",\n\t\t\t\t"showPrice": true,\n\t\t\t\t"price": 47\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f6",\n\t\t\t"type": "orderbump",\n\t\t\t"x": 1320,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:order-bump",\n\t\t\t\t"label": "Order Bump: Aula Extra",\n\t\t\t\t"showPrice": true,\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"price": 27\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f7",\n\t\t\t"type": "page",\n\t\t\t"x": 1320,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:oto",\n\t\t\t\t"label": "Upsell 1 (OTO): Curso Completo",\n\t\t\t\t"button": "SIM, QUERO O COMPLETO",\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"billing": "unica",\n\t\t\t\t"showPrice": true,\n\t\t\t\t"price": 197\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f8",\n\t\t\t"type": "page",\n\t\t\t"x": 1650,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:upsell",\n\t\t\t\t"label": "Upsell 2: Bundle Premium",\n\t\t\t\t"button": "ADICIONAR AO PEDIDO",\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"billing": "unica",\n\t\t\t\t"showPrice": true,\n\t\t\t\t"price": 297\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f9",\n\t\t\t"type": "page",\n\t\t\t"x": 1650,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:downsell",\n\t\t\t\t"label": "Downsell: Versão Essencial",\n\t\t\t\t"button": "PEGAR O ESSENCIAL",\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"billing": "unica",\n\t\t\t\t"showPrice": true,\n\t\t\t\t"price": 97\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f10",\n\t\t\t"type": "circle",\n\t\t\t"x": 1980,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "products:garantia",\n\t\t\t\t"label": "Garantia Incondicional 30 dias"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f11",\n\t\t\t"type": "decision",\n\t\t\t"x": 1980,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:se-ou",\n\t\t\t\t"label": "Comprou?"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f12",\n\t\t\t"type": "circle",\n\t\t\t"x": 2310,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:compra",\n\t\t\t\t"label": "Compra Aprovada"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f13",\n\t\t\t"type": "page",\n\t\t\t"x": 2640,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:membros",\n\t\t\t\t"label": "Área de Membros / Entrega",\n\t\t\t\t"button": "ACESSAR",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f14",\n\t\t\t"type": "circle",\n\t\t\t"x": 2310,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:exit-popup",\n\t\t\t\t"label": "Exit-Intent Popup"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "f15",\n\t\t\t"type": "circle",\n\t\t\t"x": 2640,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:recuperacao",\n\t\t\t\t"label": "Recuperação (E-mail + SMS)"\n\t\t\t}\n\t\t}\n\t],\n\t"edges": [\n\t\t{\n\t\t\t"id": "e0",\n\t\t\t"source": "f1",\n\t\t\t"target": "f3",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e1",\n\t\t\t"source": "f2",\n\t\t\t"target": "f3",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e2",\n\t\t\t"source": "f3",\n\t\t\t"target": "f4",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e3",\n\t\t\t"source": "f4",\n\t\t\t"target": "f5",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e4",\n\t\t\t"source": "f5",\n\t\t\t"target": "f6",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e5",\n\t\t\t"source": "f5",\n\t\t\t"target": "f7",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e6",\n\t\t\t"source": "f7",\n\t\t\t"target": "f8",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e7",\n\t\t\t"source": "f8",\n\t\t\t"target": "f11",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e8",\n\t\t\t"source": "f5",\n\t\t\t"target": "f9",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e9",\n\t\t\t"source": "f9",\n\t\t\t"target": "f11",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e10",\n\t\t\t"source": "f9",\n\t\t\t"target": "f10",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e11",\n\t\t\t"source": "f10",\n\t\t\t"target": "f11",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e12",\n\t\t\t"source": "f11",\n\t\t\t"target": "f12",\n\t\t\t"sourceHandle": "yes",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e13",\n\t\t\t"source": "f12",\n\t\t\t"target": "f13",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e14",\n\t\t\t"source": "f11",\n\t\t\t"target": "f14",\n\t\t\t"sourceHandle": "no",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e15",\n\t\t\t"source": "f14",\n\t\t\t"target": "f15",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t}\n\t]\n}'
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
        { owner: owner.id, name: 'DTC 2 — Advertorial + VSL (Value Stack)' },
      )
      for (const row of rows) app.delete(row)
    } catch (err) {}
  },
)
