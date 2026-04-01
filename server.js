/**
 * Статика + API. Локально: npm start. Vercel: експорт app, див. api/index.js.
 * Продакшен на Vercel: Redis (Upstash у Vercel → змінні UPSTASH_* або KV_REST_*) + Blob для фото.
 */
const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const ROOT = process.cwd();
const SITE_PATH = path.join(ROOT, "data", "site.json");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "dev-token";
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "admin@example.com")
  .trim()
  .toLowerCase();

function useRedis() {
  const up = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
  const kv = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
  return Boolean(up || kv);
}

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return Redis.fromEnv();
  }
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
  return null;
}

function readSiteFromFile() {
  return fs.readFileSync(SITE_PATH, "utf8");
}

app.use(express.json({ limit: "5mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
    cb(null, ok);
  },
});

function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.post("/api/auth/login", (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const email = String(body.email ?? "").trim().toLowerCase();
  const pwd = String(body.password ?? body.token ?? "").trim();
  if (!email || !pwd) {
    return res.status(400).json({ error: "Вкажіть email і пароль" });
  }
  if (email !== ADMIN_EMAIL || pwd !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Невірний email або пароль" });
  }
  res.json({ ok: true });
});

app.get("/api/site", async (_req, res) => {
  try {
    if (useRedis()) {
      const redis = await getRedis();
      let raw = await redis.get("site_json");
      if (raw == null || raw === "") {
        raw = readSiteFromFile();
      } else if (typeof raw === "object") {
        raw = JSON.stringify(raw);
      } else if (typeof raw !== "string") {
        raw = String(raw);
      }
      return res.type("json").send(raw);
    }
    res.type("json").send(readSiteFromFile());
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post("/api/site", requireAuth, async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid body" });
    }
    const str = JSON.stringify(body, null, 2);
    if (useRedis()) {
      const redis = await getRedis();
      await redis.set("site_json", str);
    } else {
      try {
        fs.writeFileSync(SITE_PATH, str, "utf8");
      } catch (err) {
        const onVercel = Boolean(process.env.VERCEL);
        return res.status(503).json({
          error: onVercel
            ? "На Vercel увімкніть Redis (Marketplace → Upstash) або старий KV — з’являться UPSTASH_* або KV_REST_* змінні, потім Redeploy."
            : String(err.message),
        });
      }
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post("/api/upload", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file or invalid type" });
  }
  const ext = path.extname(req.file.originalname || "") || ".jpg";
  const safe = `upload-${Date.now()}${ext.toLowerCase()}`;
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`portfolio/${safe}`, req.file.buffer, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return res.json({ path: blob.url, url: blob.url });
    }
    const dir = path.join(ROOT, "images");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, safe), req.file.buffer);
    const urlPath = "images/" + safe;
    res.json({ path: urlPath, url: "/" + urlPath });
  } catch (e) {
    const onVercel = Boolean(process.env.VERCEL);
    if (onVercel && !process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(503).json({
        error:
          "На Vercel підключіть Blob Storage (змінна BLOB_READ_WRITE_TOKEN) для завантаження фото.",
      });
    }
    res.status(500).json({ error: String(e.message) });
  }
});

app.get(["/direction", "/direction/"], (_req, res) => {
  res.sendFile(path.join(ROOT, "direction.html"));
});

app.use(express.static(ROOT));

const PORT = Number(process.env.PORT) || 8777;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Site: http://localhost:${PORT}/`);
    console.log(`Admin: http://localhost:${PORT}/admin/admin.html`);
    console.log(`Кабінет — email для входу: ${ADMIN_EMAIL}`);
    if (!process.env.ADMIN_EMAIL) {
      console.log(`  (ADMIN_EMAIL не задано → використано admin@example.com)`);
    }
    if (!process.env.ADMIN_TOKEN) {
      console.log(`  Пароль за замовчуванням: dev-token (задайте ADMIN_TOKEN у продакшені)`);
    } else {
      console.log(`  Пароль з ADMIN_TOKEN`);
    }
    if (useRedis()) console.log("  Redis: увімкнено (ключ site_json)");
    else console.log("  Redis: вимкнено — data/site.json з диску");
  });
}

module.exports = app;
