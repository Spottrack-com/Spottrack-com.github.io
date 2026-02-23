/* ============================
   SPOTTRACK MAIN SCRIPT
   ============================ */

document.addEventListener("DOMContentLoaded", () => {

  /* ----------------------------
     ELEMENTOS BASE
  ---------------------------- */
  const navbar = document.querySelector("nav");
  const navLinks = document.querySelectorAll("[data-section]");
  const sections = document.querySelectorAll("section");


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
     SMOOTH SCROLL (FIX DATA-SECTION)
  ---------------------------- */
  navLinks.forEach(link => {
    link.addEventListener("click", function () {

      const sectionId = this.getAttribute("data-section");
      const targetSection = document.getElementById(sectionId);

      if (!targetSection) return;

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

  let lastScroll = 0;

  window.addEventListener("scroll", () => {

    const currentScroll = window.scrollY;

    /* --- Navbar Shadow --- */
    if (currentScroll > 10) {
      navbar.classList.add("shadow-2xl");
    } else {
      navbar.classList.remove("shadow-2xl");
    }

    /* --- Navbar Hide on Scroll Down --- */
    if (currentScroll > lastScroll && currentScroll > 100) {
      navbar.style.transform = "translateY(-100%)";
    } else {
      navbar.style.transform = "translateY(0)";
    }

    lastScroll = currentScroll;


    /* --- Active Link Highlight --- */
    let current = "";

    sections.forEach(section => {
      const sectionTop = section.offsetTop - navbar.offsetHeight - 80;

      if (currentScroll >= sectionTop) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("text-primary");

      if (link.getAttribute("data-section") === current) {
        link.classList.add("text-primary");
      }
    });

  });


  /* ----------------------------
     LANGUAGE SYSTEM
  ---------------------------- */
  const availableLangs = ["es", "en", "pt", "fr"];
  let currentLang = localStorage.getItem("spottrackLang") || "es";

  function setLanguage(lang) {
    if (!availableLangs.includes(lang)) return;

    currentLang = lang;
    localStorage.setItem("spottrackLang", lang);

    document.documentElement.lang = lang;

    console.log("Idioma cambiado a:", lang);
  }

  setLanguage(currentLang);


  /* ----------------------------
     SCROLL REVEAL (INTERSECTION OBSERVER)
  ---------------------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("opacity-100", "translate-y-0");
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(el => {
    el.classList.add(
      "opacity-0",
      "translate-y-6",
      "transition-all",
      "duration-700"
    );
    revealObserver.observe(el);
  });


});


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