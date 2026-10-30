## Quando eu te pedir algo, antes de sair fazendo:
- Analise o código do projeto.
- Entenda a causa.
- Me proponha a melhor solução para o problema seguindo os padrões internacionais.

## Git
- No final de cada implementação:
-- Faça commit automático com uma descrição clara do que foi feito.
-- Envie para o remoto.

## Arquitetura
- React Web
- JavaScript
- Tailwind CSS
- SQLite (banco local)

## Estrutura do voto
- Ano da eleição: selecionado pelo usuário
- TSE (Brasil)
- TRE (Estado)
- Município
- Zona Eleitoral
- Local de Votação (Colégio)
- Seção (Urna)
-- Primeiro Turno
-- Segundo Turno

## Documentação Oficial
- https://www.tse.jus.br/eleicoes/informacoes-tecnicas-sobre-a-divulgacao-de-resultados

## Layout
- Tons de verde e amarelo

## Páginas
- Home com menu
-- Consulta Simples
-- Comparativo entre Seções

## A melhor estratégia: Abordagem Modular (Passo a Passo)
Dividir em etapas independentes gasta muito menos tokens e garante commits limpos após cada funcionalidade (seguindo a regra do seu projeto):
Etapa 1: Gráficos e Analytics Visuais (ex: Recharts/Chart.js na Consulta e no Comparativo).
Etapa 2: Exportação e Relatórios (CSV / Impressão e PDF do Boletim).
Etapa 3: Sincronizador TSE sob Demanda via UI (botão na tela para puxar dados sem precisar rodar comando manual).
Etapa 4: Mapa Interativo de Locais (Leaflet com marcadores dos colégios).