// Configuración y utilidades básicas
const API_KEY = "s55iQDbXmhVFF393OUf6XshR1vsWMuVi8uliJfKE"; // Para producción, mover a variable de entorno/servidor
const ENDPOINT = "https://api.nasa.gov/planetary/apod";

const $date = document.getElementById("apod-date");
const $content = document.getElementById("apod-content");
const $btnFavorite = document.getElementById("add-favorite-btn");
const $favoritesList = document.getElementById("favorites-list");
const $noFavorites = document.getElementById("no-favorites");

// Helpers de fecha
function hoyISO() {
  return new Date().toISOString().split("T")[0];
}

function esFechaFutura(iso) {
  return iso > hoyISO();
}

// Persistencia en localStorage
const LS_KEY = "apod_favorites";

function leerFavoritos() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("No se pudo leer favoritos de localStorage", e);
    return [];
  }
}

function guardarFavoritos(favs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(favs));
  } catch (e) {
    console.warn("No se pudo guardar favoritos en localStorage", e);
  }
}

function estaEnFavoritos(date) {
  return leerFavoritos().some(f => f.date === date);
}

function toggleEstadoBotonFavorito(date, enabled) {
  if (!$btnFavorite) return;
  $btnFavorite.disabled = !enabled;
  if (!enabled) {
    $btnFavorite.textContent = "Agregar a Favoritos";
    return;
  }
  $btnFavorite.textContent = estaEnFavoritos(date) ? "En Favoritos" : "Agregar a Favoritos";
  $btnFavorite.classList.toggle("btn-secondary", estaEnFavoritos(date));
  $btnFavorite.classList.toggle("btn-primary", !estaEnFavoritos(date));
}

// Render favoritos
function renderFavoritos() {
  const favs = leerFavoritos().sort((a, b) => b.date.localeCompare(a.date));
  $favoritesList.innerHTML = "";
  if (favs.length === 0) {
    $noFavorites.style.display = "block";
    return;
  }
  $noFavorites.style.display = "none";
  for (const f of favs) {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex align-items-center justify-content-between";
    li.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        ${f.thumbnail ? `<img src="${f.thumbnail}" alt="${f.title}" style="width:56px;height:56px;object-fit:cover;border-radius:6px;"/>` : ""}
        <div>
          <div class="fw-semibold">${f.title}</div>
          <div class="text-muted">${f.date}</div>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-primary" data-action="load" data-date="${f.date}">Ver</button>
        <button class="btn btn-sm btn-outline-danger" data-action="remove" data-date="${f.date}">Quitar</button>
      </div>
    `;
    $favoritesList.appendChild(li);
  }
}

// Cargar APOD por fecha
async function cargarFotoDelDia(fecha) {
  if (!fecha) return;
  if (esFechaFutura(fecha)) {
    $content.innerHTML = `<div class="alert alert-warning">No puedes seleccionar fechas futuras.</div>`;
    toggleEstadoBotonFavorito(fecha, false);
    return;
  }

  toggleEstadoBotonFavorito(fecha, false);
  $content.innerHTML = `<p class="text-muted">Cargando…</p>`;
  try {
  const res = await fetch(`${ENDPOINT}?api_key=${API_KEY}&date=${fecha}&thumbs=true`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const titulo = data.title || "Sin título";
    const fechaTxt = data.date || fecha;
    const explicacion = data.explanation || "Sin descripción";
    const tipo = data.media_type;
    const url = data.url;
  const hdurl = data.hdurl || null;
  const thumb = data.thumbnail_url || null;

    let mediaHTML = "";
    if (tipo === "image") {
      mediaHTML = `
        <a href="${hdurl || url}" target="_blank" rel="noopener noreferrer">
          <img src="${url}" alt="${titulo}" class="img-fluid rounded mb-3"/>
        </a>`;
    } else if (tipo === "video") {
      mediaHTML = `
        <div class="ratio ratio-16x9 mb-3">
          <iframe src="${url}" title="${titulo}" frameborder="0" allowfullscreen></iframe>
        </div>`;
    } else {
      mediaHTML = `<div class="alert alert-info">Contenido no soportado: ${tipo}</div>`;
    }

    $content.innerHTML = `
      <h2 class="h3">${titulo}</h2>
      <div class="text-muted mb-2">${fechaTxt}</div>
      ${mediaHTML}
      <p class="text-start">${explicacion}</p>
    `;

    // Activar botón favorito
    toggleEstadoBotonFavorito(fechaTxt, true);

    // Guardar últimos datos mostrados para poder agregarlos a favoritos
    $btnFavorite.dataset.apod = JSON.stringify({
      date: fechaTxt,
      title: titulo,
      media_type: tipo,
      url,
      hdurl,
  thumbnail: tipo === "image" ? url : (thumb || null)
    });
  } catch (error) {
    console.error("Error al cargar la foto del día:", error);
    $content.innerHTML = `<div class="alert alert-danger">No se pudo cargar la Foto del Día. Intenta nuevamente.</div>`;
  }
}

// Eventos
$date.addEventListener("change", function () {
  const fecha = this.value;
  cargarFotoDelDia(fecha);
});

if ($favoritesList) {
  $favoritesList.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    const date = target.getAttribute("data-date");
    if (action === "load" && date) {
      $date.value = date;
      cargarFotoDelDia(date);
    } else if (action === "remove" && date) {
      const filtered = leerFavoritos().filter(f => f.date !== date);
      guardarFavoritos(filtered);
      renderFavoritos();
      // Si estamos viendo ese APOD, actualizar estado del botón
      if ($btnFavorite?.dataset.apod) {
        try {
          const current = JSON.parse($btnFavorite.dataset.apod);
          if (current.date === date) toggleEstadoBotonFavorito(date, true);
        } catch {}
      }
    }
  });
}

$btnFavorite?.addEventListener("click", () => {
  const raw = $btnFavorite.dataset.apod;
  if (!raw) return;
  const apod = JSON.parse(raw);
  const favs = leerFavoritos();
  if (!favs.some(f => f.date === apod.date)) {
    favs.push({
      date: apod.date,
      title: apod.title,
      url: apod.url,
      media_type: apod.media_type,
      thumbnail: apod.thumbnail || null
    });
    guardarFavoritos(favs);
    renderFavoritos();
  }
  toggleEstadoBotonFavorito(apod.date, true);
});

// Inicialización
(function init() {
  const hoy = hoyISO();
  // Limitar el selector de fecha a hoy como máximo
  if ($date) {
    $date.max = hoy;
  $date.min = "1995-06-16"; // Primer APOD disponible
    if (!$date.value) $date.value = hoy;
  }
  renderFavoritos();
  cargarFotoDelDia($date.value);
})();
