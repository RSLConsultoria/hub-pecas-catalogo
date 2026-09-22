// ===== js/filtros.js =====
// Logica pura do catalogo: filtrar, contar opcoes, buscar. Nao toca na
// tela nem na rede, e por isso tem teste (test/filtros.test.js).
//
// Regra dos filtros: dentro de um filtro vale OU (qualquer opcao marcada),
// entre filtros vale E. Filtro sem nada marcado nao restringe.

(function (raiz) {
  var DIACRITICOS = new RegExp('[' + String.fromCharCode(768) + '-' + String.fromCharCode(879) + ']', 'g');

  function normalizar(s) {
    return String(s === null || s === undefined ? '' : s).normalize('NFD').replace(DIACRITICOS, '').toLowerCase().trim();
  }

  // Valores da peca para um filtro, sempre como lista (vazia se nao ha).
  function valoresDe(peca, filtro) {
    var v = peca[filtro.chave];
    if (filtro.tipo === 'lista') return Array.isArray(v) ? v : [];
    if (v === null || v === undefined || String(v).trim() === '') return [];
    return [String(v)];
  }

  function faixaAtiva(sel) {
    return !!sel && (typeof sel.min === 'number' || typeof sel.max === 'number');
  }

  function passaNoFiltro(peca, filtro, sel) {
    if (filtro.tipo === 'faixa') {
      if (!faixaAtiva(sel)) return true;
      var v = peca[filtro.chave];
      if (typeof v !== 'number') return false;
      if (typeof sel.min === 'number' && v < sel.min) return false;
      if (typeof sel.max === 'number' && v > sel.max) return false;
      return true;
    }
    if (!sel || !sel.size) return true;
    return valoresDe(peca, filtro).some(function (x) { return sel.has(x); });
  }

  function aplicar(pecas, selecao, filtros, ignorarChave) {
    selecao = selecao || {};
    return (pecas || []).filter(function (p) {
      return filtros.every(function (f) {
        if (f.chave === ignorarChave) return true;
        return passaNoFiltro(p, f, selecao[f.chave]);
      });
    });
  }

  // Quantas pecas cada opcao traria, com os OUTROS filtros aplicados. Ignorar
  // o proprio filtro e o que torna a contagem util: mostra o que acontece se
  // voce marcar mais uma opcao ali.
  function contarOpcoes(pecas, selecao, filtros, chave) {
    var filtro = filtros.filter(function (f) { return f.chave === chave; })[0];
    if (!filtro || filtro.tipo === 'faixa') return [];
    var cont = {};
    aplicar(pecas, selecao, filtros, chave).forEach(function (p) {
      var vistos = {};
      valoresDe(p, filtro).forEach(function (v) {
        if (vistos[v]) return;
        vistos[v] = true;
        cont[v] = (cont[v] || 0) + 1;
      });
    });
    return Object.keys(cont).map(function (v) { return { valor: v, n: cont[v] }; })
      .sort(function (a, b) { return b.n - a.n || a.valor.localeCompare(b.valor, 'pt-BR'); });
  }

  // Busca por texto em referencia MRBL, descricao e referencia do cliente,
  // sem acento e sem caixa. Varias palavras: a peca tem que ter todas.
  function buscar(pecas, termo) {
    var palavras = normalizar(termo).split(/\s+/).filter(function (x) { return x; });
    if (!palavras.length) return (pecas || []).slice();
    return (pecas || []).filter(function (p) {
      var alvo = normalizar([p.ref_mrbl, p.descricao, p.ref_cliente].join(' '));
      return palavras.every(function (w) { return alvo.indexOf(w) >= 0; });
    });
  }

  function faixaDeValores(pecas) {
    var nums = (pecas || []).map(function (p) { return p.valor_peca; }).filter(function (v) { return typeof v === 'number'; });
    if (!nums.length) return null;
    return { min: Math.min.apply(null, nums), max: Math.max.apply(null, nums) };
  }

  var HubFiltros = { aplicar: aplicar, contarOpcoes: contarOpcoes, buscar: buscar, faixaDeValores: faixaDeValores, normalizar: normalizar };
  raiz.HubFiltros = HubFiltros;
  if (typeof module !== 'undefined') { module.exports = HubFiltros; }
})(typeof window !== 'undefined' ? window : globalThis);
