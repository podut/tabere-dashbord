# HTCMX Airsoft — Web (SvelteKit)

Panou admin + site public pentru clubul de airsoft HTCMX.  
Backend: Supabase local (PostgreSQL + Storage).

---

## Stack

| Tehnologie | Versiune | Rol |
|---|---|---|
| SvelteKit | 2.x | framework fullstack (folosit doar client-side) |
| Svelte | 5.x (Runes) | UI — `$state`, `$derived`, `$props` |
| TypeScript | 6.x | tipuri |
| Supabase JS | 2.x | auth, baza de date, storage |
| svelte-easy-crop | 5.x | crop imagini inainte de upload |
| Vite | 8.x | bundler dev/build |

---

## Structura proiect

```
web/
├── .env                          ← variabile locale (nu e in git)
├── .env.example                  ← template — copiaza ca .env si completeaza
├── src/
│   ├── app.html                  ← shell HTML
│   ├── app.d.ts                  ← tipuri globale SvelteKit
│   │
│   ├── lib/
│   │   ├── supabase.ts           ← client Supabase singleton + STORAGE_BUCKET
│   │   ├── components/
│   │   │   ├── Header.svelte     ← header site public
│   │   │   ├── Footer.svelte     ← footer site public
│   │   │   └── MealCard.svelte   ← card produs
│   │   ├── styles/
│   │   │   ├── admin.css         ← tot stilul panoului admin
│   │   │   ├── style.css         ← stiluri globale site public
│   │   │   ├── general.css
│   │   │   ├── meals-page.css
│   │   │   └── queries.css       ← media queries site public
│   │   └── utils/
│   │       └── image.ts          ← getCroppedImg() — canvas crop helper
│   │
│   └── routes/
│       ├── +layout.svelte        ← layout radacina (toate rutele)
│       ├── admin/
│       │   └── +page.svelte      ← SPA admin complet  →  /admin
│       └── (site)/               ← grup rute site public (fara /site/ in URL)
│           ├── +layout.svelte    ← layout cu Header + Footer
│           ├── +page.svelte      ← Home                →  /
│           ├── meals/
│           │   ├── +page.svelte  ← lista produse        →  /meals
│           │   └── [id]/
│           │       └── +page.svelte  ← detaliu produs   →  /meals/[id]
```

---

## Setup local

### 1. Porneste Supabase local

```powershell
cd ..\airsoft-client-standalone
supabase start
supabase status          # copiaza URL si keys
```

### 2. Creeaza `.env`

```powershell
cp .env.example .env
```

Completeaza cu valorile din `supabase status`:

```env
PUBLIC_SUPABASE_URL=http://192.168.0.X:54321   # IP LAN, nu 127.0.0.1
PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
PUBLIC_STORAGE_BUCKET=assets
```

> **NU adauga `SERVICE_ROLE_KEY` cu prefix `PUBLIC_`.** Cheia service_role
> bypass-eaza RLS — daca e expusa in browser, orice atacator poate citi/sterge
> baza de date. Daca chiar ai nevoie de ea, foloseste-o doar in endpoint-uri
> server-side SvelteKit (`+server.ts`) si declara variabila fara prefix
> `PUBLIC_` (ex: `SUPABASE_SERVICE_ROLE_KEY=...`).

> **Important:** foloseste IP-ul LAN al masinii (nu `127.0.0.1`).
> Altfel URL-urile imaginilor din DB nu sunt accesibile de pe telefon/alte dispozitive.

### 3. Instaleaza dependente si porneste dev server

```powershell
npm install
npm run dev
```

Aplicatia ruleaza pe `http://localhost:5173`.

---

## Rute

| URL | Descriere |
|---|---|
| `/` | Pagina principala site public |
| `/meals` | Lista produse/servicii publice |
| `/meals/[id]` | Detaliu produs |
| `/admin` | Panou de administrare (necesita autentificare) |

---

## Panoul Admin (`/admin`)

SPA intr-un singur fisier (`src/routes/admin/+page.svelte`).
Login cu email + parola prin Supabase Auth.

### Sectiuni

| Sectiune | Continut |
|---|---|
| Evenimente | CRUD evenimente, cereri rezervare, galerie per eveniment |
| Echipament | Ierarhie sectiuni/produse cu imagini |
| Magazin | Produse shop cu imagini si stoc |
| Comenzi | Comenzi cu status si total venituri |
| Utilizatori | Lista paginata (10/50/100), cautare server-side |
| Parteneri | CRUD parteneri cu logo |
| Servicii | CRUD servicii cu galerie foto per serviciu |
| Galerie Foto | Galerie globala cu drag-and-drop reorder si edit label |
| Notificari | Trimitere/programare notificari push |
| Continut Site | Imagini hero pentru paginile Home si Servicii |

### Upload imagini

Toate imaginile trec printr-un crop canvas inainte de upload:
- **1:1** — imagini principale (produse, servicii, echipament, parteneri)
- **16:9** — galerii si imagini hero

Flow: `<input type="file">` → `onFileSelected()` → crop overlay → `handleFinalizeCrop()` → upload Supabase Storage → URL salvat in DB.

---

## Variabile de mediu

| Variabila | Descriere |
|---|---|
| `PUBLIC_SUPABASE_URL` | URL instanta Supabase (cu IP LAN) |
| `PUBLIC_SUPABASE_ANON_KEY` | Cheia publica anon |
| `PUBLIC_STORAGE_BUCKET` | Numele bucket-ului Storage (default: `assets`) |

Toate variabilele cu prefix `PUBLIC_` sunt expuse in browser prin `$env/static/public`.
Variabilele **fara** prefix `PUBLIC_` raman strict server-side si sunt accesibile doar
prin `$env/static/private` in `+server.ts` / `+page.server.ts`.

---

## Comenzi utile

```powershell
npm run dev          # dev server cu HMR
npm run build        # build productie
npm run preview      # preview build local
npm run check        # type check Svelte + TypeScript
```

---

## Conventii cod

- **Svelte 5 Runes** peste tot — `$state()`, `$derived()`, nu `writable()`
- Fara server-side load functions (`+page.server.ts`) — totul e client-side cu Supabase JS direct
- CSS admin in `admin.css`, CSS site public in fisierele separate din `styles/`
- Imaginile se stocheaza ca URL-uri publice in coloane `image_url` (string) sau `gallery` (JSONB array)
- Adaugarea de pagini noi pe site: creeaza `src/routes/(site)/numele-paginii/+page.svelte` — mosteneste automat Header + Footer
