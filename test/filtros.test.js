// Testes da logica de filtro do catalogo. Os dados sao INVENTADOS: este
// repositorio e publico e nao pode ter peca, cliente ou preco real.
const test = require('node:test');
const assert = require('node:assert');
const { aplicar, contarOpcoes, buscar, faixaDeValores } = require('../js/filtros.js');
const { FILTROS } = require('../js/config.js');

const PECAS = [
  { ref_mrbl: '226.01.0001X', descricao: 'CALÇA PANTALONA', ref_cliente: 'CL-10', cliente: 'ALFA', colecao: 'VERAO', tecidos: ['LINHO', 'VISCOSE'], composicoes: ['100% LINHO'], valor_peca: 120 },
  { ref_mrbl: '226.01.0002X', descricao: 'CAMISA BASICA', ref_cliente: 'CL-11', cliente: 'ALFA', colecao: 'INVERNO', tecidos: ['ALGODAO'], composicoes: ['100% ALGODAO'], valor_peca: 80 },
  { ref_mrbl: '226.01.0003X', descricao: 'BLAZER', ref_cliente: '', cliente: 'BETA', colecao: 'VERAO', tecidos: ['LINHO'], composicoes: [], valor_peca: 300 },
  { ref_mrbl: '226.01.0004X', descricao: 'SAIA', ref_cliente: '', cliente: 'BETA', colecao: '', tecidos: [], composicoes: [], valor_peca: null },
  { ref_mrbl: '126.01.0005X', descricao: 'VESTIDO', ref_cliente: 'CL-12', cliente: 'GAMA', colecao: 'VERAO', tecidos: ['VISCOSE'], composicoes: ['100% VISCOSE'], valor_peca: 150 }
];

const refs = (lista) => lista.map((p) => p.ref_mrbl.slice(-5, -1)).sort();

test('sem selecao nenhuma, nada e filtrado', () => {
  assert.strictEqual(aplicar(PECAS, {}, FILTROS).length, 5);
});

test('dentro de um filtro vale OU', () => {
  const r = aplicar(PECAS, { cliente: new Set(['ALFA', 'GAMA']) }, FILTROS);
  assert.deepStrictEqual(refs(r), ['0001', '0002', '0005']);
});

test('entre filtros vale E', () => {
  const r = aplicar(PECAS, { cliente: new Set(['ALFA', 'BETA']), colecao: new Set(['VERAO']) }, FILTROS);
  assert.deepStrictEqual(refs(r), ['0001', '0003']);
});

test('filtro de lista casa se qualquer item da peca foi marcado', () => {
  const r = aplicar(PECAS, { tecidos: new Set(['VISCOSE']) }, FILTROS);
  assert.deepStrictEqual(refs(r), ['0001', '0005']);
});

test('peca sem valor nao passa num filtro que tem selecao', () => {
  const r = aplicar(PECAS, { colecao: new Set(['VERAO', 'INVERNO']) }, FILTROS);
  assert.ok(!refs(r).includes('0004'));
});

test('Set vazio nao restringe', () => {
  assert.strictEqual(aplicar(PECAS, { cliente: new Set() }, FILTROS).length, 5);
});

test('faixa de valor inclui as pontas e exclui peca sem valor', () => {
  const r = aplicar(PECAS, { valor_peca: { min: 80, max: 150 } }, FILTROS);
  assert.deepStrictEqual(refs(r), ['0001', '0002', '0005']);
});

test('faixa com so minimo ou so maximo funciona', () => {
  assert.deepStrictEqual(refs(aplicar(PECAS, { valor_peca: { min: 150 } }, FILTROS)), ['0003', '0005']);
  assert.deepStrictEqual(refs(aplicar(PECAS, { valor_peca: { max: 80 } }, FILTROS)), ['0002']);
});

test('faixa vazia nao restringe, nem esconde peca sem valor', () => {
  assert.strictEqual(aplicar(PECAS, { valor_peca: {} }, FILTROS).length, 5);
});

test('contagem por opcao, da maior para a menor e depois alfabetica', () => {
  const c = contarOpcoes(PECAS, {}, FILTROS, 'cliente');
  assert.deepStrictEqual(c, [{ valor: 'ALFA', n: 2 }, { valor: 'BETA', n: 2 }, { valor: 'GAMA', n: 1 }]);
});

test('contagem de lista conta cada item', () => {
  const c = contarOpcoes(PECAS, {}, FILTROS, 'tecidos');
  assert.deepStrictEqual(c, [{ valor: 'LINHO', n: 2 }, { valor: 'VISCOSE', n: 2 }, { valor: 'ALGODAO', n: 1 }]);
});

// A contagem de um filtro ignora a propria selecao: mostra quantas peças
// sobrariam se voce marcasse aquela opcao, com os outros filtros valendo.
test('contagem considera os outros filtros e ignora o proprio', () => {
  const selecao = { cliente: new Set(['ALFA']), colecao: new Set(['VERAO']) };
  const porCliente = contarOpcoes(PECAS, selecao, FILTROS, 'cliente');
  assert.deepStrictEqual(porCliente, [{ valor: 'ALFA', n: 1 }, { valor: 'BETA', n: 1 }, { valor: 'GAMA', n: 1 }]);
  const porColecao = contarOpcoes(PECAS, selecao, FILTROS, 'colecao');
  assert.deepStrictEqual(porColecao, [{ valor: 'INVERNO', n: 1 }, { valor: 'VERAO', n: 1 }]);
});

test('contagem nao lista valor vazio', () => {
  const c = contarOpcoes(PECAS, {}, FILTROS, 'colecao');
  assert.ok(c.every((o) => o.valor !== ''));
});

test('busca sem acento e sem caixa', () => {
  assert.deepStrictEqual(refs(buscar(PECAS, 'calca')), ['0001']);
  assert.deepStrictEqual(refs(buscar(PECAS, 'Pantalona')), ['0001']);
});

test('busca olha referencia MRBL e referencia do cliente', () => {
  assert.deepStrictEqual(refs(buscar(PECAS, '0003')), ['0003']);
  assert.deepStrictEqual(refs(buscar(PECAS, 'cl-12')), ['0005']);
});

test('busca vazia ou so com espacos devolve tudo', () => {
  assert.strictEqual(buscar(PECAS, '').length, 5);
  assert.strictEqual(buscar(PECAS, '   ').length, 5);
});

test('busca com varias palavras exige todas', () => {
  assert.deepStrictEqual(refs(buscar(PECAS, 'camisa basica')), ['0002']);
  assert.deepStrictEqual(refs(buscar(PECAS, 'camisa blazer')), []);
});

test('faixa de valores ignora pecas sem valor', () => {
  assert.deepStrictEqual(faixaDeValores(PECAS), { min: 80, max: 300 });
  assert.strictEqual(faixaDeValores([{ valor_peca: null }]), null);
});

test('config lista os filtros do design, com tipo valido', () => {
  const chaves = FILTROS.map((f) => f.chave);
  ['cliente', 'produto', 'colecao', 'tipo_demanda', 'modelista', 'produzido_por', 'valor_peca', 'tecidos', 'composicoes', 'tipos_tecido', 'marcas_ziper']
    .forEach((c) => assert.ok(chaves.includes(c), `falta o filtro ${c}`));
  FILTROS.forEach((f) => assert.ok(['texto', 'lista', 'faixa', 'detalhes'].includes(f.tipo), `${f.chave}: tipo ${f.tipo}`));
});

// --- so com foto -------------------------------------------------------

test('so com foto mantem peca com foto de frente ou de costas', () => {
  const { soComFoto } = require('../js/filtros.js');
  const pecas = [
    { ref_mrbl: 'A', foto_frente: 'https://x/a.jpg', foto_costas: '' },
    { ref_mrbl: 'B', foto_frente: '', foto_costas: 'https://x/b.jpg' },
    { ref_mrbl: 'C', foto_frente: '', foto_costas: '' },
    { ref_mrbl: 'D' }
  ];
  assert.deepStrictEqual(soComFoto(pecas).map((p) => p.ref_mrbl), ['A', 'B']);
});

// --- tem na peca ----------------------------------------------------------

const { detalhesDaPeca, contarDetalhes, parecidas } = require('../js/filtros.js');
const { DETALHES } = require('../js/config.js');

function linha(produto, campos) {
  return { produto, quantidade: '', campos: Object.entries(campos || {}).map(([nome, valor]) => ({ nome, valor })) };
}

const CALCA = { ref_mrbl: 'C1', descricao: 'CALÇA PANTALONA', tecidos: ['LINHO'], materiais: [
  linha('A. TECIDO 1 PRINCIPAL', { Tecido: 'LINHO' }),
  linha('ZÍPER METAL C.A.', { 'Quantidade - Zíper🟡': '1' }),
  linha('TRAVETE', { 'Quantidade - Aviamento Costura Detalhes🟡': '21' }),
  linha('BOTÃO DE MASSA 4F', { 'Qtd consumo - Botão e Fivela🟡': '2' }),
  linha('BOTÃO FORRADO', { 'Qtd consumo - Botão e Fivela🟡': '3', 'Qtd grade - Botão e Fivela': '9' }),
  linha('- CASEADO DE OLHO - GENÉRICO', {}),
  linha('PORTA BOTÃO', {}),
  linha('TAG', {})
] };
const CAMISA = { ref_mrbl: 'C2', descricao: 'CAMISA BÁSICA', tecidos: ['TRICOLINE'], materiais: [
  linha('BOTÃO DE MASSA 2F', { 'Qtd consumo - Botão e Fivela🟡': '8' }),
  linha('CASEADO RETO FUNCIONAL', { 'Quantidade - Aviamento Costura Detalhes🟡': '8' })
] };
const FILTRO_DET = [{ chave: 'detalhes', rotulo: 'Tem na peça', tipo: 'detalhes', familias: DETALHES }];

test('detalhes: familia pelo nome do produto, quantidade somada entre linhas', () => {
  const d = detalhesDaPeca(CALCA, DETALHES);
  assert.deepStrictEqual(d.ziper, { qtd: 1 });
  assert.deepStrictEqual(d.travete, { qtd: 21 });
  assert.deepStrictEqual(d.botao, { qtd: 5 }, 'soma 2 + 3, e ignora a Qtd grade');
  assert.deepStrictEqual(d.caseado, { qtd: null }, 'prefixo "- " nao atrapalha; sem campo de quantidade fica null');
  assert.ok(!('tag' in d));
});

test('detalhes: PORTA BOTAO nao conta como botao', () => {
  const p = { ref_mrbl: 'X', materiais: [linha('PORTA BOTÃO', {})] };
  assert.ok(!('botao' in detalhesDaPeca(p, DETALHES)));
});

test('filtro tem na peca: entre familias vale E', () => {
  const pecas = [CALCA, CAMISA];
  const so = (familias) => aplicar(pecas, { detalhes: { familias } }, FILTRO_DET).map((p) => p.ref_mrbl);
  assert.deepStrictEqual(so({ botao: {} }), ['C1', 'C2']);
  assert.deepStrictEqual(so({ botao: {}, ziper: {} }), ['C1']);
  assert.deepStrictEqual(so({}), ['C1', 'C2'], 'nada marcado nao restringe');
});

test('filtro tem na peca: faixa de quantidade', () => {
  const pecas = [CALCA, CAMISA];
  const so = (familias) => aplicar(pecas, { detalhes: { familias } }, FILTRO_DET).map((p) => p.ref_mrbl);
  assert.deepStrictEqual(so({ botao: { min: 6 } }), ['C2']);
  assert.deepStrictEqual(so({ travete: { min: 10, max: 30 } }), ['C1']);
  assert.deepStrictEqual(so({ caseado: { min: 1 } }), ['C2'], 'quantidade desconhecida nao passa numa faixa');
});

test('contagem de detalhes traz n e faixa de quantidade', () => {
  const c = contarDetalhes([CALCA, CAMISA], {}, FILTRO_DET, 'detalhes');
  const botao = c.find((x) => x.chave === 'botao');
  assert.deepStrictEqual(botao, { chave: 'botao', rotulo: 'Botão', n: 2, qtd: { min: 5, max: 8 } });
  assert.strictEqual(c[0].n, 2, 'maior contagem primeiro');
});

// --- pecas parecidas -------------------------------------------------------

test('parecidas: mesmo tipo de peca e tecido vem primeiro; a propria peca fica fora', () => {
  const base = [
    CALCA,
    { ref_mrbl: 'C4', descricao: 'CALÇA JOGGER', tecidos: ['MOLETOM'], materiais: [] },
    { ref_mrbl: 'C3', descricao: 'CALÇA RETA', tecidos: ['LINHO'], materiais: CALCA.materiais },
    CAMISA
  ];
  const r = parecidas(CALCA, base, DETALHES).map((p) => p.ref_mrbl);
  assert.deepStrictEqual(r, ['C3', 'C4']);
});

test('parecidas: sem nada em comum, lista vazia', () => {
  assert.deepStrictEqual(parecidas(CALCA, [CALCA, CAMISA], DETALHES), []);
});
