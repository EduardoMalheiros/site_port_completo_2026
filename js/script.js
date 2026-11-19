const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

if (menuToggle && primaryNav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Abrir menu" : "Fechar menu");
    primaryNav.classList.toggle("is-open", !isExpanded);
  });

  primaryNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menu");
      primaryNav.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Abrir menu");
      primaryNav.classList.remove("is-open");
      menuToggle.focus();
    }
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function safeURL(value) {
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function externalLink(url, label, className = "") {
  const validURL = safeURL(url);
  if (!validURL) return "";
  return `<a class="${className}" href="${escapeHTML(validURL)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} <span aria-hidden="true">↗</span></a>`;
}

async function loadJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Não foi possível carregar ${path} (HTTP ${response.status}).`);
  return response.json();
}

function setStatus(target, message, isError = false) {
  if (!target) return;
  target.textContent = message;
  target.classList.toggle("is-error", isError);
}

function showLoadError(target, error) {
  console.error(error);
  setStatus(target, "Não foi possível carregar os dados. Execute o projeto por um servidor HTTP local e tente novamente.", true);
}

const seasonFilter = document.querySelector("#season-filter");
const rankingCompetitionFilter = document.querySelector("#competition-filter");
const categoryFilter = document.querySelector("#category-filter");
const rankingBody = document.querySelector("#ranking-results");
const rankingNoResults = document.querySelector(".no-results");
const rankingStatus = document.querySelector("#ranking-status");
const rankingPreview = document.querySelector("#ranking-preview");
let rankingData;

function filteredRankingEntries() {
  if (!rankingData) return [];
  const selectedSeason = seasonFilter?.value || String(rankingData.season);
  const selectedCompetition = rankingCompetitionFilter?.value || "all";
  const selectedCategory = categoryFilter?.value || "all";
  if (selectedSeason !== String(rankingData.season) || (selectedCompetition !== "all" && selectedCompetition !== "abvaq")) return [];

  return rankingData.categories
    .filter((category) => selectedCategory === "all" || category.id === selectedCategory)
    .flatMap((category) => category.entries.map((entry) => ({ ...entry, category: category.name })));
}

function renderRanking() {
  if (!rankingBody || !rankingData) return;
  const entries = filteredRankingEntries();
  rankingBody.innerHTML = entries.map((entry) => {
    const medalClass = entry.position === 2 ? " silver" : entry.position === 3 ? " bronze" : "";
    return `<tr>
      <td><span class="rank-medal${medalClass}">${String(entry.position).padStart(2, "0")}</span></td>
      <td><strong>${escapeHTML(entry.name)}</strong></td>
      <td>${escapeHTML(entry.category)}</td>
      <td>${escapeHTML(rankingData.competition)}</td>
      <td class="points">${new Intl.NumberFormat("pt-BR").format(entry.points)}</td>
    </tr>`;
  }).join("");

  if (rankingNoResults) rankingNoResults.hidden = entries.length > 0;
  if (rankingStatus) {
    const message = entries.length
      ? `${entries.length} registro(s) do recorte consultado em 18/11/2026. A classificação pode ter mudado na fonte oficial.`
      : "Não há captura verificada para essa combinação de filtros.";
    setStatus(rankingStatus, message);
  }
}

async function initializeRanking() {
  if (!rankingBody && !rankingPreview) return;
  try {
    rankingData = await loadJSON("data/rankings.json");

    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="all">Todas</option>' + rankingData.categories
        .map((category) => `<option value="${escapeHTML(category.id)}">${escapeHTML(category.name)}</option>`)
        .join("");
    }

    seasonFilter?.addEventListener("change", renderRanking);
    rankingCompetitionFilter?.addEventListener("change", renderRanking);
    categoryFilter?.addEventListener("change", renderRanking);
    renderRanking();

    if (rankingPreview) {
      const professional = rankingData.categories.find((category) => category.id === "prof");
      if (!professional) throw new Error("A categoria Profissional não está presente no arquivo de ranking.");
      rankingPreview.innerHTML = professional.entries.slice(0, 3).map((entry) => `
        <div class="teaser-row">
          <b class="place">${String(entry.position).padStart(2, "0")}</b>
          <span>${escapeHTML(entry.name)}<small>Profissional · ABVAQ 2026</small></span>
          <strong>${new Intl.NumberFormat("pt-BR").format(entry.points)}<small> pts</small></strong>
        </div>`).join("");
    }
  } catch (error) {
    showLoadError(rankingStatus || rankingPreview, error);
  }
}

const competitionSeasonFilter = document.querySelector("#competition-season");
const competitionFilter = document.querySelector("#competition-filter");
const competitionContainer = document.querySelector("#competition-events");
const competitionStatus = document.querySelector("#competition-status");
let competitionEvents = [];

function renderCompetitionEvents() {
  if (!competitionContainer) return;
  const season = competitionSeasonFilter?.value || "all";
  const competition = competitionFilter?.value || "all";
  const filtered = competitionEvents.filter((event) =>
    (season === "all" || String(event.season) === season)
    && (competition === "all" || event.competitionId === competition)
  );

  competitionContainer.innerHTML = filtered.map((event) => {
    const categories = event.categories.length
      ? `<div class="event-results"><h4>Resultados publicados</h4>${event.categories.map((category) => `
        <div class="event-result-row">
          <strong>${escapeHTML(category.name)}</strong>
          <span>${category.winners.map(escapeHTML).join(" · ")}${category.horses?.length ? `<small>Cavalos informados: ${category.horses.map(escapeHTML).join(" · ")}</small>` : ""}${category.note ? `<small>${escapeHTML(category.note)}</small>` : ""}${category.sourceUrl ? externalLink(category.sourceUrl, "Tabela oficial", "category-source") : ""}</span>
        </div>`).join("")}</div>`
      : '<p class="event-no-result">Resultado ainda não publicado na fonte consultada.</p>';
    return `<article class="event-card">
      <div class="event-card-heading"><span class="tag">${escapeHTML(event.competitionName)}</span><span class="event-season">${escapeHTML(event.season)}</span></div>
      <h3>${escapeHTML(event.title)}</h3>
      <p class="event-date">${escapeHTML(event.date)} <span>·</span> ${escapeHTML(event.location)}</p>
      <div class="event-meta"><span>Premiação anunciada</span><strong>${escapeHTML(event.prize || "Não informada")}</strong></div>
      <span class="event-status">${escapeHTML(event.status)}</span>
      ${categories}
      ${event.resultNote ? `<p class="event-note">${escapeHTML(event.resultNote)}</p>` : ""}
      ${externalLink(event.sourceUrl, "Ver página oficial", "event-source")}
    </article>`;
  }).join("");

  setStatus(competitionStatus, filtered.length
    ? `${filtered.length} evento(s) listado(s). Fonte e temporada aparecem em cada registro.`
    : "Nenhum evento encontrado para esses filtros.");
}

async function initializeCompetitions() {
  if (!competitionContainer) return;
  try {
    const data = await loadJSON("data/competicoes.json");
    competitionEvents = data.competitions.flatMap((competition) =>
      competition.events.map((event) => ({
        ...event,
        competitionId: competition.id,
        competitionName: competition.name,
        sourceUrl: event.sourceUrl || competition.sourceUrl
      }))
    );

    const seasons = [...new Set(competitionEvents.map((event) => String(event.season)))].sort((a, b) => b.localeCompare(a));
    const competitions = [...new Map(data.competitions.map((item) => [item.id, item.name])).entries()];
    if (competitionSeasonFilter) {
      competitionSeasonFilter.innerHTML = '<option value="all">Todas</option>' + seasons.map((season) =>
        `<option value="${escapeHTML(season)}">${escapeHTML(season)}</option>`).join("");
    }
    if (competitionFilter) {
      competitionFilter.innerHTML = '<option value="all">Todas</option>' + competitions.map(([id, name]) =>
        `<option value="${escapeHTML(id)}">${escapeHTML(name)}</option>`).join("");
    }
    competitionSeasonFilter?.addEventListener("change", renderCompetitionEvents);
    competitionFilter?.addEventListener("change", renderCompetitionEvents);
    renderCompetitionEvents();
  } catch (error) {
    showLoadError(competitionStatus, error);
  }
}

const championProfiles = document.querySelector("#champion-profiles");
const championsStatus = document.querySelector("#champions-status");

async function initializeChampions() {
  if (!championProfiles) return;
  try {
    const data = await loadJSON("data/campeoes.json");
    championProfiles.innerHTML = data.profiles.map((profile) => `
      <article class="profile-card data-profile-card">
        <div class="data-image-placeholder" role="img" aria-label="Retrato autorizado não localizado">
          <span class="data-placeholder-mark" aria-hidden="true">PV</span><span>RETRATO NÃO DISPONÍVEL</span>
        </div>
        <div class="profile-body">
          <span class="tag">${escapeHTML(profile.category)} · ${escapeHTML(profile.competition)}</span>
          <h3>${escapeHTML(profile.name)}</h3>
          <p>${escapeHTML(profile.achievement)}</p>
          <p class="profile-context">${escapeHTML(profile.context)}</p>
          <div class="profile-meta"><span>Nome completo</span><b>${profile.fullName ? escapeHTML(profile.fullName) : "Não informado pela fonte"}</b></div>
          <p class="photo-note">${escapeHTML(profile.photoNote)}</p>
          ${externalLink(profile.sourceUrl, "Consultar publicação", "profile-source")}
        </div>
      </article>`).join("");
    setStatus(championsStatus, `${data.profiles.length} registros documentados; seleção não exaustiva.`);
  } catch (error) {
    showLoadError(championsStatus, error);
  }
}

const horseProfiles = document.querySelector("#horse-profiles");
const horsesStatus = document.querySelector("#horses-status");

async function initializeHorses() {
  if (!horseProfiles) return;
  try {
    const data = await loadJSON("data/cavalos.json");
    horseProfiles.innerHTML = data.horses.map((horse) => `
      <article class="horse-card data-horse-card">
        <div class="data-image-placeholder" role="img" aria-label="Fotografia autorizada não localizada">
          <span class="data-placeholder-mark" aria-hidden="true">PV</span><span>FOTO NÃO DISPONÍVEL</span>
        </div>
        <div class="horse-details">
          <span class="tag">REGISTRO DOCUMENTADO</span><h3>${escapeHTML(horse.name)}</h3>
          <p class="horse-achievement">${escapeHTML(horse.achievement)}</p>
          <dl>
            <div><dt>Raça</dt><dd>${horse.breed ? escapeHTML(horse.breed) : "Não informada"}</dd></div>
            <div><dt>Registro</dt><dd>${horse.registration ? escapeHTML(horse.registration) : "Não localizado"}</dd></div>
            <div><dt>Pedigree</dt><dd>${horse.pedigree ? escapeHTML(horse.pedigree) : "Não informado"}</dd></div>
            <div><dt>Nascimento</dt><dd>${horse.birth ? escapeHTML(horse.birth) : "Não informado"}</dd></div>
            <div><dt>Proprietário</dt><dd>${horse.owner ? escapeHTML(horse.owner) : "Não informado"}</dd></div>
          </dl>
          <p class="photo-note">${escapeHTML(horse.photoNote)}</p>
          ${externalLink(horse.sourceUrl, "Consultar publicação", "profile-source")}
        </div>
      </article>`).join("");
    setStatus(horsesStatus, `${data.horses.length} fichas com informações atribuídas às fontes citadas.`);
  } catch (error) {
    showLoadError(horsesStatus, error);
  }
}

const sourceList = document.querySelector("#source-list");
const sourcesStatus = document.querySelector("#sources-status");

async function initializeSources() {
  if (!sourceList) return;
  try {
    const data = await loadJSON("data/fontes.json");
    sourceList.innerHTML = data.sources.map((source) => `
      <article class="source-card" id="${escapeHTML(source.id)}">
        <div class="source-card-heading"><span class="tag tag-dark">${escapeHTML(source.type)}</span><span class="source-date">Publicação: ${escapeHTML(source.publishedAt)}</span></div>
        <h3>${escapeHTML(source.name)}</h3>
        <p class="source-publisher">${escapeHTML(source.publisher)}</p>
        <p>${escapeHTML(source.usedFor)}</p>
        ${source.limitation ? `<p class="source-limitation"><strong>Limite:</strong> ${escapeHTML(source.limitation)}</p>` : ""}
        ${externalLink(source.url, "Abrir fonte original", "source-link")}
        ${source.licenseUrl ? externalLink(source.licenseUrl, source.licenseName || "Licença de uso", "source-link") : ""}
      </article>`).join("");
    setStatus(sourcesStatus, `${data.sources.length} fontes listadas. Consulta registrada em ${data.consultedAt}.`);
  } catch (error) {
    showLoadError(sourcesStatus, error);
  }
}

initializeRanking();
initializeCompetitions();
initializeChampions();
initializeHorses();
initializeSources();

const backToTop = document.querySelector(".back-to-top");

if (backToTop) {
  const updateBackToTop = () => {
    backToTop.classList.toggle("is-visible", window.scrollY > 420);
  };

  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
