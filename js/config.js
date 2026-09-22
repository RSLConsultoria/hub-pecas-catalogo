// ===== js/config.js =====
// Configuracao do catalogo. Incluir um filtro novo e acrescentar uma linha
// em FILTROS - a tela se monta sozinha a partir desta lista.
//
// tipo 'texto': a peca tem um valor (cliente, colecao...)
// tipo 'lista': a peca tem varios (tecidos, composicoes...)
// tipo 'faixa': numero com minimo e maximo (valor por peca)
// tipo 'detalhes': o que tem na peca (ziper, botao...), com quantidade
//
// Nada aqui e segredo: a senha fica no aparelho de quem usa, e os dados so
// saem do webhook para quem tem a senha.

(function (raiz) {
  // O que "tem na peca": cada familia casa pelo nome do produto da linha de
  // proposta, sem acento e em minusculas (ex.: "zíper metal c.a." -> ziper).
  // Familia nova e uma linha aqui. Aviamento de embalagem (tag, lacre,
  // etiqueta, linha) fica de fora de proposito: toda peca tem.
  var DETALHES = [
    { chave: 'ziper', rotulo: 'Zíper', padrao: '^ziper' },
    { chave: 'botao', rotulo: 'Botão', padrao: '^botao' },
    { chave: 'caseado', rotulo: 'Caseado', padrao: 'caseado' },
    { chave: 'travete', rotulo: 'Travete', padrao: '^travete' },
    { chave: 'forro', rotulo: 'Forro', padrao: 'forro' },
    { chave: 'entretela', rotulo: 'Entretela', padrao: 'entretela' },
    { chave: 'bolso', rotulo: 'Bolso', padrao: 'bolso' },
    { chave: 'passante', rotulo: 'Passante', padrao: '^passante' },
    { chave: 'pence', rotulo: 'Pence', padrao: 'pence' },
    { chave: 'gancho', rotulo: 'Gancho de máquina', padrao: '^ganc' },
    { chave: 'colchete', rotulo: 'Colchete', padrao: '^colchete' },
    { chave: 'elastico', rotulo: 'Elástico', padrao: '^(elastico|lastex)' },
    { chave: 'ombreira', rotulo: 'Ombreira', padrao: '^ombreira' },
    { chave: 'lapela', rotulo: 'Lapela', padrao: '^lapela' },
    { chave: 'fivela', rotulo: 'Fivela', padrao: 'fivela' },
    { chave: 'ilhos', rotulo: 'Ilhós', padrao: 'ilhos' },
    { chave: 'vies', rotulo: 'Viés', padrao: 'vies' },
    { chave: 'rolote', rotulo: 'Rolotê', padrao: '^rolote' },
    { chave: 'cordao', rotulo: 'Cordão', padrao: '^(cordao|cadarco|barbante)' },
    { chave: 'tapa_miseria', rotulo: 'Tapa-miséria', padrao: '^tapa miseria' },
    { chave: 'martingale', rotulo: 'Martingale', padrao: '^martingale' },
    { chave: 'barbatana', rotulo: 'Barbatana', padrao: '^barbatana' }
  ];

  var HubConfig = {
    DETALHES: DETALHES,
    WEBHOOK_URL: 'https://mrbl-automacoes.duckdns.org/webhook/hub-pecas',
    CABECALHO_SENHA: 'X-Hub-Senha',
    CHAVE_SENHA_LOCAL: 'hubPecasSenha',
    FILTROS: [
      { chave: 'detalhes', rotulo: 'Tem na peça', tipo: 'detalhes', familias: DETALHES },
      { chave: 'cliente', rotulo: 'Cliente', tipo: 'texto' },
      { chave: 'colecao', rotulo: 'Coleção', tipo: 'texto' },
      { chave: 'tipo_demanda', rotulo: 'Tipo de demanda', tipo: 'texto' },
      { chave: 'tecidos', rotulo: 'Tecido', tipo: 'lista' },
      { chave: 'composicoes', rotulo: 'Composição', tipo: 'lista' },
      { chave: 'tipos_tecido', rotulo: 'Tipo de tecido', tipo: 'lista' },
      { chave: 'marcas_ziper', rotulo: 'Marca do zíper', tipo: 'lista' },
      { chave: 'modelista', rotulo: 'Modelista', tipo: 'texto' },
      { chave: 'produzido_por', rotulo: 'Será produzido por', tipo: 'texto' },
      { chave: 'valor_peca', rotulo: 'Valor por peça', tipo: 'faixa' }
    ]
  };
  raiz.HubConfig = HubConfig;
  if (typeof module !== 'undefined') { module.exports = HubConfig; }
})(typeof window !== 'undefined' ? window : globalThis);
