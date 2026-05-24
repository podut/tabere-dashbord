<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import ConfirmHost from '$lib/components/ConfirmHost.svelte';
	import { showToast } from '$lib/admin/notify.svelte';
	import type {
		EventRow, Booking, Product, OrderRow, Service, Equipment,
		Partner, Gallery, WebsiteContent, Profile
	} from '$lib/types';
	import '../lib/styles/admin.css';
	import '../lib/styles/mobile-fold.css';

	// Components
	import LoginScreen from '$lib/features/admin/components/Auth/LoginScreen.svelte';
	import StatsGrid from '$lib/features/admin/components/Dashboard/StatsGrid.svelte';
	import EventsManager from '$lib/features/admin/components/Events/EventsManager.svelte';
	import ShopManager from '$lib/features/admin/components/Shop/ShopManager.svelte';
	import OrdersManager from '$lib/features/admin/components/Orders/OrdersManager.svelte';
	import EquipmentManager from '$lib/features/admin/components/Equipment/EquipmentManager.svelte';
	import UsersManager from '$lib/features/admin/components/Users/UsersManager.svelte';
	import SiteContentManager from '$lib/features/admin/components/SiteContent/SiteContentManager.svelte';
	import NotificationsPanel from '$lib/features/admin/components/NotificationsPanel.svelte';
	import ServicesManager from '$lib/features/admin/components/ServicesManager.svelte';
	import GalleryManager from '$lib/features/admin/components/GalleryManager.svelte';

	let authenticated = $state(false);
	let email = $state('');
	let password = $state('');
	let eroareLogin = $state('');
	let user = $state<any>(null);

	let evenimente = $state<EventRow[]>([]);
	let produse = $state<Product[]>([]);
	let rezervari = $state<Booking[]>([]);
	let utilizatori = $state<Profile[]>([]);
	let utilTotal = $state(0);
	let notificationsPanelRef = $state<any>(null);
	let servicii = $state<Service[]>([]);
	let galerie = $state<Gallery[]>([]);
	let parteneri = $state<Partner[]>([]);
	let continutSite = $state<WebsiteContent[]>([]);
	let comenzi = $state<OrderRow[]>([]);
	let echipament = $state<Equipment[]>([]);
	let venituri = $state(0);

	let incarcare = $state(false);
	let sectiuneActiva = $state('evenimente');

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		eroareLogin = '';
		incarcare = true;
		try {
			const { data, error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) eroareLogin = error.message;
			else {
				user = data.user;
				authenticated = true;
				await incarcaDate();
			}
		} catch (err) {
			eroareLogin = 'Eroare la autentificare.';
		} finally {
			incarcare = false;
		}
	}

	async function handleLogout() {
		await supabase.auth.signOut();
		authenticated = false;
		user = null;
	}

	async function incarcaDate() {
		incarcare = true;
		try {
			const [ev, prod, rez, serv, gal, cmd, eq, pt, site] = await Promise.all([
				supabase.from('events').select('*').order('date', { ascending: false }),
				supabase.from('products').select('*').order('created_at', { ascending: false }),
				supabase.from('bookings').select('*').order('created_at', { ascending: false }),
				supabase.from('services').select('*').order('order', { ascending: true }),
				supabase.from('gallery').select('*').order('order', { ascending: true }),
				supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
				supabase.from('equipment').select('*').order('order', { ascending: true }),
				supabase.from('partners').select('*').order('order', { ascending: true }),
				supabase.from('website_content').select('*')
			]);

			evenimente = ev.data || [];
			
			// Auto-finalize passed events
			const acum = new Date();
			const evDeFinalizat = evenimente.filter(e => e.status === 'active' && new Date(e.date) < acum);
			if (evDeFinalizat.length > 0) {
				await Promise.all(evDeFinalizat.map(e => 
					supabase.from('events').update({ status: 'finished', active: false }).eq('id', e.id)
				));
				// Reload events after update
				const { data } = await supabase.from('events').select('*').order('date', { ascending: false });
				evenimente = data || [];
			}

			produse = prod.data || [];
			rezervari = rez.data || [];
			servicii = serv.data || [];
			galerie = gal.data || [];
			comenzi = cmd.data || [];
			echipament = eq.data || [];
			parteneri = pt.data || [];
			continutSite = (site.data as WebsiteContent[]) || [];
			
			const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
			utilTotal = count || 0;

			venituri = comenzi.filter(c => c.status === 'finalizat').reduce((acc, curr) => acc + Number(curr.total_price), 0);
		} catch (err) {
			console.error('Error loading data:', err);
		} finally {
			incarcare = false;
		}
	}

	// Granular refreshers passed to components
	const refreshEvents = async () => { 
		const { data } = await supabase.from('events').select('*').order('date', { ascending: false }); 
		let evs = data || [];
		const acum = new Date();
		const evDeFinalizat = evs.filter(e => e.status === 'active' && new Date(e.date) < acum);
		if (evDeFinalizat.length > 0) {
			await Promise.all(evDeFinalizat.map(e => 
				supabase.from('events').update({ status: 'finished', active: false }).eq('id', e.id)
			));
			const { data: data2 } = await supabase.from('events').select('*').order('date', { ascending: false });
			evs = data2 || [];
		}
		evenimente = evs; 
	};
	const refreshProducts = async () => { const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false }); produse = data || []; };
	const refreshBookings = async () => { const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }); rezervari = data || []; };
	const refreshOrders = async () => { const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }); comenzi = data || []; };
	const refreshEquipment = async () => { const { data } = await supabase.from('equipment').select('*').order('order', { ascending: true }); echipament = data || []; };
	const refreshServices = async () => { const { data } = await supabase.from('services').select('*').order('order', { ascending: true }); servicii = data || []; };
	const refreshPartners = async () => { const { data } = await supabase.from('partners').select('*').order('order', { ascending: true }); parteneri = data || []; };
	const refreshGallery = async () => { const { data } = await supabase.from('gallery').select('*').order('order', { ascending: true }); galerie = data || []; };
	const refreshSite = async () => { const { data } = await supabase.from('website_content').select('*'); continutSite = (data as WebsiteContent[]) || []; };

	onMount(async () => {
		const { data: { session } } = await supabase.auth.getSession();
		if (session) { user = session.user; authenticated = true; await incarcaDate(); }
		supabase.auth.onAuthStateChange((_event, session) => {
			if (session) { user = session.user; authenticated = true; }
			else { user = null; authenticated = false; }
		});
	});
</script>

<svelte:head>
	<title>HTCMX Airsoft — Admin Panel</title>
	<meta name="description" content="Panou de administrare HTCMX Airsoft. Gestionează evenimentele, misiunile și magazinul platformei." />
	
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content="HTCMX Airsoft Admin" />
	<meta property="og:description" content="Gestionare tactică a evenimentelor și resurselor HTCMX Airsoft." />
	<meta property="og:image" content="/img/htcmx-logo.jpg" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:title" content="HTCMX Airsoft Admin" />
	<meta property="twitter:description" content="Gestionare tactică a evenimentelor și resurselor HTCMX Airsoft." />
	<meta property="twitter:image" content="/img/htcmx-logo.jpg" />
</svelte:head>

<div class="admin-wrapper">
	{#if !authenticated}
		<LoginScreen bind:authenticated {handleLogin} bind:email bind:password bind:eroareLogin bind:incarcare />
	{:else}
		<header class="admin-header">
			<div class="header-continut">
				<div class="brand-side">
					<span class="logo-text">HTCMX AIRSOFT</span>
					<span class="badge-admin">ADMIN</span>
				</div>
				<div class="user-side">
					<span class="user-email">{user?.email}</span>
					<button onclick={handleLogout} class="buton-iesire">Ieșire</button>
				</div>
			</div>
		</header>

		<div class="desktop-only-stats">
			<StatsGrid 
				{venituri} 
				comenziNoi={comenzi.filter(c => c.status === 'nou').length} 
				{utilTotal} 
				evenimenteDeFinalizat={evenimente.filter(e => e.status === 'active' && new Date(e.date) < new Date()).length} 
			/>
		</div>

		<div class="layout-continut">
			<aside class="sidebar">
				<nav>
					<button class:activ={sectiuneActiva === 'evenimente'} onclick={() => sectiuneActiva = 'evenimente'}>📅 Evenimente</button>
					<button class:activ={sectiuneActiva === 'echipament'} onclick={() => sectiuneActiva = 'echipament'}>🔫 Echipament</button>
					<button class:activ={sectiuneActiva === 'produse'} onclick={() => sectiuneActiva = 'produse'}>🛒 Produse</button>
					<button class:activ={sectiuneActiva === 'comenzi'} onclick={() => sectiuneActiva = 'comenzi'}>📦 Comenzi</button>
					<button class:activ={sectiuneActiva === 'utilizatori'} onclick={() => sectiuneActiva = 'utilizatori'}>👥 Utilizatori</button>
					<button class:activ={sectiuneActiva === 'servicii'} onclick={() => sectiuneActiva = 'servicii'}>🛠️ Servicii</button>
					<button class:activ={sectiuneActiva === 'galerie'} onclick={() => sectiuneActiva = 'galerie'}>🖼️ Galerie</button>
					<button class:activ={sectiuneActiva === 'notificari'} onclick={() => sectiuneActiva = 'notificari'}>📢 Notificări</button>
					<button class:activ={sectiuneActiva === 'site'} onclick={() => sectiuneActiva = 'site'}>🌐 Conținut Site</button>
				</nav>
			</aside>

			<main class="zona-lucru">
				{#if incarcare && evenimente.length === 0}
					<div class="incarcare">Se încarcă datele...</div>
				{:else}
					{#if sectiuneActiva === 'dashboard'}
						<div class="mobile-only-stats">
							<StatsGrid 
								{venituri} 
								comenziNoi={comenzi.filter(c => c.status === 'nou').length} 
								{utilTotal} 
								evenimenteDeFinalizat={evenimente.filter(e => e.status === 'active' && new Date(e.date) < new Date()).length} 
							/>
						</div>
					{:else if sectiuneActiva === 'evenimente'}
						<EventsManager bind:evenimente bind:rezervari {servicii} {refreshEvents} {refreshBookings} />
					{:else if sectiuneActiva === 'echipament'}
						<EquipmentManager bind:echipament {refreshEquipment} />
					{:else if sectiuneActiva === 'produse'}
						<ShopManager bind:produse {refreshProducts} />
					{:else if sectiuneActiva === 'comenzi'}
						<OrdersManager bind:comenzi {refreshOrders} />
					{:else if sectiuneActiva === 'utilizatori'}
						<UsersManager bind:utilTotal />
					{:else if sectiuneActiva === 'servicii'}
						<ServicesManager bind:servicii bind:parteneri {refreshServices} {refreshPartners} />
					{:else if sectiuneActiva === 'galerie'}
						<GalleryManager bind:galerie {refreshGallery} />
					{:else if sectiuneActiva === 'notificari'}
						<NotificationsPanel bind:this={notificationsPanelRef} {evenimente} {supabase} />
					{:else if sectiuneActiva === 'site'}
						<SiteContentManager bind:continutSite {refreshSite} />
					{/if}
				{/if}
			</main>
		</div>

		<!-- Mobile Bottom Nav -->
		<nav class="mobile-nav" style="display:none;">
			<button class:activ={sectiuneActiva === 'dashboard'} onclick={() => sectiuneActiva = 'dashboard'}>
				<span>📊</span><small>Stats</small>
			</button>
			<button class:activ={sectiuneActiva === 'evenimente'} onclick={() => sectiuneActiva = 'evenimente'}>
				<span>📅</span><small>Evenim.</small>
			</button>
			<button class:activ={sectiuneActiva === 'comenzi'} onclick={() => sectiuneActiva = 'comenzi'}>
				<span>📦</span><small>Comenzi</small>
			</button>
			<button class:activ={sectiuneActiva === 'notificari'} onclick={() => sectiuneActiva = 'notificari'}>
				<span>📢</span><small>Notif.</small>
			</button>
			<button class:activ={sectiuneActiva === 'site'} onclick={() => sectiuneActiva = 'site'}>
				<span>🌐</span><small>Site</small>
			</button>
			<button onclick={handleLogout}>
				<span>🚪</span><small>Ieșire</small>
			</button>
		</nav>
	{/if}
</div>

<ToastHost />
<ConfirmHost />

<style>
	.admin-wrapper { min-height: 100vh; background: var(--bg-dark); display: flex; flex-direction: column; }
	.layout-continut { display: flex; flex: 1; gap: 2.4rem; padding: 0 3.2rem 3.2rem; max-width: 130rem; margin: 0 auto; width: 100%; }
	.sidebar { width: 24rem; flex-shrink: 0; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); height: fit-content; padding: 1.2rem; position: sticky; top: 2rem; }
	.sidebar nav { display: flex; flex-direction: column; gap: 0.6rem; }
	.sidebar button { 
		display: flex; align-items: center; gap: 1.2rem; padding: 1.2rem 1.6rem; border-radius: 10px;
		border: none; background: transparent; color: var(--text-grey); font-size: 1.45rem; font-weight: 500;
		cursor: pointer; transition: all 0.2s; text-align: left;
	}
	.sidebar button:hover { background: var(--bg-hover); color: var(--primary); }
	.sidebar button.activ { background: var(--primary); color: var(--bg-dark); font-weight: 700; box-shadow: 0 4px 15px rgba(197, 160, 48, 0.25); }
	.zona-lucru { flex: 1; min-width: 0; }
	.incarcare { display: flex; align-items: center; justify-content: center; height: 40rem; font-size: 1.6rem; color: var(--text-grey); }

	.desktop-only-stats { display: block; padding: 0 3.2rem; max-width: 130rem; margin: 2rem auto 0; width: 100%; }
	.mobile-only-stats { display: none; }

	@media (max-width: 600px) {
		.desktop-only-stats { display: none !important; }
		.mobile-only-stats { display: block; }
	}
</style>
