# Arhitectură Web-Admin HTCMX

## Flux de Date
Proiectul folosește **Svelte 5** cu rune (`$state`, `$derived`, `$props`) pentru gestionarea stării.

### 1. Stratul de Date (`src/lib/data`)
- **Supabase Client**: Configurat în `$lib/supabase`.
- **Repositories**: Modele de interacțiune cu DB (ex: `NotificationRepository`). Toate apelurile CRUD grele ar trebui să migreze aici.

### 2. Stratul de UI (`src/lib/features/admin/components`)
Fiecare modul major are propriul folder:
- **Auth**: `LoginScreen.svelte` - Gestionează sesiunea admin.
- **Dashboard**: `StatsGrid.svelte` - Afișează indicatorii de performanță globali.
- **Events**: `EventsManager.svelte` - Cel mai complex modul; gestionează Evenimentele Active, Finalizate și **📥 Cererile (Bookings)**.
- **Shop**: `ShopManager.svelte` - Managementul produselor și stocurilor.
- **Orders**: `OrdersManager.svelte` - Procesarea comenzilor pe statusuri (Nou, Confirmat, etc.).
- **Equipment**: `EquipmentManager.svelte` - Structură ierarhică pentru echipamentul de închiriat.
- **Users**: `UsersManager.svelte` - Listă utilizatori cu paginare și căutare.
- **SiteContent**: `SiteContentManager.svelte` - CMS pentru textele și imaginile din aplicația mobilă.
- **NotificationsPanel.svelte**: Managementul notificărilor programate și recurente.
- **GalleryManager.svelte**: Galerie foto globală cu reordonare Drag & Drop.
- **ServicesManager.svelte**: Management parteneri și servicii oferite.

### 3. Gestionarea Evenimentelor & Cererilor
Logica este centrată pe transformarea cererilor venite de la clienți în evenimente active:
- **Cererile (Bookings)**: Sunt solicitări brute (nume, telefon, activitate dorită).
- **Evenimentele (Events)**: Sunt entități planificate cu dată, locație și stoc de bilete.
- **Filtrare**: Interfața admin separă Evenimentele Active, Finalizate și Cererile în așteptare pentru a evita supraîncărcarea vizuală.

## Reguli de Dezvoltare
- **Limita de Linii**: Maximum 1000 de linii per fișier `.svelte`.
- **Diacritice**: Toate textele din UI trebuie să folosească diacritice corecte.
- **Timezone**: Stocăm în UTC (ISO), afișăm în `ro-RO` local.
