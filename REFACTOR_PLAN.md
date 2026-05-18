# Plan de Refactorizare Web-Admin

## Obiective
1. **Modularizare**: Niciun fișier nu trebuie să depășească 1000 de linii.
2. **Separarea Responsabilităților**: Logica de business (Supabase calls) vs. Logica de UI.
3. **Filtrare Cereri (Bookings)**: Tratarea unitară a rezervărilor și conversia lor în evenimente.
4. **Lizibilitate**: Structură clară de foldere în `src/lib/features/admin`.

## Structura Nouă a Componentelor
Vom extrage modulele din `+page.svelte` în:
- `src/lib/features/admin/components/Auth/LoginScreen.svelte`
- `src/lib/features/admin/components/Dashboard/StatsGrid.svelte`
- `src/lib/features/admin/components/Events/EventsManager.svelte` (include filtrarea "Cereri")
- `src/lib/features/admin/components/Shop/ShopManager.svelte`
- `src/lib/features/admin/components/Orders/OrdersManager.svelte`
- `src/lib/features/admin/components/Equipment/EquipmentManager.svelte`
- `src/lib/features/admin/components/Users/UsersManager.svelte`
- `src/lib/features/admin/components/SiteContent/SiteContentManager.svelte`

## Logica de Filtrare "Cereri"
Rezervările (tabela `bookings`) vor fi afișate într-un tab dedicat în cadrul Managerului de Evenimente.
- **Status Cereri**: Noile rezervări intră cu status implicit (ex: `nou`).
- **Conversie**: Buton de "🚀" care deschide modalul de creare eveniment pre-completat cu datele din cerere.
- **Integrare**: Sincronizare între `bookings` și `events` prin `origin_booking_id`.

## Etape de Implementare
1. [ ] Crearea documentației de arhitectură (`ADMIN_ARCHITECTURE.md`).
2. [ ] Extragerea Managerului de Evenimente & Cereri (Prioritate: filtrarea corectă).
3. [ ] Extragerea Managerului de Shop & Comenzi.
4. [ ] Extragerea modulelor secundare (Echipament, Parteneri, Servicii).
5. [ ] Curățarea `+page.svelte` pentru a deveni doar un orchestrator/router de stări.
