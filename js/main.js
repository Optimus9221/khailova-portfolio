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

  function renderMarquee(parts) {
    const seg = parts
      .map(
        (p) =>
          `<span>${escapeHtml(p)}</span><span>·</span>`
      )
      .join("");
    return `<div class="stories__track">${seg}${seg}</div>`;
  }

  function renderWorkItems(items) {
    return items
      .map((it, i) => {
        let layoutClass = "";
        if (it.layout === "wide") layoutClass = " work__item--wide";
        else if (it.layout === "full") layoutClass = " work__item--full";
        const delay = i ? ` style="--d: ${(Math.min(i * 0.04, 0.2)).toFixed(2)}s"` : "";
        const lb = String(i + 1);
        return `<li class="work__item reveal${layoutClass}" data-reveal${delay}>
            <button type="button" class="work__card" data-lightbox="${lb}" aria-label="${escapeHtml(it.ariaLabel)}">
              <span class="work__card-shift" aria-hidden="true">
                <img src="${escapeHtml(it.image)}" alt="${escapeHtml(it.alt)}" width="900" height="1200" loading="lazy" />
              </span>
              <span class="work__meta"><span class="work__tag">${escapeHtml(it.tag)}</span><span class="work__year">${escapeHtml(it.year)}</span></span>
            </button>
          </li>`;
      })
      .join("");
  }

  function renderDirections(dirs) {
    return dirs
      .map((d, i) => {
        const delay = i ? ` style="--d: ${(i * 0.08).toFixed(2)}s"` : "";
        const href = `/direction?id=${encodeURIComponent(d.id)}`;
        return `<article class="story-card story-card--clickable reveal" data-reveal${delay}>
            <a class="story-card__link" href="${href}" aria-label="Галерея: ${escapeHtml(d.title)}"></a>
            <img src="${escapeHtml(d.cover)}" alt="${escapeHtml(d.coverAlt || d.title)}" width="600" height="400" loading="lazy" />
            <h3>${escapeHtml(d.title)}</h3>
            <p>${escapeHtml(d.excerpt)}</p>
            <span class="story-card__cta">Галерея →</span>
          </article>`;
      })
      .join("");
  }

  function renderMain(data) {
    const h = data.hero;
    const lead = h.leadLines.map((l) => escapeHtml(l)).join("<br />");
    const about = data.about;
    const paragraphs = about.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    const m = data.meta;
    const ds = data.directionsSection;
    const c = data.contact;
    const f = data.footer;

    document.title = m.title;
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", m.description);
    const tc = document.querySelector('meta[name="theme-color"]');
    if (tc) tc.setAttribute("content", m.themeColor);

    return `
    <section class="hero" id="top">
      <div class="hero__media">
        <div class="hero__media-shift" aria-hidden="true">
          <img src="${escapeHtml(h.image)}" alt="${escapeHtml(h.imageAlt)}" width="1920" height="1080" fetchpriority="high" decoding="async" />
        </div>
        <div class="hero__wash"></div>
      </div>
      <div class="hero__content">
        <p class="hero__username reveal" data-reveal>${escapeHtml(h.username)}</p>
        <h1 class="hero__title reveal" data-reveal style="--d: 0.08s">
          <span class="hero__title-line">${escapeHtml(h.nameLine1)}</span>
          <span class="hero__title-line hero__title-line--accent">${escapeHtml(h.nameLine2)}</span>
        </h1>
        <p class="hero__lead reveal" data-reveal style="--d: 0.16s">${lead}</p>
        <a class="btn btn--primary reveal magnetic" data-reveal style="--d: 0.24s" href="${escapeHtml(h.ctaHref)}">${escapeHtml(h.ctaText)}</a>
      </div>
      <div class="hero__scroll" aria-hidden="true">
        <span class="hero__scroll-text">${escapeHtml(h.scrollText)}</span>
        <span class="hero__scroll-line"></span>
      </div>
    </section>

    <section class="about section" id="about">
      <div class="container about__grid">
        <figure class="about__portrait frame reveal" data-reveal>
          <img src="${escapeHtml(about.image)}" alt="${escapeHtml(about.imageAlt)}" width="600" height="750" loading="lazy" decoding="async" />
          <figcaption class="about__caption">${escapeHtml(about.caption)}</figcaption>
        </figure>
        <div class="about__text">
          <h2 class="section__title reveal" data-reveal>${escapeHtml(about.title)}</h2>
          <div class="about__body reveal" data-reveal style="--d: 0.1s">
            ${paragraphs}
            <blockquote class="about__quote">${escapeHtml(about.quote)}</blockquote>
          </div>
        </div>
      </div>
    </section>

    <section class="work section" id="work">
      <div class="container">
        <header class="section__head reveal" data-reveal>
          <h2 class="section__title">${escapeHtml(data.work.title)}</h2>
          <p class="section__subtitle">${escapeHtml(data.work.subtitle)}</p>
        </header>
        <ul class="work__gallery" role="list">${renderWorkItems(data.work.items)}</ul>
      </div>
    </section>

    <section class="stories section" id="stories">
      <div class="container">
        <h2 class="section__title reveal" data-reveal>${escapeHtml(ds.title)}</h2>
        <div class="stories__marquee" aria-hidden="true">${renderMarquee(ds.marquee)}</div>
        <div class="stories__grid stories__grid--many">${renderDirections(data.directions)}</div>
      </div>
    </section>

    <section class="contact section" id="contact">
      <div class="container contact__inner reveal" data-reveal>
        <h2 class="section__title">${escapeHtml(c.title)}</h2>
        <p class="contact__text">${escapeHtml(c.text)}</p>
        <a class="btn btn--primary contact__cta magnetic" href="${escapeHtml(c.ctaHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.ctaText)}</a>
        <a class="contact__mail magnetic" href="${escapeHtml(c.mailHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.mailText)}</a>
        <ul class="contact__social" role="list">
          ${c.social
            .map(
              (s) =>
                `<li><a href="${escapeHtml(s.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.label)}</a></li>`
            )
            .join("")}
        </ul>
      </div>
    </section>

    <footer class="site-footer">
      <div class="container site-footer__inner">
        <span>© <span id="year"></span> ${escapeHtml(f.copyrightName)} · <span class="site-footer__handle">${escapeHtml(f.handle)}</span>
        ${f.adminLink ? ` · <a class="site-footer__admin" href="admin/admin.html">Адмін</a>` : ""}</span>
        <a href="#top" class="to-top magnetic">${escapeHtml(f.toTop)}</a>
      </div>
      <div class="container site-footer__stamp-row">
        <a
          class="site-footer__stamp"
          href="https://github.com/Optimus9221"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/stamp/optimus-stamp-dark-theme-uk.svg"
            alt="Розроблено Optimus"
            width="180"
            height="32"
            decoding="async"
          />
        </a>
      </div>
    </footer>`;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  function bindSmoothParallax(container, shiftEl, opts) {
    if (prefersReducedMotion || !finePointer.matches) return;
    const maxMove = opts?.maxMove ?? 18;
    const ease = opts?.ease ?? 0.09;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let rafId = 0;

    function tick() {
      curX += (targetX - curX) * ease;
      curY += (targetY - curY) * ease;
      shiftEl.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      if (Math.hypot(targetX - curX, targetY - curY) > 0.04) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    }

    function kick() {
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    container.addEventListener(
      "pointermove",
      (e) => {
        const r = container.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        targetX = -nx * maxMove * 2;
        targetY = -ny * maxMove * 2;
        kick();
      },
      { passive: true }
    );

    container.addEventListener("pointerleave", () => {
      targetX = 0;
      targetY = 0;
      kick();
    });
  }

  function initInteractive() {
    const header = document.querySelector(".site-header");
    const nav = document.querySelector(".site-nav");
    const navToggle = document.querySelector(".nav-toggle");
    const yearEl = document.getElementById("year");
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = lightbox?.querySelector(".lightbox__img");
    const lightboxClose = lightbox?.querySelector(".lightbox__close");
    const lightboxPrev = document.getElementById("lightbox-prev");
    const lightboxNext = document.getElementById("lightbox-next");
    const lightboxCounter = document.getElementById("lightbox-counter");

    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }

    function onScroll() {
      if (!header) return;
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function closeMobileNav() {
      if (!navToggle || !nav) return;
      navToggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    if (navToggle && nav) {
      navToggle.addEventListener("click", () => {
        const open = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", String(!open));
        nav.classList.toggle("is-open", !open);
        document.body.style.overflow = !open ? "hidden" : "";
      });

      nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMobileNav);
      });

      window.addEventListener(
        "resize",
        () => {
          if (window.innerWidth > 768) closeMobileNav();
        },
        { passive: true }
      );
    }

    const revealEls = document.querySelectorAll("[data-reveal]");
    if (revealEls.length && !prefersReducedMotion) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    }

    const galleryButtons = document.querySelectorAll("[data-lightbox]");
    const workGallery = Array.from(galleryButtons).map((btn) => {
      const img = btn.querySelector("img");
      return {
        src: img ? img.currentSrc || img.src : "",
        alt: img ? img.alt || "" : "",
      };
    });
    let workLightboxIndex = 0;

    function updateWorkLightboxChrome() {
      const multi = workGallery.length > 1;
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
        if (multi) lightboxCounter.textContent = `${workLightboxIndex + 1} / ${workGallery.length}`;
      }
    }

    function showWorkSlide(index) {
      if (!lightboxImg || !workGallery.length) return;
      const i = ((index % workGallery.length) + workGallery.length) % workGallery.length;
      workLightboxIndex = i;
      const item = workGallery[i];
      lightboxImg.src = item.src;
      lightboxImg.alt = item.alt;
      updateWorkLightboxChrome();
    }

    function openLightboxAt(index) {
      if (!lightbox || !lightboxImg || !workGallery[index]) return;
      showWorkSlide(index);
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

    galleryButtons.forEach((btn, i) => {
      btn.addEventListener("click", () => openLightboxAt(i));
    });

    lightboxClose?.addEventListener("click", closeLightbox);
    lightboxPrev?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (workGallery.length > 1) showWorkSlide(workLightboxIndex - 1);
    });
    lightboxNext?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (workGallery.length > 1) showWorkSlide(workLightboxIndex + 1);
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
      if (workGallery.length <= 1) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        showWorkSlide(workLightboxIndex + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        showWorkSlide(workLightboxIndex - 1);
      }
    });

    const hero = document.querySelector(".hero");
    const heroShift = document.querySelector(".hero__media-shift");
    if (hero && heroShift) {
      bindSmoothParallax(hero, heroShift, { maxMove: 22, ease: 0.09 });
    }

    document.querySelectorAll(".work__card").forEach((card) => {
      const shift = card.querySelector(".work__card-shift");
      if (shift) {
        bindSmoothParallax(card, shift, { maxMove: 14, ease: 0.1 });
      }
    });

    if (!prefersReducedMotion) {
      document.querySelectorAll(".magnetic").forEach((el) => {
        const node = /** @type {HTMLElement} */ (el);
        node.addEventListener("pointermove", (e) => {
          const rect = node.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          const move = 10;
          node.style.transform = `translate(${x / move}px, ${y / move}px)`;
        });
        node.addEventListener("pointerleave", () => {
          node.style.transform = "";
        });
      });
    }
  }

  async function main() {
    const mainEl = document.getElementById("site-main");
    if (!mainEl) return;

    let data;
    try {
      const res = await fetch("/api/site?" + Date.now());
      if (!res.ok) throw new Error(String(res.status));
      data = await res.json();
    } catch (e) {
      mainEl.innerHTML =
        '<section class="section"><div class="container"><p class="section__subtitle">Не вдалося завантажити контент. Запустіть <code>npm start</code> локально або відкрийте задеплоєний сайт на Vercel.</p></div></section>';
      return;
    }

    const logo = document.querySelector(".logo");
    if (logo && data.meta?.logo) {
      logo.textContent = data.meta.logo;
    }

    mainEl.innerHTML = renderMain(data);
    initInteractive();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
