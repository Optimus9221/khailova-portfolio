(function () {
  "use strict";

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const root = document.getElementById("direction-root");
  const logo = document.getElementById("direction-logo");

  async function load() {
    if (!root) return;

    if (!id) {
      window.location.replace("index.html#stories");
      return;
    }

    let data;
    try {
      const res = await fetch("/api/site?" + Date.now());
      if (!res.ok) throw new Error(String(res.status));
      data = await res.json();
    } catch {
      root.innerHTML =
        '<p class="direction-error">Запустіть сервер: <code>npm start</code> і відкрийте через localhost.</p>';
      return;
    }

    if (logo && data.meta?.logo) {
      logo.textContent = data.meta.logo;
    }

    const dir = (data.directions || []).find((d) => d.id === id);
    if (!dir) {
      root.innerHTML =
        '<p class="direction-error">Напрямок не знайдено. <a href="index.html#stories">Назад</a></p>';
      return;
    }

    document.title = `${dir.title} — галерея`;

    const thumbs = (dir.gallery || [])
      .map(
        (g, i) => `
      <button type="button" class="direction-thumb" data-lightbox-d="${i}" aria-label="${escapeHtml(g.alt || "Фото " + (i + 1))}">
        <img src="${escapeHtml(g.src)}" alt="${escapeHtml(g.alt || "")}" width="600" height="400" loading="lazy" />
      </button>`
      )
      .join("");

    root.innerHTML = `
      <nav class="direction-breadcrumb">
        <a href="index.html#stories">Напрямки</a>
        <span aria-hidden="true">/</span>
        <span>${escapeHtml(dir.title)}</span>
      </nav>
      <header class="direction-header reveal is-visible">
        <h1 class="direction-title">${escapeHtml(dir.title)}</h1>
        <p class="direction-excerpt">${escapeHtml(dir.excerpt)}</p>
      </header>
      <div class="direction-gallery" role="list">${thumbs}</div>
    `;

    const lightbox = document.getElementById("lightbox");
    const lightboxImg = lightbox?.querySelector(".lightbox__img");
    const lightboxClose = lightbox?.querySelector(".lightbox__close");
    const lightboxPrev = document.getElementById("lightbox-prev");
    const lightboxNext = document.getElementById("lightbox-next");
    const lightboxCounter = document.getElementById("lightbox-counter");
    const urls = (dir.gallery || []).map((g) => ({ src: g.src, alt: g.alt || "" }));
    let currentIdx = 0;

    function updateLightboxChrome() {
      const multi = urls.length > 1;
      if (lightboxPrev) {
        lightboxPrev.hidden = !multi;
        lightboxPrev.disabled = !multi;
      }
      if (lightboxNext) {
        lightboxNext.hidden = !multi;
        lightboxNext.disabled = !multi;
      }
      if (lightboxCounter) {
        lightboxCounter.hidden = !multi;
        if (multi) lightboxCounter.textContent = `${currentIdx + 1} / ${urls.length}`;
      }
    }

    function showSlide(index) {
      if (!lightboxImg || !urls.length) return;
      const i = ((index % urls.length) + urls.length) % urls.length;
      currentIdx = i;
      lightboxImg.src = urls[i].src;
      lightboxImg.alt = urls[i].alt;
      updateLightboxChrome();
    }

    function openLightbox(index) {
      if (!lightbox || !lightboxImg || !urls[index]) return;
      showSlide(index);
      lightbox.removeAttribute("hidden");
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
      lightboxClose?.focus();
    }

    function closeLightbox() {
      if (!lightbox || !lightboxImg) return;
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
      window.setTimeout(() => {
        lightbox.setAttribute("hidden", "");
        lightboxImg.removeAttribute("src");
        lightboxImg.alt = "";
      }, 350);
    }

    root.querySelectorAll("[data-lightbox-d]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-lightbox-d"));
        openLightbox(i);
      });
    });

    lightboxClose?.addEventListener("click", closeLightbox);
    lightboxPrev?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (urls.length > 1) showSlide(currentIdx - 1);
    });
    lightboxNext?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (urls.length > 1) showSlide(currentIdx + 1);
    });
    lightbox?.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (!lightbox?.classList.contains("is-open")) return;
      if (e.key === "Escape") {
        closeLightbox();
        return;
      }
      if (urls.length <= 1) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        showSlide(currentIdx + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        showSlide(currentIdx - 1);
      }
    });
  }

  load();
})();
