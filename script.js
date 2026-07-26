/* ============================
   SPOTTRACK MAIN SCRIPT
   ============================ */

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
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: "0px 0px -100px 0px" });

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

  let lastScroll = 0;

  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 10) {
      navbar.classList.add("shadow-2xl");
    } else {
      navbar.classList.remove("shadow-2xl");
    }

    if (currentScroll > lastScroll && currentScroll > 100) {
      navbar.style.transform = "translateY(-100%)";
    } else {
      navbar.style.transform = "translateY(0)";
    }

    lastScroll = currentScroll;

    // Solo recalculamos el link activo por scroll si estamos en index.html
    if (isStaticPage || !sections.length) return;

    let current = "";
    sections.forEach(section => {
      const sectionTop = section.offsetTop - navbar.offsetHeight - 80;
      if (currentScroll >= sectionTop) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("text-primary");
      if (link.getAttribute("data-section") === current && link.getAttribute("data-page") === currentPage) {
        link.classList.add("text-primary");
      }
    });
  });


  /* ----------------------------
     SCROLL REVEAL — SECCIONES
     Usamos clases CSS propias (.section-reveal / .is-visible,
     definidas en styles.css) en vez de utilidades de Tailwind
     (opacity-0, translate-y-6, etc.). Esas utilidades solo existen
     si el CDN de Tailwind llega a compilarlas a tiempo cuando las
     agregamos por JS, y a veces no llega — por eso el efecto se veía
     "desaparecido". Con clases propias el efecto siempre funciona.
  ---------------------------- */
  sections.forEach(el => observeReveal(el, "section-reveal"));


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
    ".why-mobile-banner"
  ];

  cardGroups.forEach(selector => {
    const items = document.querySelectorAll(selector);
    items.forEach((el, i) => observeReveal(el, "card-reveal", i % 4));
  });


  /* ----------------------------
     IDIOMAS + GEO DETECTION
  ---------------------------- */
  initLanguageSystem();


  /* ----------------------------
     NOVEDADES
  ---------------------------- */
  cargarNovedades();

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

  // Geo-detección: solo si el usuario no descartó ya el cartel
  if (!sessionStorage.getItem(DISMISS_KEY)) {
    detectCountryAndSuggest(currentLang);
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
        el.textContent = dict[key];
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
    return `<img src="https://flagcdn.com/${size}/${cc}.png" alt="" class="lang-flag-icon">`;
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
      const res = await fetch("https://ipapi.co/json/");
      if (!res.ok) return;
      const data = await res.json();
      const countryCode = data.country_code;
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
  const URL = "https://spottrack-com.github.io/news.json?t=" + Date.now();
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