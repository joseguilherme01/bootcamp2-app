const inputCep = document.getElementById("cep-input");
const botaoBuscar = document.getElementById("buscar-btn");
const areaResultado = document.getElementById("resultado");
const mapaWrapper = document.getElementById("mapa-wrapper");

let mapa = null;
let marcador = null;

function limparCep(valor) {
  return valor.replace(/\D/g, "");
}

function formatarCep(cepLimpo) {
  return cepLimpo.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

function validarCep(cep) {
  return /^[0-9]{8}$/.test(cep);
}

function normalizar(txt) {
  return (txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function renderizarErro(msg) {
  areaResultado.innerHTML = `<p class="erro">${msg}</p>`;
  mapaWrapper.classList.add("oculto");
}

function renderizarResultado(endereco, coords) {
  areaResultado.innerHTML = `
    <p><strong>CEP:</strong> ${endereco.cep}</p>
    <p><strong>Logradouro:</strong> ${endereco.logradouro || "Não informado"}</p>
    <p><strong>Bairro:</strong> ${endereco.bairro || "Não informado"}</p>
    <p><strong>Cidade:</strong> ${endereco.localidade}</p>
    <p><strong>Estado:</strong> ${endereco.uf}</p>
    <p><strong>Latitude:</strong> ${coords.lat.toFixed(6)} | <strong>Longitude:</strong> ${coords.lon.toFixed(6)}</p>
    <p class="aviso"><strong>Precisão:</strong> ${coords.precisaoTexto}</p>
  `;
}

function atualizarMapa(coords, endereco) {
  mapaWrapper.classList.remove("oculto");

  if (!mapa) {
    mapa = L.map("mapa");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapa);
  }

  const latLng = [coords.lat, coords.lon];
  mapa.setView(latLng, coords.zoom);

  if (marcador) mapa.removeLayer(marcador);
  marcador = L.marker(latLng).addTo(mapa);

  marcador
    .bindPopup(
      `
    <strong>${endereco.localidade} - ${endereco.uf}</strong><br>
    ${endereco.logradouro || "Logradouro não informado"}<br>
    ${endereco.bairro || "Bairro não informado"}<br>
    CEP: ${endereco.cep}
  `,
    )
    .openPopup();

  setTimeout(() => mapa.invalidateSize(), 100);
}

async function nominatimSearch(query, limit = 10) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=br&limit=${limit}&q=${encodeURIComponent(query)}`;
  const resp = await fetch(url, { headers: { Accept: "application/json" } });
  if (!resp.ok) throw new Error("Erro ao consultar Nominatim");
  return resp.json();
}

function distanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function pontuar(item, alvo) {
  const addr = item.address || {};
  const display = normalizar(item.display_name);

  const road = normalizar(addr.road || addr.pedestrian || "");
  const suburb = normalizar(
    addr.suburb || addr.neighbourhood || addr.quarter || "",
  );
  const city = normalizar(
    addr.city || addr.town || addr.village || addr.municipality || "",
  );
  const state = normalizar(addr.state || "");
  const postcode = (addr.postcode || "").replace(/\D/g, "");

  let score = 0;
  if (postcode && alvo.cep && postcode === alvo.cep) score += 50;
  if (
    alvo.logradouro &&
    (road.includes(alvo.logradouro) || display.includes(alvo.logradouro))
  )
    score += 25;
  if (
    alvo.bairro &&
    (suburb.includes(alvo.bairro) || display.includes(alvo.bairro))
  )
    score += 30;
  if (
    alvo.cidade &&
    (city.includes(alvo.cidade) || display.includes(alvo.cidade))
  )
    score += 10;
  if (alvo.uf && (state.includes(alvo.uf) || display.includes(alvo.uf)))
    score += 10;

  // Regra extra para Águas Claras (DF)
  if (alvo.bairro.includes("aguas claras")) {
    if (display.includes("aguas claras") || suburb.includes("aguas claras"))
      score += 35;
  }

  return score;
}

async function geocodificarPrecisao(endereco) {
  const cepNumeros = endereco.cep.replace(/\D/g, "");
  const cepFmt = formatarCep(cepNumeros);

  const bairroNorm = normalizar(endereco.bairro);
  const cidadeNorm = normalizar(endereco.localidade);
  const ufNorm = normalizar(endereco.uf);
  const logradouroNorm = normalizar(endereco.logradouro);

  // Se bairro indicar Águas Claras, força contexto local correto
  const cidadePreferida = bairroNorm.includes("aguas claras")
    ? "Águas Claras"
    : endereco.localidade;

  const queries = [
    `${endereco.logradouro || ""}, ${endereco.bairro || ""}, ${cidadePreferida}, ${endereco.uf}, Brasil, ${cepFmt}`,
    `${endereco.bairro || ""}, ${cidadePreferida}, ${endereco.uf}, Brasil, ${cepFmt}`,
    `${endereco.logradouro || ""}, ${cidadePreferida}, ${endereco.uf}, Brasil`,
    `${cidadePreferida}, ${endereco.uf}, Brasil, ${cepFmt}`,
  ];

  let candidatos = [];
  for (const q of queries) {
    const r = await nominatimSearch(q, 10);
    candidatos.push(...r);
  }

  // remove duplicados
  const unicos = [];
  const seen = new Set();
  for (const c of candidatos) {
    const key = `${c.lat},${c.lon}`;
    if (!seen.has(key)) {
      seen.add(key);
      unicos.push(c);
    }
  }

  if (!unicos.length) return null;

  const alvo = {
    cep: cepNumeros,
    logradouro: logradouroNorm,
    bairro: bairroNorm,
    cidade: cidadeNorm,
    uf: ufNorm,
  };

  // escolhe melhor por score
  let melhor = null;
  let melhorScore = -1;
  for (const c of unicos) {
    const s = pontuar(c, alvo);
    if (s > melhorScore) {
      melhorScore = s;
      melhor = c;
    }
  }

  if (!melhor) return null;

  let lat = Number(melhor.lat);
  let lon = Number(melhor.lon);

  // trava geográfica para Águas Claras (evita cair no Plano Piloto)
  if (bairroNorm.includes("aguas claras")) {
    const centroAguasClaras = { lat: -15.843, lon: -48.02 };
    const dist = distanciaKm(
      lat,
      lon,
      centroAguasClaras.lat,
      centroAguasClaras.lon,
    );

    // se cair muito longe, tenta escolher outro candidato mais próximo de Águas Claras
    if (dist > 8) {
      let melhorLocal = null;
      let menorDist = Infinity;

      for (const c of unicos) {
        const cLat = Number(c.lat);
        const cLon = Number(c.lon);
        const d = distanciaKm(
          cLat,
          cLon,
          centroAguasClaras.lat,
          centroAguasClaras.lon,
        );
        if (d < menorDist) {
          menorDist = d;
          melhorLocal = c;
        }
      }

      if (melhorLocal) {
        lat = Number(melhorLocal.lat);
        lon = Number(melhorLocal.lon);
        melhorScore = Math.max(melhorScore - 10, 0);
      }
    }
  }

  let precisaoTexto = "Baixa (aproximada por cidade/região)";
  let zoom = 12;
  if (melhorScore >= 90) {
    precisaoTexto = "Alta (logradouro + bairro + CEP)";
    zoom = 17;
  } else if (melhorScore >= 60) {
    precisaoTexto = "Média (boa aproximação por endereço/CEP)";
    zoom = 15;
  }

  return { lat, lon, precisaoTexto, zoom };
}

async function buscarCep() {
  const cepLimpo = limparCep(inputCep.value);

  if (!validarCep(cepLimpo)) {
    renderizarErro("Digite um CEP válido com 8 números.");
    return;
  }

  areaResultado.innerHTML = "<p>Carregando endereço e mapa...</p>";
  mapaWrapper.classList.add("oculto");

  try {
    const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!resp.ok) throw new Error("Erro ViaCEP");

    const endereco = await resp.json();
    if (endereco.erro) {
      renderizarErro("CEP não encontrado.");
      return;
    }

    const coords = await geocodificarPrecisao(endereco);
    if (!coords) {
      renderizarErro(
        "Não foi possível obter coordenadas confiáveis para este CEP.",
      );
      return;
    }

    renderizarResultado(endereco, coords);
    atualizarMapa(coords, endereco);
  } catch {
    renderizarErro("Não foi possível consultar agora. Tente novamente.");
  }
}

botaoBuscar.addEventListener("click", buscarCep);
inputCep.addEventListener("keydown", (e) => {
  if (e.key === "Enter") buscarCep();
});
