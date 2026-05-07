(function () {
  "use strict";

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

  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");

  function setNavOpen(open) {
    if (!navToggle || !mainNav) return;
    mainNav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  }

  if (navToggle && mainNav) {
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
      if (e.key === "Escape") {
        setNavOpen(false);
      }
    });
  }

  var form = document.getElementById("reservation-form");
  var messageEl = document.getElementById("reserve-message");

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
    } catch (e) {
      /* ältere Browser */
    }
    messageEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

  if (form && messageEl) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearFieldErrors();

      var nameInput = document.getElementById("reserve-name");
      var emailInput = document.getElementById("reserve-email");
      var phoneInput = document.getElementById("reserve-phone");
      var dateInput = document.getElementById("reserve-date");
      var timeInput = document.getElementById("reserve-time");
      var guestsInput = document.getElementById("reserve-guests");
      var msgInput = document.getElementById("reserve-message-field");

      var pairs = [
        [nameInput.closest(".field"), nameInput],
        [emailInput.closest(".field"), emailInput],
        [phoneInput.closest(".field"), phoneInput],
        [dateInput.closest(".field"), dateInput],
        [timeInput.closest(".field"), timeInput],
        [guestsInput.closest(".field"), guestsInput],
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
})();
