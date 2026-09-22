# HUB de Peças — catálogo

Catálogo interno das peças já produzidas pela MRBL: filtros por cliente, coleção, tecido, composição e pelo que tem na peça (zíper, botão, travete, com quantidade), busca por referência, peças parecidas e a ficha técnica completa de cada peça.

**Este repositório tem só o código da página.** Nenhuma peça, cliente ou preço está aqui. Os dados vêm, na hora, de um webhook do n8n que só responde com a senha do catálogo — e a senha fica guardada apenas no aparelho de quem usa.

## Como funciona

```
Ploomes CRM ──(sync n8n, de hora em hora)──► Google Sheets ──(webhook com senha)──► esta página
```

- **Primeiro acesso:** a página pede a senha do catálogo e a guarda no aparelho. "Sair" apaga.
- **Link direto para uma peça:** a referência vai na URL (`…/#226.17.01177X`), então dá para mandar no WhatsApp.
- **Demonstração sem senha:** abra com `?demo` no fim do endereço. Mostra peças inventadas.

## Onde mexer

| Quero… | Arquivo |
|---|---|
| incluir ou tirar um filtro | `js/config.js`, lista `FILTROS` |
| incluir um item em "Tem na peça" | `js/config.js`, lista `DETALHES` |
| mudar como os filtros combinam | `js/filtros.js` (tem teste) |
| mudar a aparência | `css/estilo.css` |
| mudar o que aparece no card ou na ficha | `js/tela.js` |

## Testes

```bash
npm test
```

Só a lógica de filtro, contagem, busca e peças parecidas tem teste automático; os dados de teste são inventados.

## Publicação

GitHub Pages servindo a branch `main`, raiz. Não há build: os arquivos são publicados como estão.

O webhook só aceita chamadas vindas de `https://rslconsultoria.github.io`. Para testar localmente, sirva a pasta na porta 8080 (`python -m http.server 8080`) — essa origem está liberada enquanto durar o desenvolvimento.
