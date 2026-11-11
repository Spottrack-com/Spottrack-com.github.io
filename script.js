/* ============================
   SPOTTRACK MAIN SCRIPT
   ============================ */

/* ----------------------------
   SPOTTRACK MOBILE: versión y APK desde latest.json
   Editando latest.json en el repo de Mobile se actualizan
   solos los botones de descarga y los textos de versión.
---------------------------- */
const MOBILE_JSON_URL = "https://raw.githubusercontent.com/RAGE-StudiosC/Spottrack-Mobile/main/latest.json";
const MOBILE_CACHE_KEY = "spottrackMobileRelease";
// Claves de i18n cuyo texto lleva "vX.X.X" y se reemplaza por la versión real
const MOBILE_VERSION_KEYS = new Set(["mobile.badge", "descargas.android.sub", "editions.mobile.status"]);

// Valores por defecto (por si el fetch falla)
window.SPOTTRACK_MOBILE = {
  version: "5.0.1",
  apk: "https://github.com/RAGE-StudiosC/Spottrack-Mobile/releases/download/v5.0.1/Spottrack-Music-Mobile.apk"
};

function applyMobileRelease(data) {
  if (!data || !data.version || !data.apk) return;
  const version = String(data.version).replace(/^v/i, "");
  const apk = String(data.apk);

  // Validaciones: versión con formato razonable y APK solo de nuestro GitHub
  if (!/^[0-9][0-9A-Za-z.\-]*$/.test(version)) return;
  if (!apk.startsWith("https://github.com/RAGE-StudiosC/")) return;

  const changed = version !== window.SPOTTRACK_MOBILE.version || apk !== window.SPOTTRACK_MOBILE.apk;
  window.SPOTTRACK_MOBILE = { version, apk };

  document.querySelectorAll("[data-apk-link]").forEach(a => { a.href = apk; });

  // Re-pinta los textos con la versión nueva
  if (changed && typeof window.spottrackReapplyLanguage === "function") {
    window.spottrackReapplyLanguage();
  }
}

function initMobileRelease() {
  // 1) Lo último guardado, para pintar al instante
  try {
    const cached = JSON.parse(localStorage.getItem(MOBILE_CACHE_KEY) || "null");
    if (cached) applyMobileRelease(cached);
  } catch (e) { /* no-op */ }

  // 2) Dato fresco (el ?t= evita que quede una versión vieja en caché)
  fetch(MOBILE_JSON_URL + "?t=" + Math.floor(Date.now() / 60000), { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(data => {
      applyMobileRelease(data);
      try { localStorage.setItem(MOBILE_CACHE_KEY, JSON.stringify(data)); } catch (e) { /* no-op */ }
    })
    .catch(err => console.warn("No se pudo leer latest.json:", err));
}

/* ----------------------------
   SISTEMA DE REVEAL (scroll)
   Global para que tanto el DOMContentLoaded como
   cargarNovedades (que agrega cards después, por fetch)
   puedan usar el mismo observer.
---------------------------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      setTimeout(() => { entry.target.style.transitionDelay = ""; }, 1800);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: "0px 0px -80px 0px" });

// className: "section-reveal" o "card-reveal"
// delayIndex: para escalonar varias cards de una misma fila (opcional)
function observeReveal(el, className = "section-reveal", delayIndex = 0) {
  el.classList.add(className);
  if (delayIndex > 0) {
    el.style.transitionDelay = `${Math.min(delayIndex, 6) * 140}ms`;
  }
  revealObserver.observe(el);
}


document.addEventListener("DOMContentLoaded", () => {

  /* ----------------------------
     ELEMENTOS BASE
  ---------------------------- */
  const navbar = document.querySelector("nav");
  // Todos los links de nav (desktop + mobile), tengan o no data-section
  const navLinks = document.querySelectorAll(".nav-link, .mobile-link");
  const sections = document.querySelectorAll("section[id]");

  const menuToggle = document.getElementById("menu-toggle");
  const menuClose = document.getElementById("menu-close");
  const mobileMenu = document.getElementById("mobile-menu");
  const overlay = document.getElementById("overlay");

  function openMobileMenu() {
    mobileMenu?.classList.add("open");
    overlay?.classList.add("open");
  }
  function closeMobileMenu() {
    mobileMenu?.classList.remove("open");
    overlay?.classList.remove("open");
  }
  menuToggle?.addEventListener("click", openMobileMenu);
  menuClose?.addEventListener("click", closeMobileMenu);
  overlay?.addEventListener("click", closeMobileMenu);
  document.querySelectorAll(".mobile-link").forEach(l => l.addEventListener("click", closeMobileMenu));


  /* ----------------------------
     AOS INIT
  ---------------------------- */
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: "ease-out",
      once: true
    });
  }


  /* ----------------------------
     PÁGINA ACTUAL (para resaltar Ediciones/Descargar en sus propias páginas)
  ---------------------------- */
  function getCurrentPage() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    if (path === "" || path === "index.html") return "index";
    if (path.startsWith("descargas")) return "descargas";
    if (path.startsWith("ediciones")) return "ediciones";
    return path.replace(".html", "");
  }
  const currentPage = getCurrentPage();


  /* ----------------------------
     SMOOTH SCROLL (SOLO EN LA MISMA PÁGINA)
  ---------------------------- */
  navLinks.forEach(link => {
    const sectionId = link.getAttribute("data-section");
    const linkPage = link.getAttribute("data-page");
    if (!sectionId) return;

    link.addEventListener("click", function (e) {
      // Si el link apunta a una sección de OTRA página, dejamos que navegue normalmente
      if (linkPage && linkPage !== currentPage) return;

      const targetSection = document.getElementById(sectionId);
      if (!targetSection) return;

      e.preventDefault();
      const offset = navbar.offsetHeight;

      window.scrollTo({
        top: targetSection.offsetTop - offset,
        behavior: "smooth"
      });
    });
  });


  /* ----------------------------
     ACTIVE LINK + NAV EFFECTS
  ---------------------------- */

  function setActiveByPage() {
    // Marca como activo el link cuya data-page coincide con la página actual
    // y (si tiene data-section) cuya sección coincide con la actual en el scroll.
    navLinks.forEach(link => link.classList.remove("text-primary"));

    if (currentPage === "ediciones" || currentPage === "descargas") {
      navLinks.forEach(link => {
        if (link.getAttribute("data-page") === currentPage) {
          link.classList.add("text-primary");
        }
      });
      return true; // ya quedó resuelto, no depende del scroll
    }
    return false;
  }

  const isStaticPage = setActiveByPage();

  let ticking = false;
  let lastCurrent = null;

  function onScrollFrame() {
    ticking = false;
    const y = window.scrollY;

    // 1) lecturas primero
    let current = "";
    if (!isStaticPage && sections.length) {
      const navH = navbar.offsetHeight;
      sections.forEach(section => {
        if (y >= section.offsetTop - navH - 80) current = section.getAttribute("id");
      });
    }

    // 2) escrituras después
    navbar.classList.toggle("shadow-2xl", y > 10);

    if (isStaticPage || !sections.length || current === lastCurrent) return;
    lastCurrent = current;
    navLinks.forEach(link => {
      link.classList.toggle(
        "text-primary",
        link.getAttribute("data-section") === current && link.getAttribute("data-page") === currentPage
      );
    });
  }

  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); }
  }, { passive: true });
  onScrollFrame();


  /* ----------------------------
     SCROLL REVEAL — SECCIONES
     Usamos clases CSS propias (.section-reveal / .is-visible,
     definidas en styles.css) en vez de utilidades de Tailwind
     (opacity-0, translate-y-6, etc.). Esas utilidades solo existen
     si el CDN de Tailwind llega a compilarlas a tiempo cuando las
     agregamos por JS, y a veces no llega — por eso el efecto se veía
     "desaparecido". Con clases propias el efecto siempre funciona.
  ---------------------------- */
  sections.forEach(el => { if (el.id !== "inicio") observeReveal(el, "section-reveal"); });


  /* ----------------------------
     SCROLL REVEAL — CONTENEDORES / CARDS
     Mismo sistema que las secciones, pero aplicado a las cards
     individuales (download, ediciones, ads, contacto) con un
     pequeño delay escalonado según su posición dentro de la fila,
     para que no aparezcan todas exactamente al mismo tiempo.
  ---------------------------- */
  const cardGroups = [
    ".download-panel",
    ".download-store-panel",
    ".download-card",
    ".edition-card",
    ".edition-feature",
    ".ads-card",
    "#contact .card",
    "#ads .bg-secondary",
    ".why-card",
    ".why-mobile-banner",
    ".mobile-feature",
    ".mobile-steps",
    ".webview-note",
    ".playstore-soon"
  ];

  cardGroups.forEach(selector => {
    const items = document.querySelectorAll(selector);
    items.forEach((el, i) => observeReveal(el, "card-reveal", i % 4));
  });


  /* ----------------------------
     IDIOMAS + GEO DETECTION
  ---------------------------- */
  initLanguageSystem();
  initMobileRelease();

  /* ----------------------------
     INTRO PINNEADO (estilo GTA VI)
     El scroll avanza las escenas en el mismo lugar;
     al terminar, la página sigue normal.
  ---------------------------- */
  (function initIntro() {
    const intro = document.getElementById("inicio");
    if (!intro || !intro.classList.contains("intro")) return;

    const stage = intro.querySelector(".intro-stage");
    const sc0 = intro.querySelector('.intro-scene[data-i="0"]');
    const sc1 = intro.querySelector('.intro-scene[data-i="1"]');
    if (!stage || !sc0 || !sc1) return;

    const s0Text = sc0.querySelector(".s0-text");
    const s0Vis = sc0.querySelector(".s0-visual");
    const iwWrap = sc1.querySelector(".iw-wrap");
    const iwItems = Array.from(sc1.querySelectorAll(".rv"));
    const lay0 = intro.querySelector(".l0");
    const lay1 = intro.querySelector(".l1");
    const rings = intro.querySelector(".intro-rings");
    const bar = intro.querySelector(".intro-progress span");
    const dots = Array.from(intro.querySelectorAll(".intro-dot"));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    // Línea de tiempo (progreso 0 → 1 del scroll dentro del intro)
    const EXIT_START = 0.00, EXIT_END = 0.30;     // el hero se va (arranca al primer scroll)
    const ENTER_START = 0.28, ENTER_END = 0.78;   // entra "por qué elegir"
    // De 0.68 a 1.0 queda quieto (tiempo para leer) y después se suelta.

    let smooth = 0, raf = 0, lastP = -1, curDot = -1;

    function readTarget() {
      const total = intro.offsetHeight - stage.offsetHeight;
      if (total <= 0) return 0;
      return clamp(-intro.getBoundingClientRect().top / total);
    }

    function render(p) {
      if (p === lastP) return;
      lastP = p;

      const t0 = clamp((p - EXIT_START) / (EXIT_END - EXIT_START));
      const e = 1 - (1 - t0) * (1 - t0);   // sale rápido al empezar y se suaviza al final
      const s = clamp((p - ENTER_START) / (ENTER_END - ENTER_START));
      const m = easeInOut(clamp((p - 0.05) / 0.35));

      // --- Escena 1 (hero): se desvanece, el texto sube y el PC se va a la derecha
      const o0 = 1 - e;
      sc0.style.opacity = o0;
      sc0.style.visibility = o0 < 0.01 ? "hidden" : "visible";
      sc0.style.pointerEvents = o0 > 0.6 ? "auto" : "none";
      if (s0Text) s0Text.style.transform = "translate3d(" + (-48 * e) + "px," + (-30 * e) + "px,0)";
      if (s0Vis) s0Vis.style.transform = "translate3d(" + (72 * e) + "px," + (-12 * e) + "px,0) scale(" + (1 - 0.08 * e) + ")";

      // --- Escena 2 (por qué elegir): entra con elementos en cascada
      const o1 = clamp(s * 3);
      sc1.style.opacity = o1;
      sc1.style.visibility = o1 < 0.01 ? "hidden" : "visible";
      sc1.style.pointerEvents = o1 > 0.6 ? "auto" : "none";
      if (iwWrap) iwWrap.style.transform = "scale(" + (0.96 + 0.04 * easeOut(s)) + ")";
      iwItems.forEach((el, i) => {
        const t = easeOut(clamp((s - i * 0.05) / 0.5));
        el.style.opacity = t;
        el.style.transform = "translate3d(0," + ((1 - t) * 34) + "px,0)";
      });

      // --- Fondo: crossfade entre los dos brillos + anillos que crecen
      if (lay0) lay0.style.opacity = 1 - m;
      if (lay1) lay1.style.opacity = m;
      if (rings) rings.style.transform = "translate3d(" + (-60 * p) + "px,0,0) scale(" + (1 + 0.35 * p) + ")";

      // --- Progreso + puntos
      if (bar) bar.style.transform = "scaleX(" + p + ")";
      const idx = p < ENTER_START + 0.01 ? 0 : 1;
      if (idx !== curDot) {
        curDot = idx;
        dots.forEach((d, i) => d.classList.toggle("active", i === idx));
      }
    }

    // Suavizado: el progreso "persigue" al scroll real.
    // Depende del tiempo (no de los FPS) y se aplica siempre.
    let lastT = 0;
    function loop(now) {
      raf = 0;
      const dt = Math.min(64, now - (lastT || now - 16));
      lastT = now;
      const target = readTarget();
      const diff = target - smooth;
      smooth = Math.abs(diff) < 0.0004 ? target : smooth + diff * (1 - Math.exp(-dt / 140));
      render(smooth);
      if (smooth !== target) raf = requestAnimationFrame(loop);
      else lastT = 0;
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }

    smooth = readTarget();
    render(smooth);

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", () => { lastP = -1; kick(); });
    window.addEventListener("load", () => { lastP = -1; kick(); });

    // Click en los puntos: salta a cada escena
    const anchors = [0, 0.8];
    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        const total = intro.offsetHeight - stage.offsetHeight;
        const top = intro.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + (anchors[i] || 0) * total, behavior: "smooth" });
      });
    });
  })();


  /* ----------------------------
     NOVEDADES (carga diferida)
  ---------------------------- */
  const newsList = document.querySelector(".news-list");
  if (newsList) {
    if ("IntersectionObserver" in window) {
      const newsObs = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
          newsObs.disconnect();
          cargarNovedades();
        }
      }, { rootMargin: "600px 0px" });
      newsObs.observe(newsList);
    } else {
      cargarNovedades();
    }
  }

});


/* ================================================================
   SISTEMA DE IDIOMAS
   ================================================================ */

function initLanguageSystem() {
  if (typeof SPOTTRACK_I18N === "undefined") return;

  const STORAGE_KEY = "spottrackLang";
  const DISMISS_KEY = "spottrackLangBannerDismissed";

  // Mapa código de idioma -> código de país para la imagen de la bandera
  // (flagcdn.com). Usamos imágenes reales en vez de emoji porque Windows
  // no renderiza los emojis de bandera a color (se ven como texto "US").
  const SPOTTRACK_FLAG_CC = { es: "es", en: "us", pt: "br", fr: "fr" };

  let currentLang = localStorage.getItem(STORAGE_KEY);

  // Si el usuario nunca eligió idioma, arrancamos por el del navegador
  if (!currentLang) {
    const browserLang = (navigator.language || "es").slice(0, 2).toLowerCase();
    currentLang = SPOTTRACK_I18N[browserLang] ? browserLang : "es";
  }

  applyLanguage(currentLang);
  buildLanguageSwitcher(currentLang);

  // Permite re-pintar los textos cuando llega la versión nueva de latest.json
  window.spottrackReapplyLanguage = () => applyLanguage(currentLang);

  // Geo-detección: solo si el usuario no descartó ya el cartel
  if (!sessionStorage.getItem(DISMISS_KEY)) {
    const runGeo = () => detectCountryAndSuggest(currentLang);
    if ("requestIdleCallback" in window) requestIdleCallback(runGeo, { timeout: 4000 });
    else setTimeout(runGeo, 2500);
  }

  function applyLanguage(lang) {
    if (!SPOTTRACK_I18N[lang]) lang = "es";
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;

    const dict = SPOTTRACK_I18N[lang];

    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) {
        let text = dict[key];
        if (MOBILE_VERSION_KEYS.has(key)) {
          text = text.replace(/v\d+(\.\d+)+/g, "v" + window.SPOTTRACK_MOBILE.version);
        }
        el.textContent = text;
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key] !== undefined) {
        el.setAttribute("placeholder", dict[key]);
      }
    });

    document.dispatchEvent(new CustomEvent("spottrack:langchange", { detail: { lang, dict } }));
  }

  function flagImg(code, size) {
    const cc = SPOTTRACK_FLAG_CC[code] || "us";
    const [w, h] = size.split("x");
    return `<img src="https://flagcdn.com/${size}/${cc}.png" alt="" class="lang-flag-icon" width="${w}" height="${h}" loading="lazy" decoding="async">`;
  }

  function buildLanguageSwitcher(active) {
    const wraps = document.querySelectorAll(".lang-switcher");
    if (!wraps.length || typeof SPOTTRACK_LANGS === "undefined") return;

    wraps.forEach(wrap => {
      wrap.innerHTML = "";

      const current = SPOTTRACK_LANGS.find(l => l.code === active) || SPOTTRACK_LANGS[0];

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang-switcher-btn";
      btn.innerHTML = `${flagImg(current.code, "24x18")}<span class="lang-switcher-code">${current.code.toUpperCase()}</span><i class="fas fa-chevron-down"></i>`;

      const menu = document.createElement("div");
      menu.className = "lang-switcher-menu";

      SPOTTRACK_LANGS.forEach(l => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "lang-switcher-item" + (l.code === active ? " active" : "");
        item.innerHTML = `${flagImg(l.code, "20x15")}<span>${l.label}</span>`;
        item.addEventListener("click", () => {
          applyLanguage(l.code);
          buildLanguageSwitcher(l.code);
          wrap.classList.remove("open");
        });
        menu.appendChild(item);
      });

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        wrap.classList.toggle("open");
      });

      wrap.appendChild(btn);
      wrap.appendChild(menu);
    });

    document.addEventListener("click", () => {
      wraps.forEach(w => w.classList.remove("open"));
    });
  }

  async function detectCountryAndSuggest(activeLang) {
    try {
      let countryCode = localStorage.getItem("spottrackCountry");
      if (!countryCode) {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) return;
        const data = await res.json();
        countryCode = data.country_code;
        if (countryCode) localStorage.setItem("spottrackCountry", countryCode);
      }
      if (!countryCode || typeof SPOTTRACK_COUNTRY_LANG === "undefined") return;

      const suggested = SPOTTRACK_COUNTRY_LANG[countryCode];
      if (!suggested || suggested === activeLang) return;

      showLanguageBanner(suggested, countryCode);
    } catch (err) {
      // Si falla la geo-detección (bloqueada, sin red, etc), no hacemos nada
      console.warn("No se pudo detectar el país:", err);
    }
  }

  function showLanguageBanner(suggestedLang, countryCode) {
    const dict = SPOTTRACK_I18N[suggestedLang];
    if (!dict) return;

    const countryName = (SPOTTRACK_COUNTRY_NAMES[suggestedLang] && SPOTTRACK_COUNTRY_NAMES[suggestedLang][countryCode]) || countryCode;
    const text = dict["banner.geo"].replace("{country}", countryName);

    const banner = document.createElement("div");
    banner.className = "lang-banner";
    banner.innerHTML = `
      <div class="lang-banner-inner">
        <i class="fas fa-globe"></i>
        <span class="lang-banner-text">${text}</span>
        <div class="lang-banner-actions">
          <button type="button" class="lang-banner-yes">${dict["banner.yes"]}</button>
          <button type="button" class="lang-banner-no">${dict["banner.no"]}</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    requestAnimationFrame(() => banner.classList.add("show"));

    banner.querySelector(".lang-banner-yes").addEventListener("click", () => {
      applyLanguage(suggestedLang);
      buildLanguageSwitcher(suggestedLang);
      dismissBanner();
    });
    banner.querySelector(".lang-banner-no").addEventListener("click", dismissBanner);

    function dismissBanner() {
      sessionStorage.setItem(DISMISS_KEY, "1");
      banner.classList.remove("show");
      setTimeout(() => banner.remove(), 300);
    }
  }
}


/* ================================================================
   NOVEDADES SPOTTRACK
   ================================================================ */

async function cargarNovedades() {
  const URL = "https://spottrack-com.github.io/news.json?t=" + Math.floor(Date.now() / 600000);
  const container = document.querySelector(".news-list");

  if (!container) return;

  const dict = (typeof SPOTTRACK_I18N !== "undefined")
    ? SPOTTRACK_I18N[document.documentElement.lang] || SPOTTRACK_I18N.es
    : null;

  try {
    const res = await fetch(URL);
    if (!res.ok) throw new Error(res.status);

    const data = await res.json();
    container.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      return mostrarError(container, dict ? dict["news.empty"] : "No hay novedades disponibles.");
    }

    data.forEach((n, i) => {
      const card = document.createElement("div");
      card.className = "news-card";

      const date = formatDate(n.date);

      card.innerHTML = `
        <div class="news-img-wrap">
          <img src="${n.image}" alt="${escapeHTML(n.title)}" loading="lazy">
          <div class="news-img-overlay"></div>
          <span class="news-tag">${escapeHTML(n.tag || "Nuevo")}</span>
        </div>

        <div class="news-content">
          <h3>${escapeHTML(n.title)}</h3>
          <p>${escapeHTML(n.text)}</p>
        </div>

        <div class="news-footer">
          <span class="news-date">${date}</span>
          <div class="news-arrow">→</div>
        </div>
      `;

      container.appendChild(card);
      // Las news-cards se crean después del DOMContentLoaded (fetch async),
      // así que se agregan al revealObserver acá mismo, en el momento
      // en que existen en el DOM.
      observeReveal(card, "card-reveal", i % 4);
    });

  } catch (err) {
    console.error("Error cargando novedades:", err);
    mostrarError(container, dict ? dict["news.error"] : "No se pudieron cargar las novedades.");
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const lang = document.documentElement.lang || "es";
  const localeMap = { es: "es-AR", en: "en-US", pt: "pt-BR", fr: "fr-FR" };

  return d.toLocaleDateString(localeMap[lang] || "es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function escapeHTML(str = "") {
  return String(str).replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[m]));
}

function mostrarError(container, mensaje) {
  container.innerHTML = `
    <div class="news-card">
      <div class="news-content">
        <h3>Error</h3>
        <p>${mensaje}</p>
      </div>
    </div>
  `;
}


/* ----------------------------
   PERFORMANCE BOOST
---------------------------- */
window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});


/* ----------------------------
   CONSOLE BRANDING 😎
---------------------------- */
console.log(`
====================================
🚀 Spottrack Web Loaded
Optimized. Lightweight. No ads.
====================================
`);