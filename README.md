# Портфоліо фотографа

Сайт + адмінка (редагування текстів і фото).

## Локально

```bash
npm install
npm start
```

Відкрийте http://localhost:8777 — кабінет: `/admin/admin.html` (email/пароль змінні `ADMIN_EMAIL`, `ADMIN_TOKEN`).

## Винести на Vercel (мінімум дій)

1. **GitHub** — створіть новий репозиторій і запуште цю папку (`git init`, `git add .`, `git commit`, `git remote add`, `git push`).
2. **vercel.com** → **Add New…** → **Project** → імпорт репозиторія.
3. У **Environment Variables** додайте (Production):
   - `ADMIN_EMAIL` — пошта для входу в кабінет  
   - `ADMIN_TOKEN` — надійний пароль (не залишайте `dev-token`)
4. **Deploy**.

Після деплою сайт одразу відкривається з `data/site.json` з репозиторію.

### Щоб адмінка **зберігала** зміни на Vercel

Файли в деплої не перезаписуються. Один раз у [Vercel](https://vercel.com):

1. **Marketplace** → знайдіть **Upstash Redis** (або **Redis**) → **Add** до проєкту — з’являться `UPSTASH_REDIS_REST_URL` і `UPSTASH_REDIS_REST_TOKEN`.
2. **Storage** → **Blob** для проєкту — з’явиться `BLOB_READ_WRITE_TOKEN` (для завантаження фото).

**Redeploy**. Ключ у Redis: `site_json` (рядок з усім `site.json`).

## Docker

```bash
docker compose up --build
```

Порт і паролі — у `docker-compose.yml`.
