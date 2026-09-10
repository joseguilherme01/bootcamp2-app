# Consulta de CEP com Mapa (OpenStreetMap)

## Autor

José Guilherme Ferreira dos Santos — Matrícula 22408953

## Descrição

Aplicação web frontend que consulta CEPs brasileiros e exibe informações de endereço (logradouro, bairro, cidade e UF), além de mostrar a localização no mapa com OpenStreetMap (Leaflet).

## API utilizada

- **ViaCEP** (dados do endereço por CEP)  
  Documentação: https://viacep.com.br  
  Endpoint: `https://viacep.com.br/ws/{cep}/json/`

- **Nominatim / OpenStreetMap** (geocodificação para coordenadas)  
  Documentação: https://nominatim.org/release-docs/latest/api/Search/  
  Endpoint base: `https://nominatim.openstreetmap.org/search`

## Funcionalidades

- Busca de CEP com validação (8 dígitos)
- Requisição assíncrona com `fetch`
- Exibição de múltiplas informações do JSON (CEP, logradouro, bairro, cidade, estado)
- Exibição de latitude e longitude
- Mapa interativo com marcador (Leaflet + OpenStreetMap)
- Mapa pode apresentar localização aproximada em alguns CEPs, conforme base cartográfica disponível
- Tratamento de erros amigável:
  - CEP inválido
  - CEP não encontrado
  - Falha de conexão/API indisponível
- Indicação de precisão da localização no mapa (alta/média/baixa)

## Tecnologias

- HTML5
- CSS3
- JavaScript (ES6+)
- Leaflet.js
- OpenStreetMap

## Como executar localmente

1. Clone o repositório:
   `git clone URL_DO_REPOSITORIO`
2. Entre na pasta do projeto:
   `cd bootcamp2-app`
3. Abra o `index.html` no navegador (ou use a extensão Live Server no VS Code).

## Como publicar no GitHub Pages

1. No GitHub, acesse **Settings** do repositório.
2. Vá em **Pages**.
3. Em **Source**, selecione **Deploy from a branch**.
4. Escolha a branch **main** e pasta **/(root)**.
5. Salve e aguarde o link público ser gerado.

## Links

- **Aplicação no ar (GitHub Pages):** https://SEU-USUARIO.github.io/bootcamp2-app/
- **Repositório público:** https://github.com/SEU-USUARIO/bootcamp2-app
