# Consulta de CEP com Mapa (OpenStreetMap)

## Autor

José Guilherme Ferreira dos Santos
Matricula: 22408953

## Descrição

Este projeto é uma aplicação web frontend que consulta CEPs brasileiros e exibe:

- CEP
- Logradouro
- Bairro
- Cidade
- Estado (UF)
- Latitude e Longitude
- Mapa interativo com marcador (OpenStreetMap)

A aplicação usa o ViaCEP para buscar os dados do endereço e o Nominatim/OpenStreetMap para converter endereço em coordenadas geográficas.

---

## Funcionalidades

- Validação de CEP (8 dígitos, com ou sem hífen)
- Consulta assíncrona com `fetch`
- Exibição de dados completos do endereço
- Integração com mapa interativo usando Leaflet
- Marcador de localização no mapa
- Tratamento de erros:
  - CEP inválido
  - CEP não encontrado
  - Falha de conexão/API
- Indicador de precisão da localização (alta, média ou baixa)

---

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript (ES6+)
- [ViaCEP](https://viacep.com.br/)
- [Leaflet](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Nominatim](https://nominatim.org/)

---

## Estrutura do projeto

```bash
consultaCEP/
├── index.html
├── style.css
├── script.js
└── README.md
```

---

## Como executar localmente

1. Clone o repositório:

   ```bash
   git clone https://github.com/joseguilherme01/bootcamp2-app.git
   ```

2. Acesse a pasta do projeto:

   ```bash
   cd consultaCEP
   ```

3. Abra o arquivo `index.html` no navegador  
   (ou rode com a extensão **Live Server** no VS Code).

---

## Publicação (GitHub Pages)

A aplicação foi publicada com GitHub Pages e está disponível em:

🔗 **https://joseguilherme01.github.io/bootcamp2-app/**

Repositório público:

🔗 **https://github.com/joseguilherme01/bootcamp2-app**

---

## Observação sobre geolocalização

A API ViaCEP fornece dados postais oficiais.  
Já a posição no mapa depende da base cartográfica do OpenStreetMap/Nominatim e pode variar entre:

- ponto exato da via/região,
- centro aproximado do CEP,
- ou aproximação por bairro/cidade em alguns casos.

Por isso, o projeto exibe um indicador de precisão para deixar claro o nível da localização encontrada.

---
