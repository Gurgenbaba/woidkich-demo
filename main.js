(function () {
  "use strict";

  /**
   * Fehlende img/web-Assets: bei error optional genau eine data-fallback-src (existierende URL),
   * sonst .media-missing — keine absichtlichen Doppel-404-Ketten im Markup.
   */
  function markMediaMissing(img) {
    var wrap = img.closest(
      ".card-dish__img, .gallery-item, .getraenke-strip__item, .catering__visual, .hero__visual, .menu-row__thumb"
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

  function buildMenuRow(item) {
    var row = document.createElement("div");
    row.className = "menu-row";
    var imgPath = item.image && String(item.image).trim();
    if (imgPath) row.classList.add("menu-row--thumb");
    if (item.featured === true) row.classList.add("menu-row--featured");

    if (imgPath) {
      var thumb = document.createElement("div");
      thumb.className = "menu-row__thumb";
      var img = document.createElement("img");
      img.src = imgPath;
      img.alt = "";
      img.width = 180;
      img.height = 180;
      img.loading = "lazy";
      img.decoding = "async";
      thumb.appendChild(img);
      row.appendChild(thumb);
    }

    var info = document.createElement("div");
    info.className = "menu-row__info";
    var h3 = document.createElement("h3");
    h3.textContent = item.name != null ? String(item.name) : "";
    info.appendChild(h3);

    if (Array.isArray(item.tags) && item.tags.length) {
      var tagsWrap = document.createElement("div");
      tagsWrap.className = "menu-row__tags";
      item.tags.forEach(function (tag) {
        var pill = document.createElement("span");
        pill.className = "menu-row__tag";
        pill.textContent = String(tag);
        tagsWrap.appendChild(pill);
      });
      info.appendChild(tagsWrap);
    }

    if (item.description != null && String(item.description).trim() !== "") {
      var desc = document.createElement("p");
      desc.textContent = String(item.description);
      info.appendChild(desc);
    }
    row.appendChild(info);

    var priceEl = document.createElement("div");
    priceEl.className = "menu-row__price";
    priceEl.textContent = item.price != null ? String(item.price) : "";
    row.appendChild(priceEl);

    return row;
  }

  function buildCategorySection(cat) {
    var sec = document.createElement("section");
    var id = cat.id != null ? String(cat.id).trim() : "";
    if (id) sec.id = id;
    sec.className = "menu-category";

    var inner = document.createElement("div");
    inner.className = "container";

    var h2 = document.createElement("h2");
    h2.textContent = cat.title != null ? String(cat.title) : "";
    inner.appendChild(h2);

    if (cat.lead != null && String(cat.lead).trim() !== "") {
      var lead = document.createElement("p");
      lead.className = "menu-category__featured-lead";
      lead.textContent = String(cat.lead);
      inner.appendChild(lead);
    }

    if (cat.intro != null && String(cat.intro).trim() !== "") {
      var intro = document.createElement("p");
      intro.className = "menu-category__intro";
      intro.textContent = String(cat.intro);
      inner.appendChild(intro);
    }

    if (Array.isArray(cat.stripImages) && cat.stripImages.length > 0) {
      var strip = document.createElement("div");
      strip.className = "getraenke-strip getraenke-strip--page";
      strip.setAttribute("role", "group");
      strip.setAttribute("aria-label", "Getränke in Bildern");
      cat.stripImages.forEach(function (src) {
        if (!src || String(src).trim() === "") return;
        var fig = document.createElement("figure");
        fig.className = "getraenke-strip__item";
        var img = document.createElement("img");
        img.src = String(src).trim();
        img.alt = "";
        img.width = 560;
        img.height = 560;
        img.loading = "lazy";
        img.decoding = "async";
        fig.appendChild(img);
        strip.appendChild(fig);
      });
      inner.appendChild(strip);
    }

    var itemsWrap = document.createElement("div");
    itemsWrap.className = "menu-items";
    if (Array.isArray(cat.items)) {
      cat.items.forEach(function (item) {
        itemsWrap.appendChild(buildMenuRow(item));
      });
    }
    inner.appendChild(itemsWrap);
    sec.appendChild(inner);
    return sec;
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
