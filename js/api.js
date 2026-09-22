// ===== js/api.js =====
// Busca o catalogo no webhook do n8n com a senha no cabecalho. Devolve o
// catalogo ou lanca um erro com .tipo = 'senha' | 'servidor' | 'rede', para
// a tela saber o que dizer.

(function (raiz) {
  function erro(tipo, mensagem) {
    var e = new Error(mensagem);
    e.tipo = tipo;
    return e;
  }

  function carregar(senha) {
    if (/[?&]demo\b/.test(raiz.location ? raiz.location.search : '')) {
      return Promise.resolve(JSON.parse(JSON.stringify(raiz.HubDemo)));
    }
    var cabecalhos = {};
    cabecalhos[raiz.HubConfig.CABECALHO_SENHA] = senha;
    return fetch(raiz.HubConfig.WEBHOOK_URL, { headers: cabecalhos, cache: 'no-store' })
      .catch(function () { throw erro('rede', 'Sem conexão com o servidor.'); })
      .then(function (r) {
        // O n8n responde 403 para senha ausente ou errada.
        if (r.status === 401 || r.status === 403) throw erro('senha', 'Senha incorreta.');
        if (!r.ok) throw erro('servidor', 'O servidor respondeu ' + r.status + '.');
        return r.json().catch(function () { throw erro('servidor', 'Resposta inválida do servidor.'); });
      });
  }

  raiz.HubApi = { carregar: carregar };
})(typeof window !== 'undefined' ? window : globalThis);
