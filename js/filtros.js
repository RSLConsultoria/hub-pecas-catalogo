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

  // ---------- Detalhes da peca (o que "tem na peca") ----------
  // Cada familia (ziper, botao, travete...) casa pelo nome do produto da
  // linha de proposta. A quantidade vem do campo "Quantidade - ..." ou
  // "Qtd consumo - ..." da linha, somado entre as linhas da mesma familia.

  function nomeProduto(produto) {
    // "A. TECIDO 1" e "- CASEADO DE OLHO" -> sem o prefixo de ordenacao.
    return normalizar(produto).replace(/^([a-z]\.|-)\s*/, '');
  }

  function numeroDe(v) {
    var n = parseFloat(String(v === null || v === undefined ? '' : v).replace(',', '.'));
    return isFinite(n) ? n : null;
  }

  function quantidadeDaLinha(m) {
    var campo = (m.campos || []).filter(function (c) {
      return /^(quantidade|qtd consumo)\b/.test(normalizar(c.nome));
    })[0];
    return campo ? numeroDe(campo.valor) : numeroDe(m.quantidade);
  }

  // { ziper: { qtd: 2 }, travete: { qtd: null } } - so as familias presentes.
  // Fica guardado na propria peca: recalcular a cada tecla seria desperdicio.
  function detalhesDaPeca(peca, familias) {
    if (peca.__detalhes && peca.__detalhesDe === familias) return peca.__detalhes;
    var regras = familias.map(function (f) { return { f: f, re: new RegExp(f.padrao) }; });
    var det = {};
    (peca.materiais || []).forEach(function (m) {
      var nome = nomeProduto(m && m.produto);
      if (!nome) return;
      regras.forEach(function (r) {
        if (!r.re.test(nome)) return;
        var d = det[r.f.chave] || (det[r.f.chave] = { qtd: null });
        var q = quantidadeDaLinha(m);
        if (q !== null) d.qtd = (d.qtd || 0) + q;
      });
    });
    Object.defineProperty(peca, '__detalhes', { value: det, configurable: true, writable: true });
    Object.defineProperty(peca, '__detalhesDe', { value: familias, configurable: true, writable: true });
    return det;
  }

  function passaNosDetalhes(peca, filtro, sel) {
    var pedidos = sel && sel.familias ? Object.keys(sel.familias) : [];
    if (!pedidos.length) return true;
    var det = detalhesDaPeca(peca, filtro.familias);
    return pedidos.every(function (k) {
      var d = det[k];
      if (!d) return false;
      var faixa = sel.familias[k] || {};
      if (!faixaAtiva(faixa)) return true;
      if (typeof d.qtd !== 'number') return false;
      if (typeof faixa.min === 'number' && d.qtd < faixa.min) return false;
      if (typeof faixa.max === 'number' && d.qtd > faixa.max) return false;
      return true;
    });
  }

  // Quantas pecas tem cada familia, com todos os filtros valendo. Como entre
  // familias vale E, e exatamente quantas sobrariam marcando mais aquela.
  function contarDetalhes(pecas, selecao, filtros, chave) {
    var filtro = filtros.filter(function (f) { return f.chave === chave; })[0];
    if (!filtro) return [];
    var cont = {};
    var qtds = {};
    aplicar(pecas, selecao, filtros).forEach(function (p) {
      var det = detalhesDaPeca(p, filtro.familias);
      Object.keys(det).forEach(function (k) {
        cont[k] = (cont[k] || 0) + 1;
        if (typeof det[k].qtd === 'number') (qtds[k] = qtds[k] || []).push(det[k].qtd);
      });
    });
    return filtro.familias
      .map(function (f) {
        var q = qtds[f.chave];
        return { chave: f.chave, rotulo: f.rotulo, n: cont[f.chave] || 0,
          qtd: q ? { min: Math.min.apply(null, q), max: Math.max.apply(null, q) } : null };
      })
      .sort(function (a, b) { return b.n - a.n || a.rotulo.localeCompare(b.rotulo, 'pt-BR'); });
  }

  function passaNoFiltro(peca, filtro, sel) {
    if (filtro.tipo === 'detalhes') return passaNosDetalhes(peca, filtro, sel);
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
    if (!filtro || filtro.tipo === 'faixa' || filtro.tipo === 'detalhes') return [];
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

  // Peca com pelo menos uma foto (frente ou costas).
  function soComFoto(pecas) {
    return (pecas || []).filter(function (p) {
      return String(p.foto_frente || '').trim() !== '' || String(p.foto_costas || '').trim() !== '';
    });
  }

  // ---------- Pecas parecidas ----------
  // Pontua por: mesmo tipo de peca (primeira palavra da descricao: CALCA,
  // CAMISA...), outras palavras da descricao, tecidos e composicao em comum,
  // tipo de tecido, os mesmos detalhes (ziper, botao...) e mesmo cliente.
  // Sem o mesmo tipo de peca, precisa de muita coisa em comum para aparecer.
  function palavras(texto) {
    return normalizar(texto).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 2; });
  }

  function comum(a, b) {
    var sb = {};
    (b || []).forEach(function (x) { sb[normalizar(x)] = true; });
    return (a || []).filter(function (x) { return sb[normalizar(x)]; }).length;
  }

  function pontuar(a, b, familias) {
    var pa = palavras(a.descricao), pb = palavras(b.descricao);
    var pontos = 0;
    if (pa[0] && pa[0] === pb[0]) pontos += 5;
    pontos += Math.min(comum(pa.slice(1), pb.slice(1)), 2);
    pontos += Math.min(comum(a.tecidos, b.tecidos), 2) * 2;
    pontos += Math.min(comum(a.composicoes, b.composicoes), 1) * 2;
    pontos += Math.min(comum(a.tipos_tecido, b.tipos_tecido), 1);
    if (familias && familias.length) {
      var da = Object.keys(detalhesDaPeca(a, familias)), db = Object.keys(detalhesDaPeca(b, familias));
      var uniao = da.length + db.length - comum(da, db);
      if (uniao) pontos += 3 * comum(da, db) / uniao;
    }
    if (a.cliente && a.cliente === b.cliente) pontos += 1;
    return pontos;
  }

  var MINIMO_PARECIDA = 5;

  function parecidas(peca, pecas, familias, limite) {
    var comFoto = function (p) { return String(p.foto_frente || p.foto_costas || '').trim() !== ''; };
    return (pecas || [])
      .filter(function (p) { return p !== peca && p.ref_mrbl !== peca.ref_mrbl; })
      .map(function (p) { return { p: p, pontos: pontuar(peca, p, familias) }; })
      .filter(function (x) { return x.pontos >= MINIMO_PARECIDA; })
      .sort(function (x, y) {
        return y.pontos - x.pontos || (comFoto(y.p) ? 1 : 0) - (comFoto(x.p) ? 1 : 0) || (x.p.ref_mrbl < y.p.ref_mrbl ? 1 : -1);
      })
      .slice(0, limite || 8)
      .map(function (x) { return x.p; });
  }

  var HubFiltros = {
    aplicar: aplicar, contarOpcoes: contarOpcoes, contarDetalhes: contarDetalhes, detalhesDaPeca: detalhesDaPeca,
    parecidas: parecidas, buscar: buscar, faixaDeValores: faixaDeValores, soComFoto: soComFoto, normalizar: normalizar
  };
  raiz.HubFiltros = HubFiltros;
  if (typeof module !== 'undefined') { module.exports = HubFiltros; }
})(typeof window !== 'undefined' ? window : globalThis);
