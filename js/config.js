// ===== js/config.js =====
// Configuracao do catalogo. Incluir um filtro novo e acrescentar uma linha
// em FILTROS - a tela se monta sozinha a partir desta lista.
//
// tipo 'texto': a peca tem um valor (cliente, colecao...)
// tipo 'lista': a peca tem varios (tecidos, composicoes...)
// tipo 'faixa': numero com minimo e maximo (valor por peca)
//
// Nada aqui e segredo: a senha fica no aparelho de quem usa, e os dados so
// saem do webhook para quem tem a senha.

(function (raiz) {
  var HubConfig = {
    WEBHOOK_URL: 'https://mrbl-automacoes.duckdns.org/webhook/hub-pecas',
    CABECALHO_SENHA: 'X-Hub-Senha',
    CHAVE_SENHA_LOCAL: 'hubPecasSenha',
    FILTROS: [
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
