// ===== js/tela.js =====
// Tudo que desenha na tela. Monta o DOM com textContent, nunca com
// innerHTML de dado: o conteudo vem do CRM e e digitado por pessoas.

(function (raiz) {
  var doc = raiz.document;

  // h('div.classe', { atributos }, filhos...) - fabrica de elementos.
  function h(seletor, attrs) {
    var partes = seletor.split('.');
    var el = doc.createElement(partes[0] || 'div');
    if (partes.length > 1) el.className = partes.slice(1).join(' ');
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'texto') el.textContent = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var f = arguments[i];
      if (f === null || f === undefined || f === false) continue;
      (Array.isArray(f) ? f : [f]).forEach(function (x) {
        if (x !== null && x !== undefined && x !== false) el.appendChild(typeof x === 'string' ? doc.createTextNode(x) : x);
      });
    }
    return el;
  }

  function limpar(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  // Os nomes de campo do Ploomes trazem marcadores como o circulo amarelo
  // (campo obrigatorio no CRM). Na ficha eles so atrapalham a leitura.
  var EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;
  function nomeLimpo(nome) { return String(nome || '').replace(EMOJI, '').trim(); }

  function iniciais(texto) {
    var palavras = String(texto || '').trim().split(/\s+/).filter(function (p) { return p.length > 1; });
    if (!palavras.length) return '?';
    return (palavras[0][0] + (palavras[1] ? palavras[1][0] : '')).toUpperCase();
  }

  // Sem foto: a trama do tecido com as iniciais em fio dourado.
  function semFoto(descricao, legenda) {
    return h('div.sem-foto.trama', { role: 'img', 'aria-label': 'Sem foto: ' + (descricao || 'peça') },
      h('span', {}, iniciais(descricao), legenda ? h('small', { texto: legenda }) : null));
  }

  // Foto que troca sozinha pelo placeholder se a URL falhar (link do
  // Ploomes pode expirar ou sumir).
  function foto(url, descricao, classe, legenda) {
    if (!url) return semFoto(descricao, legenda);
    var img = h('img' + (classe ? '.' + classe : ''), { src: url, alt: descricao || 'Foto da peça', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', function () { img.replaceWith(semFoto(descricao, legenda)); });
    return img;
  }

  var moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function valor(v) { return typeof v === 'number' ? moeda.format(v) : ''; }

  function quando(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    var hoje = new Date();
    if (d.toDateString() === hoje.toDateString()) return 'Atualizado hoje às ' + hora;
    return 'Atualizado em ' + d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + hora;
  }

  // ---------- Grade ----------
  function grade(ul, pecas, aoAbrir) {
    limpar(ul);
    var frag = doc.createDocumentFragment();
    pecas.forEach(function (p) {
      frag.appendChild(h('li.peca', {},
        h('button.peca-botao', { type: 'button', onclick: function () { aoAbrir(p.ref_mrbl); } },
          foto(p.foto_frente, p.descricao, 'peca-foto'),
          h('span.peca-etiqueta', {},
            h('span.peca-ref', { texto: p.ref_mrbl }),
            h('span.peca-desc', { texto: p.descricao || 'Sem descrição' }),
            h('span.peca-rodape', {},
              p.cliente ? h('span.peca-cliente', { texto: p.cliente }) : h('span'),
              typeof p.valor_peca === 'number' ? h('span.peca-valor', { texto: valor(p.valor_peca) }) : null)))));
    });
    ul.appendChild(frag);
  }

  // ---------- Estados (vazio, sem resultado, erro) ----------
  function estado(div, titulo, texto, botao, aoClicar) {
    limpar(div);
    div.appendChild(h('h2', { texto: titulo }));
    if (texto) div.appendChild(h('p', { texto: texto }));
    if (botao) div.appendChild(h('button.botao-primario', { type: 'button', onclick: aoClicar, texto: botao }));
    div.hidden = false;
  }

  // ---------- Filtros ----------
  var LIMITE_OPCOES = 8;

  function opcoesDoFiltro(ul, f, contagem, marcados, ui, aoMudar) {
    limpar(ul);
    var termo = raiz.HubFiltros.normalizar(ui.busca[f.chave] || '');
    // Marcados sempre aparecem, mesmo com contagem zero, para dar para desmarcar.
    var lista = contagem.slice();
    marcados.forEach(function (v) { if (!lista.some(function (o) { return o.valor === v; })) lista.push({ valor: v, n: 0 }); });
    if (termo) lista = lista.filter(function (o) { return raiz.HubFiltros.normalizar(o.valor).indexOf(termo) >= 0; });
    var todos = ui.verTodos[f.chave] || termo;
    var visiveis = todos ? lista : lista.slice(0, LIMITE_OPCOES);
    visiveis.forEach(function (o) {
      var id = 'f-' + f.chave + '-' + o.valor.replace(/[^\w]/g, '_');
      ul.appendChild(h('li.opcao' + (o.n === 0 ? '.zerada' : ''), {},
        h('label', { for: id },
          h('input', {
            id: id, type: 'checkbox', checked: marcados.has(o.valor),
            onchange: function (e) { aoMudar(f.chave, o.valor, e.target.checked); }
          }),
          h('span', { texto: o.valor }),
          h('span.n', { texto: String(o.n) }))));
    });
    if (!todos && lista.length > LIMITE_OPCOES) {
      ul.appendChild(h('li.ver-mais', {}, h('button.botao-texto', {
        type: 'button', texto: 'Ver todas (' + lista.length + ')',
        onclick: function () { ui.verTodos[f.chave] = true; opcoesDoFiltro(ul, f, contagem, marcados, ui, aoMudar); }
      })));
    }
    if (!lista.length) ul.appendChild(h('li.opcao', {}, h('span.n', { texto: 'Nada encontrado' })));
  }

  // "Tem na peca": marcar a familia exige que a peca tenha; com ela marcada,
  // aparece a quantidade (de / ate) para quem quer, por exemplo, 20 travetes.
  function listaDetalhes(f, contagem, sel, acoes) {
    var marcadas = (sel && sel.familias) || {};
    var ul = h('ul.opcoes.detalhes', {});
    contagem.forEach(function (o) {
      var ligada = Object.prototype.hasOwnProperty.call(marcadas, o.chave);
      if (!ligada && o.n === 0) return;
      var id = 'd-' + o.chave;
      var li = h('li.opcao' + (ligada ? '.ligada' : ''), {},
        h('label', { for: id },
          h('input', { id: id, type: 'checkbox', checked: ligada, onchange: function (e) { acoes.detalhe(o.chave, e.target.checked); } }),
          h('span', { texto: o.rotulo }),
          h('span.n', { texto: String(o.n) })));
      if (ligada && o.qtd) {
        var faixa = marcadas[o.chave] || {};
        var campo = function (lado) {
          return h('input', {
            type: 'number', inputmode: 'numeric', min: '0', step: '1',
            placeholder: String(lado === 'min' ? o.qtd.min : o.qtd.max),
            value: typeof faixa[lado] === 'number' ? String(faixa[lado]) : null,
            'aria-label': (lado === 'min' ? 'Quantidade mínima de ' : 'Quantidade máxima de ') + o.rotulo.toLowerCase()
          });
        };
        var de = campo('min'), ate = campo('max');
        var mudar = function () { acoes.qtdDetalhe(o.chave, de.value, ate.value); };
        de.addEventListener('change', mudar);
        ate.addEventListener('change', mudar);
        li.appendChild(h('div.qtd', {}, h('span', { texto: 'Quantidade' }), de, h('span', { texto: 'a' }), ate));
      }
      ul.appendChild(li);
    });
    if (!ul.children.length) ul.appendChild(h('li.opcao', {}, h('span.n', { texto: 'Nada encontrado' })));
    return ul;
  }

  function filtros(container, base, selecao, lista, ui, acoes) {
    var rolagem = container.parentNode ? container.parentNode.scrollTop : 0;
    limpar(container);
    lista.forEach(function (f) {
      var sel = selecao[f.chave];
      var ativos = f.tipo === 'faixa'
        ? (sel && (typeof sel.min === 'number' || typeof sel.max === 'number') ? 1 : 0)
        : f.tipo === 'detalhes' ? (sel && sel.familias ? Object.keys(sel.familias).length : 0)
          : (sel ? sel.size : 0);
      var det = h('details.filtro', { open: !!ui.abertos[f.chave] || ativos > 0 },
        h('summary', {}, h('span', {}, f.rotulo, ativos && f.tipo !== 'faixa' ? h('span.filtro-ativos', { texto: String(ativos) }) : null)));
      det.addEventListener('toggle', function () { ui.abertos[f.chave] = det.open; });

      if (f.tipo === 'detalhes') {
        det.appendChild(listaDetalhes(f, raiz.HubFiltros.contarDetalhes(base, selecao, lista, f.chave), sel, acoes));
      } else if (f.tipo === 'faixa') {
        var faixa = raiz.HubFiltros.faixaDeValores(base);
        var min = h('input', { type: 'number', inputmode: 'decimal', min: '0', step: '1', placeholder: faixa ? String(Math.floor(faixa.min)) : '', value: sel && typeof sel.min === 'number' ? String(sel.min) : null });
        var max = h('input', { type: 'number', inputmode: 'decimal', min: '0', step: '1', placeholder: faixa ? String(Math.ceil(faixa.max)) : '', value: sel && typeof sel.max === 'number' ? String(sel.max) : null });
        var aplicarFaixa = function () { acoes.faixa(f.chave, min.value, max.value); };
        min.addEventListener('change', aplicarFaixa);
        max.addEventListener('change', aplicarFaixa);
        det.appendChild(h('div.faixa', {},
          h('label', {}, 'Mínimo (R$)', min),
          h('label', {}, 'Máximo (R$)', max),
          h('p.faixa-dica', { texto: 'Com a faixa preenchida, peças sem valor ficam de fora.' })));
      } else {
        var contagem = raiz.HubFiltros.contarOpcoes(base, selecao, lista, f.chave);
        var marcados = sel || new Set();
        var ul = h('ul.opcoes', {});
        if (contagem.length > LIMITE_OPCOES) {
          det.appendChild(h('input.filtro-busca', {
            type: 'search', placeholder: 'Procurar ' + f.rotulo.toLowerCase(), value: ui.busca[f.chave] || null,
            'aria-label': 'Procurar em ' + f.rotulo,
            oninput: function (e) { ui.busca[f.chave] = e.target.value; opcoesDoFiltro(ul, f, contagem, marcados, ui, acoes.marcar); }
          }));
        }
        opcoesDoFiltro(ul, f, contagem, marcados, ui, acoes.marcar);
        det.appendChild(ul);
      }
      container.appendChild(det);
    });
    if (container.parentNode) container.parentNode.scrollTop = rolagem;
  }

  // ---------- Painel de detalhe ----------
  function pares(lista) {
    var dl = h('dl.pares', {});
    lista.forEach(function (par) {
      if (par[1] === null || par[1] === undefined || String(par[1]).trim() === '') return;
      dl.appendChild(h('dt', { texto: par[0] }));
      dl.appendChild(h('dd', { texto: String(par[1]) }));
    });
    return dl.children.length ? dl : null;
  }

  function miniatura(p, aoAbrir) {
    return h('li', {}, h('button.mini', { type: 'button', onclick: function () { aoAbrir(p.ref_mrbl); } },
      foto(p.foto_frente, p.descricao, 'mini-foto'),
      h('span.peca-ref', { texto: p.ref_mrbl }),
      h('span.mini-desc', { texto: p.descricao || 'Sem descrição' }),
      typeof p.valor_peca === 'number' ? h('span.peca-valor', { texto: valor(p.valor_peca) }) : null));
  }

  function painel(art, p, aoFechar, extra) {
    extra = extra || {};
    limpar(art);
    var fotos = [
      p.foto_frente ? { url: p.foto_frente, legenda: 'Frente' } : null,
      p.foto_costas ? { url: p.foto_costas, legenda: 'Costas' } : null
    ].filter(Boolean);

    var blocoFotos = fotos.length
      ? h('div.fotos' + (fotos.length === 1 ? '.uma' : ''), {}, fotos.map(function (f) {
        return h('figure', {},
          h('a', { href: f.url, target: '_blank', rel: 'noopener', 'aria-label': 'Abrir foto ' + f.legenda.toLowerCase() + ' em tamanho real' },
            foto(f.url, p.descricao + ' — ' + f.legenda.toLowerCase(), null, f.legenda)),
          h('figcaption', { texto: f.legenda }));
      }))
      : h('div.fotos.uma', {}, semFoto(p.descricao, 'SEM FOTO'));

    var ficha = pares([
      ['Cliente', p.cliente],
      ['Coleção', p.colecao],
      ['Ref. do cliente', p.ref_cliente],
      ['Ref. coleção/ano', p.ref_colecao_ano],
      ['Tipo de demanda', p.tipo_demanda],
      ['Modelista', p.modelista],
      ['Será produzido por', p.produzido_por],
      ['Valor por peça', valor(p.valor_peca)],
      ['Tecidos', (p.tecidos || []).join(' · ')],
      ['Composição', (p.composicoes || []).join(' · ')]
    ]);

    var materiais = (p.materiais || []).filter(function (m) { return m && (m.campos || []).length; });
    var blocoTecnica = materiais.length ? h('section.bloco', {},
      h('h3', { texto: 'Ficha técnica · ' + materiais.length + (materiais.length === 1 ? ' item' : ' itens') }),
      materiais.map(function (m, i) {
        var principal = (m.campos.filter(function (c) { return /tecido$/i.test(nomeLimpo(c.nome)) || /^material/i.test(nomeLimpo(c.nome)); })[0] || m.campos[0]);
        return h('details.material', {},
          h('summary', {},
            h('span', { texto: m.produto || 'Item ' + (i + 1) }),
            principal ? h('span.resumo', { texto: principal.valor }) : null),
          pares(m.campos.map(function (c) { return [nomeLimpo(c.nome), c.valor]; })));
      })) : null;

    var tem = (extra.familias || []).map(function (f) {
      var d = extra.detalhes && extra.detalhes[f.chave];
      return d ? h('li', {}, f.rotulo, typeof d.qtd === 'number' ? h('b', { texto: '× ' + String(d.qtd).replace('.', ',') }) : null) : null;
    }).filter(Boolean);
    var blocoTem = tem.length ? h('section.bloco', {}, h('h3', { texto: 'Tem na peça' }), h('ul.tem', {}, tem)) : null;

    var blocoParecidas = (extra.parecidas || []).length ? h('section.bloco', {},
      h('h3', { texto: 'Peças parecidas' }),
      h('ul.parecidas', {}, extra.parecidas.map(function (x) { return miniatura(x, extra.aoAbrir); }))) : null;

    var blocoCards = (p.cards || []).length ? h('section.bloco', {},
      h('h3', { texto: 'No Ploomes' }),
      h('ul.cards-ploomes', {}, p.cards.map(function (c) {
        return h('li', {},
          h('span', {}, h('strong', { texto: c.funil || 'Card' }), h('span.etapa', { texto: c.etapa || '' })),
          h('a', { href: c.link, target: '_blank', rel: 'noopener', texto: 'Abrir card' }));
      }))) : null;

    art.appendChild(h('header.painel-topo', {},
      h('span.peca-ref', { texto: p.ref_mrbl }),
      h('button.botao-texto', { type: 'button', onclick: aoFechar, texto: 'Fechar' })));
    art.appendChild(h('div.painel-corpo', {},
      h('h2', { id: 'painel-titulo', texto: p.descricao || 'Sem descrição' }),
      p.cliente ? h('span.peca-cliente', { texto: p.cliente }) : null,
      blocoFotos,
      ficha ? h('section.bloco', {}, h('h3', { texto: 'Peça' }), ficha) : null,
      blocoTem,
      blocoTecnica,
      blocoParecidas,
      blocoCards));
  }

  raiz.HubTela = { grade: grade, filtros: filtros, painel: painel, estado: estado, quando: quando, nomeLimpo: nomeLimpo, iniciais: iniciais };
})(typeof window !== 'undefined' ? window : globalThis);
