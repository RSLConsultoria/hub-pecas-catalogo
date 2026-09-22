// ===== js/demo.js =====
// Catalogo INVENTADO para o modo demonstracao (?demo na URL). Serve para
// ver e testar a tela sem senha. Este repositorio e publico: nenhum nome,
// referencia ou preco aqui e real. As "fotos" sao desenhos em SVG.

(function (raiz) {
  // Silhueta simples de uma peca sobre um fundo de cor, como foto de mentira.
  function fotoDemo(fundo, cor, forma) {
    var formas = {
      calca: 'M70 40h60l8 150h-30l-8-110-8 110H62z',
      camisa: 'M60 40l25-10h30l25 10 25 30-20 15-10-10v105H65V75l-10 10-20-15z',
      vestido: 'M80 35h40l5 30 30 125H45l30-125z',
      jaqueta: 'M58 42l27-12h30l27 12 22 40-18 10-8-14v112H62V78l-8 14-18-10z'
    };
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 266"><rect width="200" height="266" fill="' + fundo + '"/>' +
      '<path d="' + formas[forma] + '" transform="translate(0 30)" fill="' + cor + '"/></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function linha(produto, campos) {
    return { produto: produto, quantidade: '', campos: Object.keys(campos).map(function (k) { return { nome: k, valor: campos[k] }; }) };
  }

  var ZIPER = linha('ZÍPER METAL C.A.', { 'Local - Zíper🟡': 'BRAGUILHA', 'Quantidade - Zíper🟡': '1', 'Marca - Zíper🟡': 'YKK' });
  var ZIPER_INV = linha('ZÍPER INVISÍVEL', { 'Local - Zíper🟡': 'COSTAS', 'Quantidade - Zíper🟡': '1' });
  var BOTAO = function (n) { return linha('BOTÃO DE MASSA 4F', { 'Qtd consumo - Botão e Fivela🟡': String(n), 'Local - Botão e Fivela🟡': 'FRENTE' }); };
  var CASEADO = function (n) { return linha('CASEADO RETO FUNCIONAL', { 'Quantidade - Aviamento Costura Detalhes🟡': String(n) }); };
  var TRAVETE = function (n) { return linha('TRAVETE', { 'Quantidade - Aviamento Costura Detalhes🟡': String(n), 'Obs - Caseado e Travete': 'BOLSOS E PASSANTES' }); };
  var PASSANTE = linha('PASSANTE', { 'Quantidade - Aviamento Costura Detalhes🟡': '5' });
  var FORRO = linha('E. FORRO', { Tecido: 'FORRO DEMO', 'Cor - Tecido': 'OFF WHITE' });
  var BOLSO = linha('BOLSO EMBUTIDO FRENTE', { 'Quantidade - Aviamento Costura Detalhes🟡': '2' });
  var OMBREIRA = linha('OMBREIRA', { 'Material🟡': 'OMBREIRA' });

  function peca(ref, desc, cliente, colecao, tecidos, extra, itens) {
    return Object.assign({
      ref_mrbl: ref, descricao: desc, ref_cliente: '', ref_colecao_ano: ref.slice(0, 3),
      cliente: cliente, colecao: colecao, tipo_demanda: 'Produção', modelista: 'Modelista A',
      produzido_por: '', valor_peca: null, tecidos: tecidos, composicoes: [], tipos_tecido: ['LISO'],
      marcas_ziper: [], foto_frente: '', foto_costas: '',
      materiais: [
        linha('A. TECIDO 1 PRINCIPAL', {
          Tecido: tecidos[0] || '', 'Cor - Tecido': 'PRETO', 'Largura - Tecido': '1,45', 'Tipo de tecido🟡': 'LISO'
        }),
        linha('LINHA 120', { 'Marca e Cor - Linha & Fio🟡': 'R - 000', 'Local - Linha e Fio🟡': 'TEC. PRINCIPAL' })
      ].concat(itens || []),
      cards: [{ id: 100000001, funil: 'Produção', etapa: 'Corte', criado_em: '2026-09-01T10:00:00Z', link: 'https://app10.ploomes.com/deal/100000001' }],
      atualizado_em: '2026-09-22T10:29:00.000Z'
    }, extra || {});
  }

  var HubDemo = {
    atualizado_em: '2026-09-22T10:29:00.000Z',
    total: 8,
    pecas: [
      peca('227.01.00001X', 'CALÇA PANTALONA', 'MARCA ALFA', '2027 VERÃO', ['LINHO RÚSTICO', 'VISCOSE'],
        { valor_peca: 189.9, composicoes: ['55% LINHO 45% VISCOSE'], marcas_ziper: ['YKK'], foto_frente: fotoDemo('#E9E4DA', '#B9A27D', 'calca') },
        [ZIPER, BOTAO(1), CASEADO(1), TRAVETE(21), PASSANTE, BOLSO]),
      peca('227.01.00002X', 'CAMISA OVERSIZED', 'MARCA ALFA', '2027 VERÃO', ['TRICOLINE'],
        { valor_peca: 129, composicoes: ['100% ALGODÃO'], foto_frente: fotoDemo('#E3E8EF', '#FFFFFF', 'camisa') },
        [BOTAO(9), CASEADO(8)]),
      peca('227.02.00003X', 'BLAZER ALFAIATARIA', 'MARCA BETA', '2027 INVERNO', ['LÃ FRIA'],
        { valor_peca: 495, composicoes: ['70% LÃ 30% POLIÉSTER'], modelista: 'Modelista B', foto_frente: fotoDemo('#DCDDE3', '#2B3350', 'jaqueta') },
        [BOTAO(4), CASEADO(4), FORRO, OMBREIRA, BOLSO]),
      peca('227.02.00004X', 'SAIA MIDI PLISSADA', 'MARCA BETA', '2027 INVERNO', ['CREPE'],
        { composicoes: ['100% POLIÉSTER'] }, [ZIPER_INV, FORRO]),
      peca('226.03.00005X', 'VESTIDO CHEMISE', 'MARCA GAMA', '2026 VERÃO', ['LINHO RÚSTICO'],
        { valor_peca: 260, composicoes: ['100% LINHO'], tipo_demanda: 'Desenvolvimento', foto_frente: fotoDemo('#EFE6E1', '#C98F7B', 'vestido') },
        [BOTAO(8), CASEADO(8)]),
      peca('226.03.00006X', 'CALÇA ALFAIATARIA', 'MARCA GAMA', '2026 VERÃO', ['LINHO RÚSTICO'],
        { valor_peca: 219, marcas_ziper: ['YKK'], composicoes: ['55% LINHO 45% VISCOSE'], foto_frente: fotoDemo('#E6E7E1', '#6E7A5C', 'calca') },
        [ZIPER, BOTAO(1), CASEADO(1), TRAVETE(17), PASSANTE, BOLSO]),
      peca('226.04.00007X', 'JAQUETA UTILITÁRIA', 'MARCA ALFA', '2026 INVERNO', ['SARJA', 'TELA'],
        { valor_peca: 310, marcas_ziper: ['SANCRIS'], modelista: 'Modelista B', foto_frente: fotoDemo('#E4E2DA', '#7C6A45', 'jaqueta') },
        [ZIPER, BOTAO(6), TRAVETE(8), BOLSO]),
      peca('226.04.00008X', 'TOP CROPPED', 'MARCA BETA', '2026 VERÃO', [],
        { tipo_demanda: 'Desenvolvimento' }, [linha('ELÁSTICO', { 'Consumo -  Aviamento costura🟡': '0,60' })])
    ]
  };
  raiz.HubDemo = HubDemo;
  if (typeof module !== 'undefined') { module.exports = HubDemo; }
})(typeof window !== 'undefined' ? window : globalThis);
