(function () {
  "use strict";

  const TOKEN_KEY = "photographer-admin-token";
  const EMAIL_KEY = "photographer-admin-email";
  let siteData = null;
  let uploadTargetEl = null;

  const loginPanel = document.getElementById("admin-login");
  const appPanel = document.getElementById("admin-app");
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const loginError = document.getElementById("login-error");
  const adminUserEmail = document.getElementById("admin-user-email");
  const btnLogin = document.getElementById("btn-login");
  const btnLogout = document.getElementById("btn-logout");

  const els = {
    status: document.getElementById("status"),
    form: document.getElementById("form"),
    btnReload: document.getElementById("btn-reload"),
    btnSave: document.getElementById("btn-save"),
    fileUpload: document.getElementById("file-upload"),
  };

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function setToken(t) {
    if (t) sessionStorage.setItem(TOKEN_KEY, t);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function setAdminEmail(email) {
    if (email) sessionStorage.setItem(EMAIL_KEY, String(email).trim());
    else sessionStorage.removeItem(EMAIL_KEY);
    updateUserBadge();
  }

  function updateUserBadge() {
    const em = sessionStorage.getItem(EMAIL_KEY) || "";
    if (adminUserEmail) {
      adminUserEmail.textContent = em;
      adminUserEmail.hidden = !em;
    }
  }

  function showLogin() {
    document.body.classList.remove("admin--authed");
    document.body.classList.add("admin--guest");
    if (loginPanel) loginPanel.hidden = false;
    if (appPanel) appPanel.hidden = true;
    if (loginError) {
      loginError.hidden = true;
      loginError.textContent = "";
    }
    window.scrollTo(0, 0);
  }

  function showApp() {
    document.body.classList.remove("admin--guest");
    document.body.classList.add("admin--authed");
    if (loginPanel) loginPanel.hidden = true;
    if (appPanel) appPanel.hidden = false;
    window.scrollTo(0, 0);
  }

  function escAttr(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function splitPath(pathStr) {
    const parts = [];
    pathStr.split(".").forEach((seg) => {
      const m = /^(\w+)\[(\d+)\]$/.exec(seg);
      if (m) parts.push(m[1], Number(m[2]));
      else if (seg) parts.push(seg);
    });
    return parts;
  }

  function setDeep(obj, keys, val) {
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      const nk = keys[i + 1];
      if (cur[k] == null || typeof cur[k] !== "object") {
        cur[k] = typeof nk === "number" ? [] : {};
      }
      cur = cur[k];
    }
    cur[keys[keys.length - 1]] = val;
  }

  function pathSelector(path) {
    return '[data-path="' + path.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"]';
  }

  function slugIdFromTitle(title) {
    const t = String(title || "")
      .trim()
      .toLowerCase();
    const map = {
      а: "a",
      б: "b",
      в: "v",
      г: "h",
      ґ: "g",
      д: "d",
      е: "e",
      є: "ie",
      ж: "zh",
      з: "z",
      и: "y",
      і: "i",
      ї: "i",
      й: "i",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "kh",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "shch",
      ь: "",
      ю: "iu",
      я: "ya",
      ы: "y",
      э: "e",
      ъ: "",
      ё: "io",
    };
    let s = "";
    for (const ch of t) {
      if (map[ch] !== undefined) s += map[ch];
      else if (/[a-z0-9]/.test(ch)) s += ch;
      else if (/\s/.test(ch) || ch === "_") s += "-";
      else if (ch === "-") s += "-";
    }
    s = s.replace(/-+/g, "-").replace(/^-|-$/g, "");
    return s || "category";
  }

  function updateThumbAfterUpload(inputEl, urlPath) {
    if (!inputEl || !urlPath) return;
    const row = inputEl.closest(".admin-media-row");
    if (!row) return;
    const src = urlPath.startsWith("http") ? urlPath : "/" + urlPath.replace(/^\//, "");
    const thumb = row.querySelector(".admin-thumb");
    const empty = row.querySelector(".admin-thumb--empty");
    function onImgError(img) {
      img.classList.add("admin-thumb--broken");
    }
    if (thumb && thumb.tagName === "IMG") {
      thumb.classList.remove("admin-thumb--broken");
      thumb.onload = function () {
        thumb.classList.remove("admin-thumb--broken");
      };
      thumb.onerror = function () {
        onImgError(thumb);
      };
      thumb.src = src;
    } else if (empty) {
      const img = document.createElement("img");
      img.className = "admin-thumb";
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      img.onerror = function () {
        onImgError(img);
      };
      empty.replaceWith(img);
    }
  }

  function syncFromForm() {
    if (!siteData) return;
    document.querySelectorAll("[data-path]").forEach((el) => {
      const keys = splitPath(el.dataset.path);
      if (el.type === "checkbox") setDeep(siteData, keys, el.checked);
      else setDeep(siteData, keys, el.value);
    });
    const mq = document.getElementById("field-marquee");
    if (mq && siteData.directionsSection) {
      siteData.directionsSection.marquee = mq.value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const heroLead = document.getElementById("field-hero-leadLines");
    if (heroLead && siteData.hero) {
      siteData.hero.leadLines = heroLead.value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const aboutPara = document.getElementById("field-about-paragraphs");
    if (aboutPara && siteData.about) {
      siteData.about.paragraphs = aboutPara.value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  function setStatus(msg, kind) {
    els.status.textContent = msg || "";
    els.status.className = kind ? "is-" + kind : "";
  }

  function authHeaders() {
    const t = getToken();
    const h = { Accept: "application/json" };
    if (t) h.Authorization = "Bearer " + t;
    return h;
  }

  async function loadData() {
    const res = await fetch("/api/site?" + Date.now(), { headers: authHeaders() });
    if (!res.ok) {
      if (res.status === 401) {
        setToken("");
        setAdminEmail("");
        showLogin();
      }
      throw new Error(res.status === 401 ? "Сесію завершено — увійдіть знову." : "Помилка " + res.status);
    }
    siteData = await res.json();
    render();
    setStatus("Дані завантажено. Після змін натисніть «Зберегти зміни».", "ok");
  }

  async function saveData() {
    syncFromForm();
    const t = getToken();
    if (!t) {
      setStatus("Увійдіть у кабінет.", "error");
      return;
    }
    const res = await fetch("/api/site", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + t,
      },
      body: JSON.stringify(siteData),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || "Помилка " + res.status);
    }
    setStatus("Збережено. Сайт оновлено.", "ok");
  }

  async function uploadFile(file) {
    const t = getToken();
    if (!t) {
      setStatus("Увійдіть у кабінет, щоб завантажувати фото.", "error");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: "Bearer " + t },
      body: fd,
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || "Помилка завантаження");
    if (uploadTargetEl && uploadTargetEl.dataset.path) {
      uploadTargetEl.value = j.path;
      updateThumbAfterUpload(uploadTargetEl, j.path);
      setStatus("Фото збережено: " + j.path, "ok");
    } else {
      setStatus("Файл: " + j.path + " — натисніть «Завантажити фото» біля потрібного поля.", "ok");
    }
  }

  function field(label, path, value) {
    const v = value == null ? "" : value;
    return (
      '<div class="admin-field">' +
      "<label>" +
      escAttr(label) +
      '</label><input type="text" class="path-input" data-path="' +
      escAttr(path) +
      '" value="' +
      escAttr(v) +
      '" />' +
      "</div>"
    );
  }

  function mediaBlock(label, path, value) {
    const v = value == null ? "" : String(value);
    const src = v && !v.startsWith("http") ? "/" + v.replace(/^\//, "") : v;
    const thumb =
      v && !v.startsWith("http")
        ? '<img class="admin-thumb" src="' +
          escAttr(src) +
          '" alt="" loading="lazy" onerror="this.classList.add(\'admin-thumb--broken\')" />'
        : v.startsWith("http")
          ? '<img class="admin-thumb" src="' + escAttr(v) + '" alt="" loading="lazy" onerror="this.classList.add(\'admin-thumb--broken\')" />'
          : '<div class="admin-thumb admin-thumb--empty">Немає фото</div>';
    return (
      '<div class="admin-media-row">' +
      thumb +
      '<div class="admin-media-row__fields">' +
      '<div class="admin-field">' +
      "<label>" +
      escAttr(label) +
      '</label><input type="text" class="path-input" data-path="' +
      escAttr(path) +
      '" value="' +
      escAttr(v) +
      '" />' +
      "</div>" +
      '<button type="button" class="admin-upload-btn" data-upload-path="' +
      escAttr(path) +
      '">Завантажити фото</button>' +
      "</div></div>"
    );
  }

  function textareaField(label, id, value, extraClass) {
    const cls = "admin-textarea" + (extraClass ? " " + extraClass : "");
    return (
      '<div class="admin-field">' +
      "<label>" +
      escAttr(label) +
      '</label><textarea id="' +
      escAttr(id) +
      '" class="' +
      escAttr(cls) +
      '">' +
      escAttr(value) +
      "</textarea></div>"
    );
  }

  function bindMediaHelpers() {
    if (!els.form) return;
    els.form.querySelectorAll("[data-upload-path]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = btn.getAttribute("data-upload-path");
        uploadTargetEl = els.form.querySelector(pathSelector(p));
        if (uploadTargetEl) els.fileUpload.click();
      });
    });
    els.form.querySelectorAll(".admin-media-row .path-input").forEach((inp) => {
      inp.addEventListener("change", () => {
        const v = inp.value.trim();
        if (v) updateThumbAfterUpload(inp, v);
      });
    });
    els.form.querySelectorAll(".path-input").forEach((inp) => {
      inp.addEventListener("focus", () => {
        uploadTargetEl = inp;
      });
    });
  }

  function render() {
    if (!siteData) {
      els.form.innerHTML = "<p>Завантаження…</p>";
      return;
    }
    const m = siteData.meta || {};
    const h = siteData.hero || {};
    const a = siteData.about || {};
    const w = siteData.work || {};
    const ds = siteData.directionsSection || {};
    const c = siteData.contact || {};
    const f = siteData.footer || {};

    let html = "";

    html += '<section class="admin-section"><h2>Тексти сайту: заголовок і опис (вкладка браузера)</h2>';
    html += '<div class="admin-grid admin-grid--2">';
    html += field("Заголовок сторінки", "meta.title", m.title);
    html += field("Короткий опис (SEO)", "meta.description", m.description);
    html += field("Колір теми", "meta.themeColor", m.themeColor);
    html += field("Назва бренду в шапці", "meta.logo", m.logo);
    html += "</div></section>";

    html += '<section class="admin-section"><h2>Головний екран (hero)</h2>';
    html += mediaBlock("Фото на першому екрані", "hero.image", h.image);
    html += field("Підпис до фото (alt)", "hero.imageAlt", h.imageAlt);
    html += '<div class="admin-grid admin-grid--2">';
    html += field("Нік / @ у соцмережах", "hero.username", h.username);
    html += field("Ім’я — рядок 1", "hero.nameLine1", h.nameLine1);
    html += field("Ім’я — рядок 2", "hero.nameLine2", h.nameLine2);
    html += "</div>";
    html += textareaField(
      "Текст під іменем (кожен рядок — окремий рядок)",
      "field-hero-leadLines",
      (h.leadLines || []).join("\n"),
      "admin-textarea--tall"
    );
    html += '<div class="admin-grid admin-grid--2" style="margin-top:0.65rem">';
    html += field("Текст кнопки", "hero.ctaText", h.ctaText);
    html += field("Посилання кнопки (якір або URL)", "hero.ctaHref", h.ctaHref);
    html += field("Текст «гортайте»", "hero.scrollText", h.scrollText);
    html += "</div></section>";

    html += '<section class="admin-section"><h2>Блок «Про мене»</h2>';
    html += mediaBlock("Фото", "about.image", a.image);
    html += field("Підпис до фото", "about.imageAlt", a.imageAlt);
    html += '<div class="admin-grid admin-grid--2">';
    html += field("Підпис під фото", "about.caption", a.caption);
    html += field("Заголовок блоку", "about.title", a.title);
    html += "</div>";
    html += textareaField(
      "Текст абзацами (кожен рядок — новий абзац)",
      "field-about-paragraphs",
      (a.paragraphs || []).join("\n"),
      "admin-textarea--tall"
    );
    html += '<div style="margin-top:0.65rem">';
    html += field("Цитата", "about.quote", a.quote);
    html += "</div></section>";

    html += '<section class="admin-section"><h2>Сітка «Зйомки» на головній</h2>';
    html += '<p class="admin-hint">Розмір картки: normal, wide або full.</p>';
    html += '<div class="admin-grid admin-grid--2" style="margin-bottom:0.65rem">';
    html += field("Заголовок секції", "work.title", w.title);
    html += field("Підзаголовок", "work.subtitle", w.subtitle);
    html += "</div>";
    html += '<div class="admin-row-actions"><button type="button" data-action="add-work">Додати картку</button></div>';
    (w.items || []).forEach((it, i) => {
      html += '<div class="admin-card" data-work-index="' + i + '">';
      html += '<p class="admin-subhead">Картка ' + (i + 1) + "</p>";
      html += '<div class="admin-grid admin-grid--2">';
      html += field("Розмір (layout)", "work.items[" + i + "].layout", it.layout);
      html += field("Тег на картці", "work.items[" + i + "].tag", it.tag);
      html += field("Другий рядок (рік / слоган)", "work.items[" + i + "].year", it.year);
      html += field("Підказка для екранних читачів", "work.items[" + i + "].ariaLabel", it.ariaLabel);
      html += "</div>";
      html += mediaBlock("Фото картки", "work.items[" + i + "].image", it.image);
      html += field("Підпис до фото (alt)", "work.items[" + i + "].alt", it.alt);
      html +=
        '<div class="admin-row-actions"><button type="button" data-action="del-work" data-index="' +
        i +
        '">Видалити картку</button></div>';
      html += "</div>";
    });
    html += "</section>";

    html += '<section class="admin-section"><h2>Секція «Напрямки» на головній</h2>';
    html += field("Заголовок секції (наприклад «Напрямки»)", "directionsSection.title", ds.title);
    html += textareaField(
      "Бігучий рядок (кожен рядок — окремий напис)",
      "field-marquee",
      (ds.marquee || []).join("\n"),
      "admin-textarea--tall"
    );
    html += "</section>";

    html += '<section class="admin-section"><h2>Категорії та галереї</h2>';
    html +=
      '<p class="admin-hint">«Назва на сайті» видно відвідувачам. «Id у посиланні» — латиниця, без пробілів; від нього залежить адреса галереї (/direction?id=…). Якщо зміните id, оновіть посилання.</p>';
    html += '<div class="admin-row-actions"><button type="button" data-action="add-direction">Додати категорію</button></div>';
    (siteData.directions || []).forEach((d, di) => {
      html += '<div class="admin-card" data-dir-index="' + di + '">';
      html += '<p class="admin-subhead">' + escAttr(d.title || "Категорія " + (di + 1)) + "</p>";
      html += field("Назва категорії на сайті", "directions[" + di + "].title", d.title);
      html += field("Id у посиланні (латиниця)", "directions[" + di + "].id", d.id);
      html +=
        '<div class="admin-row-actions"><button type="button" data-action="slug-id" data-dir="' +
        di +
        '">Зробити id з назви (трансліт)</button></div>';
      html += field("Короткий опис під назвою", "directions[" + di + "].excerpt", d.excerpt);
      html += mediaBlock("Обкладинка на головній", "directions[" + di + "].cover", d.cover);
      html += field("Підпис обкладинки", "directions[" + di + "].coverAlt", d.coverAlt);
      html += '<p class="admin-subhead">Фото в галереї цієї категорії</p>';
      html +=
        '<div class="admin-row-actions"><button type="button" data-action="add-gallery" data-dir="' +
        di +
        '">Додати фото в галерею</button></div>';
      (d.gallery || []).forEach((g, gi) => {
        html += '<div class="admin-card" style="margin-top:0.5rem;border-style:solid">';
        html += '<p class="admin-subhead" style="margin-top:0">Фото ' + (gi + 1) + "</p>";
        html += mediaBlock("Файл зображення", "directions[" + di + "].gallery[" + gi + "].src", g.src);
        html += field("Підпис (показується в галереї та для пошуку)", "directions[" + di + "].gallery[" + gi + "].alt", g.alt);
        html +=
          '<div class="admin-row-actions"><button type="button" data-action="del-gallery" data-dir="' +
          di +
          '" data-gi="' +
          gi +
          '">Видалити це фото з галереї</button></div>';
        html += "</div>";
      });
      html +=
        '<div class="admin-row-actions"><button type="button" data-action="del-direction" data-dir="' +
        di +
        '">Видалити всю категорію</button></div>';
      html += "</div>";
    });
    html += "</section>";

    html += '<section class="admin-section"><h2>Контакти</h2>';
    html += '<div class="admin-grid admin-grid--2">';
    html += field("Заголовок блоку", "contact.title", c.title);
    html += "</div>";
    html +=
      '<div class="admin-field"><label>Текст</label><textarea data-path="contact.text" class="admin-textarea admin-textarea--tall">' +
      escAttr(c.text || "") +
      "</textarea></div>";
    html += '<div class="admin-grid admin-grid--2">';
    html += field("Текст основної кнопки", "contact.ctaText", c.ctaText);
    html += field("Посилання кнопки", "contact.ctaHref", c.ctaHref);
    html += field("Текст другого посилання", "contact.mailText", c.mailText);
    html += field("Посилання другого блоку", "contact.mailHref", c.mailHref);
    html += "</div>";
    html += '<p class="admin-subhead">Соцмережі та месенджери</p>';
    html += '<div class="admin-row-actions"><button type="button" data-action="add-social">Додати рядок</button></div>';
    (c.social || []).forEach((s, si) => {
      html += '<div class="admin-grid admin-grid--2" style="margin-top:0.5rem">';
      html += field("Назва", "contact.social[" + si + "].label", s.label);
      html += field("Посилання", "contact.social[" + si + "].href", s.href);
      html += "</div>";
      html +=
        '<div class="admin-row-actions"><button type="button" data-action="del-social" data-si="' +
        si +
        '">Видалити</button></div>';
    });
    html += "</section>";

    html += '<section class="admin-section"><h2>Підвал сайту</h2>';
    html += '<div class="admin-grid admin-grid--2">';
    html += field("Ім’я в копірайті", "footer.copyrightName", f.copyrightName);
    html += field("Нік / @", "footer.handle", f.handle);
    html += field("Кнопка «нагору»", "footer.toTop", f.toTop);
    html += "</div>";
    html +=
      '<div class="admin-checkbox"><label><input type="checkbox" data-path="footer.adminLink" ' +
      (f.adminLink ? "checked" : "") +
      ' /> Показувати посилання в кабінет у підвалі</label></div>';
    html += "</section>";

    els.form.innerHTML = html;
    bindMediaHelpers();

    els.form.querySelectorAll('[data-action="add-work"]').forEach((b) => {
      b.addEventListener("click", () => {
        syncFromForm();
        if (!siteData.work) siteData.work = { title: "", subtitle: "", items: [] };
        if (!Array.isArray(siteData.work.items)) siteData.work.items = [];
        siteData.work.items.push({
          layout: "normal",
          image: "",
          alt: "",
          tag: "",
          year: "",
          ariaLabel: "",
        });
        render();
      });
    });

    els.form.querySelectorAll('[data-action="del-work"]').forEach((b) => {
      b.addEventListener("click", () => {
        const i = Number(b.getAttribute("data-index"));
        syncFromForm();
        siteData.work.items.splice(i, 1);
        render();
      });
    });

    els.form.querySelectorAll('[data-action="add-gallery"]').forEach((b) => {
      b.addEventListener("click", () => {
        const di = Number(b.getAttribute("data-dir"));
        syncFromForm();
        if (!siteData.directions[di].gallery) siteData.directions[di].gallery = [];
        siteData.directions[di].gallery.push({ src: "", alt: "" });
        render();
      });
    });

    els.form.querySelectorAll('[data-action="del-gallery"]').forEach((b) => {
      b.addEventListener("click", () => {
        const di = Number(b.getAttribute("data-dir"));
        const gi = Number(b.getAttribute("data-gi"));
        syncFromForm();
        siteData.directions[di].gallery.splice(gi, 1);
        render();
      });
    });

    els.form.querySelectorAll('[data-action="add-direction"]').forEach((b) => {
      b.addEventListener("click", () => {
        syncFromForm();
        if (!Array.isArray(siteData.directions)) siteData.directions = [];
        siteData.directions.push({
          id: "nova-" + Date.now(),
          title: "Нова категорія",
          excerpt: "",
          cover: "",
          coverAlt: "",
          gallery: [{ src: "", alt: "" }],
        });
        render();
      });
    });

    els.form.querySelectorAll('[data-action="del-direction"]').forEach((b) => {
      b.addEventListener("click", () => {
        const di = Number(b.getAttribute("data-dir"));
        syncFromForm();
        siteData.directions.splice(di, 1);
        render();
      });
    });

    els.form.querySelectorAll('[data-action="slug-id"]').forEach((b) => {
      b.addEventListener("click", () => {
        syncFromForm();
        const di = Number(b.getAttribute("data-dir"));
        const d = siteData.directions[di];
        if (!d) return;
        d.id = slugIdFromTitle(d.title);
        render();
        setStatus("Поле «id» оновлено з назви. Перевірте та збережіть.", "ok");
      });
    });

    els.form.querySelectorAll('[data-action="add-social"]').forEach((b) => {
      b.addEventListener("click", () => {
        syncFromForm();
        if (!siteData.contact) siteData.contact = {};
        if (!Array.isArray(siteData.contact.social)) siteData.contact.social = [];
        siteData.contact.social.push({ label: "", href: "" });
        render();
      });
    });

    els.form.querySelectorAll('[data-action="del-social"]').forEach((b) => {
      b.addEventListener("click", () => {
        const si = Number(b.getAttribute("data-si"));
        syncFromForm();
        siteData.contact.social.splice(si, 1);
        render();
      });
    });
  }

  async function onLogin() {
    const email = (loginEmail && loginEmail.value) || "";
    const pwd = (loginPassword && loginPassword.value) || "";
    if (!email.trim() || !pwd.trim()) {
      if (loginError) {
        loginError.textContent = "Введіть email і пароль адміністратора.";
        loginError.hidden = false;
      }
      return;
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: pwd.trim() }),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg;
        try {
          const j = JSON.parse(text);
          msg = j.error || null;
        } catch {
          msg = null;
        }
        if (!msg) {
          if (res.status === 404) {
            msg =
              "Сервер повернув 404: це не наш Node-сервер або інший порт. Запустіть у папці проєкту npm start і відкрийте адмінку з тим самим портом, що в консолі (за замовч. http://localhost:8777/admin/admin.html).";
          } else if (res.status === 401) {
            msg = "Невірний email або пароль";
          } else {
            msg = "Відповідь сервера: код " + res.status + ". Перезапустіть npm start.";
          }
        }
        throw new Error(msg);
      }
      setToken(pwd.trim());
      setAdminEmail(email.trim());
      if (loginEmail) loginEmail.value = "";
      if (loginPassword) loginPassword.value = "";
      if (loginError) loginError.hidden = true;
      showApp();
      updateUserBadge();
      await loadData();
    } catch (e) {
      if (loginError) {
        const net =
          e instanceof TypeError ||
          String(e.message || "").toLowerCase().includes("failed to fetch");
        loginError.textContent = net
          ? "Немає зв’язку з сервером. Запустіть npm start у папці photographer-portfolio і відкрийте адмінку через http://localhost:8777/admin/admin.html (не через file://)."
          : e.message || "Помилка входу";
        loginError.hidden = false;
      }
    }
  }

  function onLogout() {
    setToken("");
    setAdminEmail("");
    siteData = null;
    if (els.form) els.form.innerHTML = "";
    showLogin();
    setStatus("", "");
  }

  async function tryResumeSession() {
    const t = getToken();
    if (!t) return;
    try {
      const res = await fetch("/api/site?" + Date.now(), { headers: authHeaders() });
      if (!res.ok) throw new Error("401");
      siteData = await res.json();
      showApp();
      updateUserBadge();
      render();
      setStatus("Ви увійшли. Дані завантажено.", "ok");
    } catch {
      setToken("");
      setAdminEmail("");
      showLogin();
    }
  }

  btnLogin?.addEventListener("click", onLogin);
  loginEmail?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      loginPassword?.focus();
    }
  });
  loginPassword?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onLogin();
  });

  btnLogout?.addEventListener("click", onLogout);

  els.btnReload?.addEventListener("click", () => {
    loadData().catch((e) => setStatus(e.message, "error"));
  });

  els.btnSave?.addEventListener("click", () => {
    saveData().catch((e) => setStatus(e.message, "error"));
  });

  els.fileUpload?.addEventListener("change", () => {
    const file = els.fileUpload.files[0];
    els.fileUpload.value = "";
    if (!file) return;
    uploadFile(file).catch((e) => setStatus(e.message, "error"));
  });

  tryResumeSession();
})();
