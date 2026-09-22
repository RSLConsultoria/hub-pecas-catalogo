// ===== js/app.js =====
// Liga tudo: senha, carregamento, estado dos filtros e da busca, painel de
// detalhe e o link direto para uma peca (#referencia na URL).

(function () {
  var C = window.HubConfig;
  var F = window.HubFiltros;
  var T = window.HubTela;
  var $ = function (id) { return document.getElementById(id); };

  var estado = {
    catalogo: null,
    selecao: {},
    termo: '',
    soFoto: false,
    ui: { abertos: { detalhes: true }, verTodos: {}, busca: {} }
  };

  // ---------- Senha ----------
  function lerSenha() { try { return localStorage.getItem(C.CHAVE_SENHA_LOCAL) || ''; } catch (e) { return ''; } }
  function gravarSenha(s) { try { localStorage.setItem(C.CHAVE_SENHA_LOCAL, s); } catch (e) { /* aba privada: vale so para esta visita */ } }
  function apagarSenha() { try { localStorage.removeItem(C.CHAVE_SENHA_LOCAL); } catch (e) { /* idem */ } }
  var senhaDaSessao = '';

  function mostrarEntrada(mensagem) {
    $('app').hidden = true;
    $('carregando').hidden = true;
    $('entrada').hidden = false;
    var erro = $('erro-senha');
    erro.textContent = mensagem || '';
    erro.hidden = !mensagem;
    $('campo-senha').value = '';
    $('campo-senha').focus();
  }

  // A escolha "so com foto" fica lembrada no aparelho. Comeca ligada.
  var CHAVE_SO_FOTO = 'hubPecasSoFoto';
  function lerSoFoto() { try { return localStorage.getItem(CHAVE_SO_FOTO) !== '0'; } catch (e) { return true; } }
  function gravarSoFoto(v) { try { localStorage.setItem(CHAVE_SO_FOTO, v ? '1' : '0'); } catch (e) { /* aba privada */ } }

  function modoDemo() { return /[?&]demo\b/.test(location.search); }

  // ---------- Carregar ----------
  function carregar(senha) {
    $('entrada').hidden = true;
    $('carregando').hidden = false;
    window.HubApi.carregar(senha).then(function (catalogo) {
      estado.catalogo = catalogo;
      senhaDaSessao = senha;
      if (!modoDemo()) gravarSenha(senha);
      $('carregando').hidden = true;
      $('app').hidden = false;
      $('atualizado').textContent = T.quando(catalogo.atualizado_em);
      desenhar();
      abrirPeloHash();
    }).catch(function (e) {
      if (e.tipo === 'senha') {
        apagarSenha();
        mostrarEntrada('Senha incorreta. Confira com quem administra o catálogo.');
        return;
      }
      $('carregando').hidden = true;
      $('app').hidden = false;
      $('grade').textContent = '';
      T.estado($('estado'), 'Não foi possível carregar o catálogo',
        e.tipo === 'rede' ? 'Verifique a conexão com a internet e tente de novo.' : e.message + ' Tente de novo em alguns minutos.',
        'Tentar de novo', function () { carregar(senha); });
    });
  }

  // ---------- Desenhar ----------
  function contarAtivos() {
    return Object.keys(estado.selecao).reduce(function (n, k) {
      var s = estado.selecao[k];
      if (s instanceof Set) return n + (s.size ? 1 : 0);
      if (s && s.familias) return n + Object.keys(s.familias).length;
      return n + (s && (typeof s.min === 'number' || typeof s.max === 'number') ? 1 : 0);
    }, 0);
  }

  function desenhar() {
    var todas = estado.catalogo.pecas || [];
    // So com foto vale antes de tudo: as contagens dos filtros ja mostram
    // quantas pecas COM FOTO cada opcao traz.
    var base = F.buscar(estado.soFoto ? F.soComFoto(todas) : todas, estado.termo);
    var visiveis = F.aplicar(base, estado.selecao, C.FILTROS);
    var ativos = contarAtivos();

    $('contador').innerHTML = '';
    var b = document.createElement('b');
    b.textContent = String(visiveis.length);
    $('contador').append(b, ' de ' + todas.length + ' peças');
    $('abrir-filtros').textContent = ativos ? 'Filtros (' + ativos + ')' : 'Filtros';
    $('limpar').hidden = !ativos;
    $('so-foto').setAttribute('aria-pressed', String(estado.soFoto));

    T.filtros($('lista-filtros'), base, estado.selecao, C.FILTROS, estado.ui, { marcar: marcar, faixa: faixa, detalhe: detalhe, qtdDetalhe: qtdDetalhe });
    T.grade($('grade'), visiveis, abrir);

    var aviso = $('estado');
    aviso.hidden = true;
    if (!todas.length) {
      T.estado(aviso, 'Ainda não há peças no catálogo', 'Assim que o sincronismo com o Ploomes rodar, elas aparecem aqui.');
    } else if (!visiveis.length) {
      T.estado(aviso, 'Nenhuma peça com esses filtros',
        estado.soFoto ? 'Desligue "Só com foto" ou tire algum filtro para ver mais peças.'
          : estado.termo ? 'Tente outra busca ou tire algum filtro.' : 'Tire algum filtro para ver mais peças.',
        estado.soFoto ? 'Mostrar todas as peças' : 'Limpar filtros e busca',
        estado.soFoto ? function () { estado.soFoto = false; gravarSoFoto(false); limparTudo(); } : limparTudo);
    }
  }

  function marcar(chave, valor, ligado) {
    var s = estado.selecao[chave] || new Set();
    if (ligado) s.add(valor); else s.delete(valor);
    estado.selecao[chave] = s;
    desenhar();
  }

  function numero(texto) {
    var n = parseFloat(String(texto).replace(',', '.'));
    return isFinite(n) ? n : undefined;
  }

  function faixa(chave, min, max) {
    estado.selecao[chave] = { min: numero(min), max: numero(max) };
    desenhar();
  }

  function familiasMarcadas() {
    var s = estado.selecao.detalhes || (estado.selecao.detalhes = { familias: {} });
    return s.familias;
  }

  function detalhe(chave, ligado) {
    var f = familiasMarcadas();
    if (ligado) f[chave] = f[chave] || {};
    else delete f[chave];
    desenhar();
  }

  function qtdDetalhe(chave, min, max) {
    familiasMarcadas()[chave] = { min: numero(min), max: numero(max) };
    desenhar();
  }

  function limparTudo() {
    estado.selecao = {};
    estado.termo = '';
    $('busca').value = '';
    desenhar();
  }

  // ---------- Painel ----------
  var ultimoFoco = null;

  function abrir(ref) {
    if (decodeURIComponent(location.hash.slice(1)) !== ref) location.hash = encodeURIComponent(ref);
    else abrirPeloHash();
  }

  function abrirPeloHash() {
    if (!estado.catalogo) return;
    var ref = decodeURIComponent(location.hash.slice(1));
    var p = ref && (estado.catalogo.pecas || []).filter(function (x) { return x.ref_mrbl === ref; })[0];
    if (!p) { fecharPainel(false); return; }
    ultimoFoco = ultimoFoco || document.activeElement;
    var todas = estado.catalogo.pecas || [];
    T.painel($('painel'), p, function () { fecharPainel(true); }, {
      familias: C.DETALHES,
      detalhes: F.detalhesDaPeca(p, C.DETALHES),
      parecidas: F.parecidas(p, todas, C.DETALHES, 8),
      aoAbrir: abrir
    });
    $('painel').hidden = false;
    $('fundo-painel').hidden = false;
    document.body.style.overflow = 'hidden';
    $('painel').scrollTop = 0;
    $('painel').focus();
  }

  function fecharPainel(limparHash) {
    if ($('painel').hidden) return;
    $('painel').hidden = true;
    $('fundo-painel').hidden = true;
    document.body.style.overflow = '';
    if (limparHash && location.hash) history.pushState('', document.title, location.pathname + location.search);
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
    ultimoFoco = null;
  }

  // ---------- Filtros no celular ----------
  function abrirFiltros(sim) {
    $('filtros').classList.toggle('aberto', sim);
    $('abrir-filtros').setAttribute('aria-expanded', String(sim));
  }

  // ---------- Eventos ----------
  $('form-senha').addEventListener('submit', function (e) {
    e.preventDefault();
    var s = $('campo-senha').value.trim();
    if (s) carregar(s);
  });
  $('sair').addEventListener('click', function () {
    apagarSenha();
    senhaDaSessao = '';
    estado.catalogo = null;
    fecharPainel(true);
    mostrarEntrada('');
  });
  var espera = null;
  $('busca').addEventListener('input', function (e) {
    clearTimeout(espera);
    espera = setTimeout(function () { estado.termo = e.target.value; desenhar(); }, 120);
  });
  $('limpar').addEventListener('click', limparTudo);
  $('so-foto').addEventListener('click', function () {
    estado.soFoto = !estado.soFoto;
    gravarSoFoto(estado.soFoto);
    desenhar();
  });
  $('abrir-filtros').addEventListener('click', function () { abrirFiltros(true); });
  $('fechar-filtros').addEventListener('click', function () { abrirFiltros(false); });
  $('fundo-painel').addEventListener('click', function () { fecharPainel(true); });
  window.addEventListener('hashchange', abrirPeloHash);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('painel').hidden) fecharPainel(true);
    else abrirFiltros(false);
  });

  // ---------- Inicio ----------
  estado.soFoto = lerSoFoto();
  var guardada = lerSenha();
  if (modoDemo()) carregar('demo');
  else if (guardada) carregar(guardada);
  else mostrarEntrada('');
})();
