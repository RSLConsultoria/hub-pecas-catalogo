// ===== js/demo.js =====
// Catalogo INVENTADO para o modo demonstracao (?demo na URL). Serve para
// ver e testar a tela sem senha. Este repositorio e publico: nenhum nome,
// referencia ou preco aqui e real.

(function (raiz) {
  function peca(ref, desc, cliente, colecao, tecidos, extra) {
    return Object.assign({
      ref_mrbl: ref, descricao: desc, ref_cliente: '', ref_colecao_ano: ref.slice(0, 3),
      cliente: cliente, colecao: colecao, tipo_demanda: 'Produção', modelista: 'Modelista A',
      produzido_por: '', valor_peca: null, tecidos: tecidos, composicoes: [], tipos_tecido: ['LISO'],
      marcas_ziper: [], foto_frente: '', foto_costas: '',
      materiais: [
        { produto: 'A. TECIDO 1 PRINCIPAL', quantidade: 1, campos: [
          { nome: 'Tecido', valor: tecidos[0] || '' },
          { nome: 'Cor - Tecido', valor: 'PRETO' },
          { nome: 'Largura - Tecido', valor: '1,45' },
          { nome: 'Tipo de tecido🟡', valor: 'LISO' }
        ] },
        { produto: 'LINHA', quantidade: 1, campos: [
          { nome: 'Marca e Cor - Linha & Fio🟡', valor: 'LINHA 120 PRETO' },
          { nome: 'Local - Linha e Fio🟡', valor: 'COSTURA GERAL' }
        ] }
      ],
      cards: [{ id: 100000001, funil: 'Produção', etapa: 'Corte', criado_em: '2026-09-01T10:00:00Z', link: 'https://app10.ploomes.com/deal/100000001' }],
      atualizado_em: '2026-09-22T10:29:00.000Z'
    }, extra || {});
  }

  var HubDemo = {
    atualizado_em: '2026-09-22T10:29:00.000Z',
    total: 8,
    pecas: [
      peca('227.01.00001X', 'CALÇA PANTALONA', 'MARCA ALFA', '2027 VERÃO', ['LINHO RÚSTICO', 'VISCOSE'], { valor_peca: 189.9, composicoes: ['55% LINHO 45% VISCOSE'], marcas_ziper: ['YKK'] }),
      peca('227.01.00002X', 'CAMISA OVERSIZED', 'MARCA ALFA', '2027 VERÃO', ['TRICOLINE'], { valor_peca: 129, composicoes: ['100% ALGODÃO'] }),
      peca('227.02.00003X', 'BLAZER ALFAIATARIA', 'MARCA BETA', '2027 INVERNO', ['LÃ FRIA'], { valor_peca: 495, composicoes: ['70% LÃ 30% POLIÉSTER'], modelista: 'Modelista B' }),
      peca('227.02.00004X', 'SAIA MIDI PLISSADA', 'MARCA BETA', '2027 INVERNO', ['CREPE'], { composicoes: ['100% POLIÉSTER'] }),
      peca('226.03.00005X', 'VESTIDO CHEMISE', 'MARCA GAMA', '2026 VERÃO', ['LINHO RÚSTICO'], { valor_peca: 260, composicoes: ['100% LINHO'], tipo_demanda: 'Desenvolvimento' }),
      peca('226.03.00006X', 'BERMUDA ALFAIATARIA', 'MARCA GAMA', '2026 VERÃO', ['SARJA'], { valor_peca: 98, marcas_ziper: ['YKK'] }),
      peca('226.04.00007X', 'JAQUETA UTILITÁRIA', 'MARCA ALFA', '2026 INVERNO', ['SARJA', 'TELA'], { valor_peca: 310, marcas_ziper: ['SANCRIS'], modelista: 'Modelista B' }),
      peca('226.04.00008X', 'TOP CROPPED', 'MARCA BETA', '2026 VERÃO', [], { tipo_demanda: 'Desenvolvimento' })
    ]
  };
  raiz.HubDemo = HubDemo;
  if (typeof module !== 'undefined') { module.exports = HubDemo; }
})(typeof window !== 'undefined' ? window : globalThis);
