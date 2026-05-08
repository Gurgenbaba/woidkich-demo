(function () {
  "use strict";

  /**
   * Fehlende img/web-Assets: bei error optional genau eine data-fallback-src (existierende URL),
   * sonst .media-missing — keine absichtlichen Doppel-404-Ketten im Markup.
   */
  function markMediaMissing(img) {
    var wrap = img.closest(
      ".card-dish__img, .gallery-item, .getraenke-strip__item, .menu-drink-strip__item, .catering__visual, .hero__visual, .menu-card__media"
    );
    if (wrap) {
      wrap.classList.add("media-missing");
    }
  }

  function wireWebImages() {
    document.querySelectorAll('img[src*="img/web"]').forEach(function (img) {
      img.addEventListener(
        "error",
        function onFail() {
          var fb = img.getAttribute("data-fallback-src");
          if (fb && fb !== img.getAttribute("src") && img.dataset.fallbackTried !== "1") {
            img.dataset.fallbackTried = "1";
            img.src = fb;
            return;
          }
          markMediaMissing(img);
        },
        { once: true }
      );
    });
  }

  function wireLogo() {
    document.querySelectorAll(".logo-img").forEach(function (img) {
      var wrap = img.closest(".logo-link");
      var fb = wrap && wrap.querySelector(".logo-fallback");
      img.addEventListener("error", function () {
        img.setAttribute("hidden", "");
        img.setAttribute("aria-hidden", "true");
        if (fb) {
          fb.removeAttribute("hidden");
        }
      });
    });
  }

  function wireFooterLegal() {
    var root = document.querySelector(".footer-legal");
    if (!root) return;

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var panels = {
      impressum: document.getElementById("impressum"),
      datenschutz: document.getElementById("datenschutz"),
    };
    var toggleBtns = {
      impressum: document.getElementById("footer-legal-toggle-impressum"),
      datenschutz: document.getElementById("footer-legal-toggle-datenschutz"),
    };

    function setInnerInert(panel, on) {
      var inner = panel && panel.querySelector(".footer-legal__panel-inner");
      if (!inner) return;
      if (on) inner.setAttribute("inert", "");
      else inner.removeAttribute("inert");
    }

    function closeAll() {
      ["impressum", "datenschutz"].forEach(function (key) {
        var p = panels[key];
        var b = toggleBtns[key];
        if (!p || !b) return;
        p.classList.remove("is-open");
        p.setAttribute("aria-hidden", "true");
        b.setAttribute("aria-expanded", "false");
        setInnerInert(p, true);
      });
    }

    function openOnly(key) {
      closeAll();
      var p = panels[key];
      var b = toggleBtns[key];
      if (!p || !b) return;
      p.classList.add("is-open");
      p.setAttribute("aria-hidden", "false");
      b.setAttribute("aria-expanded", "true");
      setInnerInert(p, false);
    }

    function toggle(key) {
      var p = panels[key];
      if (!p) return;
      if (p.classList.contains("is-open")) closeAll();
      else openOnly(key);
    }

    root.querySelectorAll(".footer-legal__toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("aria-controls");
        if (id === "impressum" || id === "datenschutz") toggle(id);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!root.querySelector(".footer-legal__panel.is-open")) return;
      closeAll();
    });

    var h = location.hash.replace(/^#/, "");
    if (h === "impressum" || h === "datenschutz") {
      openOnly(h);
      window.requestAnimationFrame(function () {
        var el = document.getElementById(h);
        if (el) {
          el.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "nearest",
          });
        }
      });
    }
  }

  function createMenuMediaPlaceholderSvg() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "40");
    svg.setAttribute("height", "40");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.35");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("d", "M12 3v18M8 7h8M7 21h10");
    svg.appendChild(path);
    svg.style.color = "rgba(31, 61, 43, 0.35)";
    return svg;
  }

  function buildMenuCard(item) {
    var article = document.createElement("article");
    article.className = "menu-card";
    if (item.featured === true) article.classList.add("menu-card--featured");

    var media = document.createElement("div");
    media.className = "menu-card__media";

    var imgPath = item.image && String(item.image).trim();
    if (imgPath) {
      var img = document.createElement("img");
      img.src = imgPath;
      img.alt = "";
      img.width = 400;
      img.height = 320;
      img.loading = "lazy";
      img.decoding = "async";
      media.appendChild(img);
    } else {
      media.classList.add("menu-card__media--placeholder");
      media.setAttribute("aria-hidden", "true");
      media.appendChild(createMenuMediaPlaceholderSvg());
    }
    article.appendChild(media);

    var body = document.createElement("div");
    body.className = "menu-card__body";

    var titleRow = document.createElement("div");
    titleRow.className = "menu-card__title-row";
    var h3 = document.createElement("h3");
    h3.className = "menu-card__name";
    h3.textContent = item.name != null ? String(item.name) : "";
    titleRow.appendChild(h3);
    if (item.featured === true) {
      var badge = document.createElement("span");
      badge.className = "menu-card__badge";
      badge.textContent = "Woid-Favorit";
      titleRow.appendChild(badge);
    }
    body.appendChild(titleRow);

    if (Array.isArray(item.tags) && item.tags.length && item.featured !== true) {
      var tagsWrap = document.createElement("div");
      tagsWrap.className = "menu-card__tags";
      item.tags.forEach(function (tag) {
        var pill = document.createElement("span");
        pill.className = "menu-card__tag";
        pill.textContent = String(tag);
        tagsWrap.appendChild(pill);
      });
      body.appendChild(tagsWrap);
    }

    if (item.description != null && String(item.description).trim() !== "") {
      var desc = document.createElement("p");
      desc.className = "menu-card__desc";
      desc.textContent = String(item.description);
      body.appendChild(desc);
    }

    article.appendChild(body);

    var priceWrap = document.createElement("div");
    priceWrap.className = "menu-card__price";
    var priceInner = document.createElement("span");
    priceInner.className = "price menu-card__price-val";
    priceInner.textContent = item.price != null ? String(item.price) : "";
    priceWrap.appendChild(priceInner);
    article.appendChild(priceWrap);

    return article;
  }

  function buildCategorySection(cat) {
    var sec = document.createElement("section");
    var id = cat.id != null ? String(cat.id).trim() : "";
    if (id) sec.id = id;
    sec.className = "menu-category";

    var inner = document.createElement("div");
    inner.className = "container menu-category__inner";

    var head = document.createElement("header");
    head.className = "menu-category__head";

    var h2 = document.createElement("h2");
    h2.className = "menu-category__title";
    h2.textContent = cat.title != null ? String(cat.title) : "";
    head.appendChild(h2);

    if (cat.lead != null && String(cat.lead).trim() !== "") {
      var lead = document.createElement("p");
      lead.className = "menu-category__lead";
      lead.textContent = String(cat.lead);
      head.appendChild(lead);
    }

    if (cat.intro != null && String(cat.intro).trim() !== "") {
      var intro = document.createElement("p");
      intro.className = "menu-category__intro";
      intro.textContent = String(cat.intro);
      head.appendChild(intro);
    }

    inner.appendChild(head);

    var itemsWrap = document.createElement("div");
    itemsWrap.className = "menu-items menu-items--premium";
    if (Array.isArray(cat.items)) {
      cat.items.forEach(function (item) {
        itemsWrap.appendChild(buildMenuCard(item));
      });
    }
    inner.appendChild(itemsWrap);
    sec.appendChild(inner);
    return sec;
  }

  function wireMenuCategoryNav() {
    var nav = document.querySelector(".menu-cat-nav");
    var root = document.getElementById("menu-root");
    if (!nav || !root) return;

    var links = nav.querySelectorAll('a[href^="#"]');
    var sections = root.querySelectorAll(".menu-category[id]");
    if (!links.length || !sections.length) return;

    function activateSectionId(sid) {
      if (!sid) return;
      links.forEach(function (a) {
        var href = a.getAttribute("href") || "";
        a.classList.toggle("is-active", href === "#" + sid);
      });
    }

    window.addEventListener("hashchange", function () {
      var h = location.hash.replace(/^#/, "");
      if (h) activateSectionId(h);
    });

    var initial = location.hash.replace(/^#/, "");
    if (initial) activateSectionId(initial);

    if (!("IntersectionObserver" in window)) return;

    var obs = new IntersectionObserver(
      function (entries) {
        var bestEl = null;
        var bestRatio = 0;
        entries.forEach(function (en) {
          if (!en.isIntersecting || !en.target.id) return;
          if (en.intersectionRatio > bestRatio) {
            bestRatio = en.intersectionRatio;
            bestEl = en.target;
          }
        });
        if (bestEl) activateSectionId(bestEl.id);
      },
      {
        root: null,
        rootMargin: "-14% 0px -56% 0px",
        threshold: [0, 0.06, 0.12, 0.22, 0.38, 0.55],
      }
    );

    sections.forEach(function (s) {
      obs.observe(s);
    });
  }

  function renderMenuPage() {
    var root = document.getElementById("menu-root");
    if (!root) return null;

    root.setAttribute("aria-busy", "true");

    return fetch("data/menu.json", { credentials: "same-origin" })
      .then(function (res) {
        if (!res.ok) throw new Error("menu fetch failed");
        return res.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.categories)) throw new Error("invalid menu json");
        root.replaceChildren();
        data.categories.forEach(function (cat) {
          root.appendChild(buildCategorySection(cat));
        });
      })
      .catch(function () {
        root.replaceChildren();
        var err = document.createElement("p");
        err.className = "menu-page-error";
        err.setAttribute("role", "status");
        err.textContent = "Die Speisekarte konnte gerade nicht geladen werden.";
        root.appendChild(err);
      })
      .finally(function () {
        root.removeAttribute("aria-busy");
        wireMenuCategoryNav();
      });
  }

  function wireMapEmbed() {
    var card = document.querySelector(".map-card");
    var iframe = document.querySelector(".map-card__frame iframe.map-card__embed");
    if (!card || !iframe) return;
    var failTimer = window.setTimeout(function () {
      if (!card.classList.contains("map-card--iframe-loaded")) {
        card.classList.add("map-card--show-fallback");
      }
    }, 12000);
    function markLoaded() {
      window.clearTimeout(failTimer);
      card.classList.add("map-card--iframe-loaded");
    }
    iframe.addEventListener("load", markLoaded, { once: true });
    iframe.addEventListener(
      "error",
      function () {
        card.classList.add("map-card--show-fallback");
        markLoaded();
      },
      { once: true }
    );
  }

  function wireNav() {
    var navToggle = document.querySelector(".nav-toggle");
    var mainNav = document.querySelector(".main-nav");

    function setNavOpen(open) {
      if (!navToggle || !mainNav) return;
      mainNav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    }

    if (!navToggle || !mainNav) return;

    navToggle.addEventListener("click", function () {
      setNavOpen(!mainNav.classList.contains("is-open"));
    });

    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 900px)").matches) {
          setNavOpen(false);
        }
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!mainNav.classList.contains("is-open")) return;
      setNavOpen(false);
    });
  }

  function wireForm() {
    var form = document.getElementById("reservation-form");
    var messageEl = document.getElementById("reserve-message");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function showMessage(type, text) {
      if (!messageEl) return;
      messageEl.hidden = false;
      messageEl.textContent = text;
      messageEl.className = "form-message";
      messageEl.setAttribute("tabindex", "-1");
      if (type === "success") {
        messageEl.classList.add("form-message--success");
      } else if (type === "error") {
        messageEl.classList.add("form-message--error");
      }
      try {
        messageEl.focus({ preventScroll: true });
      } catch (err) {
        /* ältere Browser */
      }
      messageEl.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "nearest",
      });
    }

    function clearFieldErrors() {
      if (!form) return;
      form.querySelectorAll(".field.has-error").forEach(function (f) {
        f.classList.remove("has-error");
      });
      form.querySelectorAll("[aria-invalid]").forEach(function (el) {
        el.removeAttribute("aria-invalid");
      });
    }

    function validateField(fieldWrap, input) {
      if (!fieldWrap || !input) return false;
      var ok = true;
      if (input.hasAttribute("required")) {
        if (input.type === "email") {
          ok = input.value.trim() !== "" && input.validity.valid;
        } else if (input.tagName === "SELECT") {
          ok = input.value !== "";
        } else {
          ok = input.value.trim() !== "";
        }
      }
      fieldWrap.classList.toggle("has-error", !ok);
      if (input.id) {
        input.setAttribute("aria-invalid", ok ? "false" : "true");
      }
      return ok;
    }

    if (!form || !messageEl) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearFieldErrors();

      var nameInput = document.getElementById("reserve-name");
      var emailInput = document.getElementById("reserve-email");
      var phoneInput = document.getElementById("reserve-phone");
      var dateInput = document.getElementById("reserve-date");
      var timeInput = document.getElementById("reserve-time");
      var guestsInput = document.getElementById("reserve-guests");

      var pairs = [
        [nameInput && nameInput.closest(".field"), nameInput],
        [emailInput && emailInput.closest(".field"), emailInput],
        [phoneInput && phoneInput.closest(".field"), phoneInput],
        [dateInput && dateInput.closest(".field"), dateInput],
        [timeInput && timeInput.closest(".field"), timeInput],
        [guestsInput && guestsInput.closest(".field"), guestsInput],
      ];

      var allOk = true;
      pairs.forEach(function (pair) {
        if (!validateField(pair[0], pair[1])) allOk = false;
      });

      var chosen = new Date(dateInput.value + "T12:00:00");
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateInput.value && chosen < today) {
        dateInput.closest(".field").classList.add("has-error");
        dateInput.setAttribute("aria-invalid", "true");
        var errSpan = dateInput.closest(".field").querySelector(".field-error");
        if (errSpan) errSpan.textContent = "Bitte wähle ein Datum ab heute.";
        allOk = false;
      } else if (dateInput.closest(".field")) {
        var defErr = dateInput.closest(".field").querySelector(".field-error");
        if (defErr) defErr.textContent = "Bitte wähle ein Datum.";
      }

      if (!allOk) {
        showMessage("error", "Bitte prüfe die markierten Felder.");
        return;
      }

      [nameInput, emailInput, phoneInput, dateInput, timeInput, guestsInput].forEach(function (el) {
        if (el) el.setAttribute("aria-invalid", "false");
      });

      showMessage(
        "success",
        "Danke! Deine Reservierungsanfrage wurde übernommen. " +
          "Du erhältst hier keine automatische Bestätigungs‑E-Mail — das Team meldet sich bei dir, sobald der Termin geprüft ist."
      );

      form.reset();
    });
  }

  function init() {
    wireLogo();
    var menuPromise = renderMenuPage();
    if (menuPromise && typeof menuPromise.finally === "function") {
      menuPromise.finally(function () {
        wireWebImages();
      });
    } else {
      wireWebImages();
    }
    wireMapEmbed();
    wireFooterLegal();
    wireNav();
    wireForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
