<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { adminState } from '$lib/admin/admin.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import ConfirmHost from '$lib/components/ConfirmHost.svelte';
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

	let email = $state('');
	let password = $state('');
	let eroareLogin = $state('');
	let mobileMenuOpen = $state(false);

	function setSectiune(s: string) {
		adminState.sectiuneActiva = s;
		localStorage.setItem('admin_sectiune', s);
	}

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		eroareLogin = '';
		adminState.incarcare = true;
		try {
			const { data, error } = await supabase.auth.signInWithPassword({ email, password });
			if (error) {
				eroareLogin = error.message;
			} else if (data.user) {
				await adminState.verifyAdminAndLoad(data.user);
				if (adminState.accessDenied) {
					eroareLogin = 'Acest cont nu are drepturi de administrator.';
				}
			}
		} catch (err) {
			eroareLogin = 'Eroare la autentificare.';
		} finally {
			adminState.incarcare = false;
		}
	}

	async function handleLogout() {
		await supabase.auth.signOut();
	}

	onMount(() => {
		const saved = localStorage.getItem('admin_sectiune');
		if (saved) adminState.sectiuneActiva = saved;
		adminState.init();
	});
</script>

<svelte:head>
	<title>HTCMX Airsoft — Admin Panel</title>
</svelte:head>

<div class="admin-wrapper">
	{#if !adminState.authenticated}
		<LoginScreen 
			bind:authenticated={adminState.authenticated} 
			{handleLogin} 
			bind:email 
			bind:password 
			bind:eroareLogin 
			bind:incarcare={adminState.incarcare} 
		/>
	{:else}
		<header class="admin-header">
			<div class="header-continut">
				<div class="brand-side">
					<span class="logo-text">HTCMX AIRSOFT</span>
					<span class="badge-admin">ADMIN</span>
				</div>
				<div class="user-side">
					<span class="user-email">{adminState.user?.email}</span>
					<button onclick={handleLogout} class="buton-iesire">Ieșire</button>
				</div>
			</div>
		</header>

		<div class="desktop-only-stats">
			<StatsGrid 
				venituri={adminState.venituri} 
				comenziNoi={adminState.comenziNoi} 
				utilTotal={adminState.utilTotal} 
				evenimenteDeFinalizat={adminState.evenimenteDeFinalizat} 
			/>
		</div>
	
		<div class="layout-continut">
			<aside class="sidebar">
				<nav>
					<button class:activ={adminState.sectiuneActiva === 'evenimente'} onclick={() => setSectiune('evenimente')}><span class="nav-icon">📅</span><span class="nav-label">Evenimente</span></button>
					<button class:activ={adminState.sectiuneActiva === 'echipament'} onclick={() => setSectiune('echipament')}><span class="nav-icon">🔫</span><span class="nav-label">Echipament</span></button>
					<button class:activ={adminState.sectiuneActiva === 'produse'} onclick={() => setSectiune('produse')}><span class="nav-icon">🛒</span><span class="nav-label">Produse</span></button>
					<button class:activ={adminState.sectiuneActiva === 'comenzi'} onclick={() => setSectiune('comenzi')}><span class="nav-icon">📦</span><span class="nav-label">Comenzi</span></button>
					<button class:activ={adminState.sectiuneActiva === 'utilizatori'} onclick={() => setSectiune('utilizatori')}><span class="nav-icon">👥</span><span class="nav-label">Utilizatori</span></button>
					<button class:activ={adminState.sectiuneActiva === 'servicii'} onclick={() => setSectiune('servicii')}><span class="nav-icon">🛠️</span><span class="nav-label">Servicii</span></button>
					<button class:activ={adminState.sectiuneActiva === 'galerie'} onclick={() => setSectiune('galerie')}><span class="nav-icon">🖼️</span><span class="nav-label">Galerie</span></button>
					<button class:activ={adminState.sectiuneActiva === 'notificari'} onclick={() => setSectiune('notificari')}><span class="nav-icon">📢</span><span class="nav-label">Notificări</span></button>
					<button class:activ={adminState.sectiuneActiva === 'site'} onclick={() => setSectiune('site')}><span class="nav-icon">🌐</span><span class="nav-label">Conținut Site</span></button>
				</nav>
			</aside>

			<main class="zona-lucru">
				{#if adminState.incarcare && adminState.evenimente.length === 0}
					<div class="incarcare">Se încarcă datele...</div>
				{:else}
					{#if adminState.sectiuneActiva === 'dashboard'}
						<div class="mobile-only-stats">
							<StatsGrid 
								venituri={adminState.venituri} 
								comenziNoi={adminState.comenziNoi} 
								utilTotal={adminState.utilTotal} 
								evenimenteDeFinalizat={adminState.evenimenteDeFinalizat} 
							/>
						</div>
					{:else if adminState.sectiuneActiva === 'evenimente'}
						<EventsManager 
							bind:evenimente={adminState.evenimente} 
							bind:rezervari={adminState.rezervari} 
							servicii={adminState.servicii} 
							refreshEvents={() => adminState.refreshEvents()} 
							refreshBookings={() => adminState.refreshBookings()} 
						/>
					{:else if adminState.sectiuneActiva === 'echipament'}
						<EquipmentManager bind:echipament={adminState.echipament} refreshEquipment={() => adminState.refreshAll()} />
					{:else if adminState.sectiuneActiva === 'produse'}
						<ShopManager bind:produse={adminState.produse} refreshProducts={() => adminState.refreshAll()} />
					{:else if adminState.sectiuneActiva === 'comenzi'}
						<OrdersManager bind:comenzi={adminState.comenzi} refreshOrders={() => adminState.refreshAll()} />
					{:else if adminState.sectiuneActiva === 'utilizatori'}
						<UsersManager bind:utilTotal={adminState.utilTotal} />
					{:else if adminState.sectiuneActiva === 'servicii'}
						<ServicesManager bind:servicii={adminState.servicii} bind:parteneri={adminState.parteneri} refreshServices={() => adminState.refreshAll()} refreshPartners={() => adminState.refreshAll()} />
					{:else if adminState.sectiuneActiva === 'galerie'}
						<GalleryManager bind:galerie={adminState.galerie} refreshGallery={() => adminState.refreshAll()} />
					{:else if adminState.sectiuneActiva === 'notificari'}
						<NotificationsPanel evenimente={adminState.evenimente} />
					{:else if adminState.sectiuneActiva === 'site'}
						<SiteContentManager bind:continutSite={adminState.continutSite} refreshSite={() => adminState.refreshAll()} />
					{/if}
				{/if}
			</main>
		</div>

		<!-- Mobile Drawer Menu -->
		{#if mobileMenuOpen}
			<div class="mobile-drawer-overlay" onclick={() => mobileMenuOpen = false} role="presentation">
				<div class="mobile-drawer" onclick={(e) => e.stopPropagation()} role="dialog">
					<div class="drawer-header">
						<h2>Meniu Administrare</h2>
						<button class="btn-icon" onclick={() => mobileMenuOpen = false}>×</button>
					</div>
					<nav class="drawer-nav">
						{#each [
							{ id: 'evenimente', label: '📅 Evenimente' },
							{ id: 'echipament', label: '🔫 Echipament' },
							{ id: 'produse', label: '🛒 Produse' },
							{ id: 'comenzi', label: '📦 Comenzi' },
							{ id: 'utilizatori', label: '👥 Utilizatori' },
							{ id: 'servicii', label: '🛠️ Servicii' },
							{ id: 'galerie', label: '🖼️ Galerie' },
							{ id: 'notificari', label: '📢 Notificări' },
							{ id: 'site', label: '🌐 Conținut Site' },
						] as r}
							<button class:activ={adminState.sectiuneActiva === r.id} onclick={() => { setSectiune(r.id); mobileMenuOpen = false; }}>{r.label}</button>
						{/each}
					</nav>
				</div>
			</div>
		{/if}

		<!-- Mobile Bottom Nav -->
		<nav class="mobile-nav">
			<button class:activ={adminState.sectiuneActiva === 'dashboard'} onclick={() => setSectiune('dashboard')}>
				<span>📊</span><small>Stats</small>
			</button>
			<button class:activ={adminState.sectiuneActiva === 'evenimente'} onclick={() => setSectiune('evenimente')}>
				<span>📅</span><small>Evenim.</small>
			</button>
			<button class:activ={adminState.sectiuneActiva === 'comenzi'} onclick={() => setSectiune('comenzi')}>
				<span>📦</span><small>Comenzi</small>
			</button>
			<button onclick={() => mobileMenuOpen = true}>
				<span>🍔</span><small>Meniu</small>
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
