/// Modelo "B2B 3 — Outbound Enterprise (MEDDPICC)", a partir do funil criado por Edson Muniz.
migrate(
  (app) => {
    const email = 'modelos@funis.goskip.app'
    const owner = app.findAuthRecordByEmail('users', email)
    const name = 'B2B 3 — Outbound Enterprise (MEDDPICC)'
    const content =
      '{\n\t"type": "funil",\n\t"version": 1,\n\t"nodes": [\n\t\t{\n\t\t\t"id": "sec0",\n\t\t\t"type": "section",\n\t\t\t"x": -60,\n\t\t\t"y": -80,\n\t\t\t"data": {\n\t\t\t\t"label": "Prospecção (Outbound)",\n\t\t\t\t"color": "#3b82f6"\n\t\t\t},\n\t\t\t"w": 980,\n\t\t\t"h": 640\n\t\t},\n\t\t{\n\t\t\t"id": "sec1",\n\t\t\t"type": "section",\n\t\t\t"x": 930,\n\t\t\t"y": -80,\n\t\t\t"data": {\n\t\t\t\t"label": "Descoberta & Qualificação",\n\t\t\t\t"color": "#8b5cf6"\n\t\t\t},\n\t\t\t"w": 1310,\n\t\t\t"h": 640\n\t\t},\n\t\t{\n\t\t\t"id": "sec2",\n\t\t\t"type": "section",\n\t\t\t"x": 2250,\n\t\t\t"y": -80,\n\t\t\t"data": {\n\t\t\t\t"label": "Proposta & Fechamento",\n\t\t\t\t"color": "#22c55e"\n\t\t\t},\n\t\t\t"w": 1640,\n\t\t\t"h": 450\n\t\t},\n\t\t{\n\t\t\t"id": "c1",\n\t\t\t"type": "circle",\n\t\t\t"x": 0,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:base-contatos",\n\t\t\t\t"label": "Lista ICP (Sinal de Compra)"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c2",\n\t\t\t"type": "circle",\n\t\t\t"x": 0,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:linkedin-ads",\n\t\t\t\t"label": "ABM / InMail LinkedIn"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c3",\n\t\t\t"type": "circle",\n\t\t\t"x": 0,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "traffic:indicacao",\n\t\t\t\t"label": "Indicação / Parceiros"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c4",\n\t\t\t"type": "circle",\n\t\t\t"x": 330,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "messages:email",\n\t\t\t\t"label": "Cadência Multicanal (SDR)"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c5",\n\t\t\t"type": "circle",\n\t\t\t"x": 660,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "messages:ligacao",\n\t\t\t\t"label": "Ligação / Follow-up"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c6",\n\t\t\t"type": "decision",\n\t\t\t"x": 990,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:se-ou",\n\t\t\t\t"label": "Respondeu / reunião marcada?"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c7",\n\t\t\t"type": "circle",\n\t\t\t"x": 1320,\n\t\t\t"y": 380,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:recuperacao",\n\t\t\t\t"label": "Cadência longa (90 dias)"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c8",\n\t\t\t"type": "page",\n\t\t\t"x": 1320,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:agendar",\n\t\t\t\t"label": "Discovery Call (SPIN)",\n\t\t\t\t"button": "AGENDAR",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c9",\n\t\t\t"type": "circle",\n\t\t\t"x": 1650,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:crm",\n\t\t\t\t"label": "Qualificação MEDDPICC no CRM"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c10",\n\t\t\t"type": "page",\n\t\t\t"x": 1980,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:reuniao-online",\n\t\t\t\t"label": "Demo Técnica / Piloto",\n\t\t\t\t"button": "ENTRAR NA DEMO",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c11",\n\t\t\t"type": "circle",\n\t\t\t"x": 2310,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:proposta",\n\t\t\t\t"label": "Proposta + Business Case"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c12",\n\t\t\t"type": "page",\n\t\t\t"x": 2640,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "pages:presencial",\n\t\t\t\t"label": "Workshop com Stakeholders",\n\t\t\t\t"button": "CONFIRMAR PRESENÇA",\n\t\t\t\t"currency": "BRL"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c13",\n\t\t\t"type": "decision",\n\t\t\t"x": 2970,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:se-ou",\n\t\t\t\t"label": "Ganhou o deal?"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c14",\n\t\t\t"type": "circle",\n\t\t\t"x": 3300,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:nota-fiscal",\n\t\t\t\t"label": "Contrato / Nota Fiscal"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c15",\n\t\t\t"type": "circle",\n\t\t\t"x": 3630,\n\t\t\t"y": 0,\n\t\t\t"data": {\n\t\t\t\t"ref": "products:consultoria",\n\t\t\t\t"label": "Contrato Enterprise (ACV)",\n\t\t\t\t"showPrice": true,\n\t\t\t\t"currency": "BRL",\n\t\t\t\t"price": 48000,\n\t\t\t\t"billing": "anual"\n\t\t\t}\n\t\t},\n\t\t{\n\t\t\t"id": "c16",\n\t\t\t"type": "circle",\n\t\t\t"x": 3300,\n\t\t\t"y": 190,\n\t\t\t"data": {\n\t\t\t\t"ref": "events:recuperacao",\n\t\t\t\t"label": "Reengajar (Paper Process)"\n\t\t\t}\n\t\t}\n\t],\n\t"edges": [\n\t\t{\n\t\t\t"id": "e0",\n\t\t\t"source": "c1",\n\t\t\t"target": "c4",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e1",\n\t\t\t"source": "c2",\n\t\t\t"target": "c4",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e2",\n\t\t\t"source": "c3",\n\t\t\t"target": "c4",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e3",\n\t\t\t"source": "c4",\n\t\t\t"target": "c5",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e4",\n\t\t\t"source": "c5",\n\t\t\t"target": "c6",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e5",\n\t\t\t"source": "c6",\n\t\t\t"target": "c7",\n\t\t\t"sourceHandle": "no",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e6",\n\t\t\t"source": "c6",\n\t\t\t"target": "c8",\n\t\t\t"sourceHandle": "yes",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e7",\n\t\t\t"source": "c8",\n\t\t\t"target": "c9",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e8",\n\t\t\t"source": "c9",\n\t\t\t"target": "c10",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e9",\n\t\t\t"source": "c10",\n\t\t\t"target": "c11",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e10",\n\t\t\t"source": "c11",\n\t\t\t"target": "c12",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e11",\n\t\t\t"source": "c12",\n\t\t\t"target": "c13",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e12",\n\t\t\t"source": "c13",\n\t\t\t"target": "c14",\n\t\t\t"sourceHandle": "yes",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e13",\n\t\t\t"source": "c14",\n\t\t\t"target": "c15",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e14",\n\t\t\t"source": "c13",\n\t\t\t"target": "c16",\n\t\t\t"sourceHandle": "no",\n\t\t\t"targetHandle": "l"\n\t\t},\n\t\t{\n\t\t\t"id": "e15",\n\t\t\t"source": "c16",\n\t\t\t"target": "c7",\n\t\t\t"sourceHandle": "r",\n\t\t\t"targetHandle": "l"\n\t\t}\n\t]\n}'
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
        { owner: owner.id, name: 'B2B 3 — Outbound Enterprise (MEDDPICC)' },
      )
      for (const row of rows) app.delete(row)
    } catch (err) {}
  },
)
