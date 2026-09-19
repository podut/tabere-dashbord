import { supabase } from '$lib/supabase';
import type { User } from '@supabase/supabase-js';
import { EventRepository } from '$lib/data/repositories/EventRepository';
import { BookingRepository } from '$lib/data/repositories/BookingRepository';
import { ProductRepository } from '$lib/data/repositories/ProductRepository';
import { OrderRepository } from '$lib/data/repositories/OrderRepository';
import { EquipmentRepository } from '$lib/data/repositories/EquipmentRepository';
import { ServiceRepository } from '$lib/data/repositories/ServiceRepository';
import { PartnerRepository } from '$lib/data/repositories/PartnerRepository';
import { GalleryRepository } from '$lib/data/repositories/GalleryRepository';
import { ContentRepository } from '$lib/data/repositories/ContentRepository';
import { UserRepository } from '$lib/data/repositories/UserRepository';
import { NotificationRepository } from '$lib/data/repositories/NotificationRepository';
import { PostRepository } from '$lib/data/repositories/PostRepository';
import type { 
	EventRow, Booking, Product, OrderRow, Service, Equipment, 
	Partner, Gallery, WebsiteContent, NotificationRow, Post
} from '$lib/types';

class AdminState {
	// Auth
	user = $state<User | null>(null);
	authenticated = $state(false);
	accessDenied = $state(false);

	// Data
	evenimente = $state<EventRow[]>([]);
	rezervari = $state<Booking[]>([]);
	produse = $state<Product[]>([]);
	comenzi = $state<OrderRow[]>([]);
	utilTotal = $state(0);
	servicii = $state<Service[]>([]);
	galerie = $state<Gallery[]>([]);
	parteneri = $state<Partner[]>([]);
	continutSite = $state<WebsiteContent[]>([]);
	echipament = $state<Equipment[]>([]);
	articole = $state<Post[]>([]);
	notificari = $state<NotificationRow[]>([]);
	notifUnread = $state(0);
	
	incarcare = $state(false);
	sectiuneActiva = $state('evenimente');

	// Derivate
	venituri = $derived(
		this.comenzi
			.filter(c => c.status === 'finalizat')
			.reduce((acc, curr) => acc + Number(curr.total_price), 0)
	);

	comenziNoi = $derived(this.comenzi.filter(c => c.status === 'nou').length);
	cereriNoi = $derived(this.rezervari.filter(r => r.status === 'nou' || !r.status).length);
	evenimenteDeFinalizat = $derived(
		this.evenimente.filter(e => e.status === 'active' && new Date(e.date) < new Date()).length
	);

	async init() {
		// onAuthStateChange emite si starea initiala a sesiunii la inregistrare
		// (INITIAL_SESSION), deci nu mai verificam separat cu getSession() —
		// asta dubla apelul lui verifyAdminAndLoad() la incarcarea paginii si
		// facea startRealtimeSync() sa se aboneze de doua ori pe acelasi canal.
		supabase.auth.onAuthStateChange((_event, session) => {
			if (session) {
				this.verifyAdminAndLoad(session.user);
			} else {
				this.user = null;
				this.authenticated = false;
			}
		});
	}

	/**
	 * O sesiune Supabase valida nu inseamna admin — orice client din Android
	 * poate avea cont. Verificam explicit rolul inainte sa aratam panoul si
	 * inainte sa incarcam vreo date (bookings/orders/profiles contin PII).
	 */
	async verifyAdminAndLoad(user: User) {
		const { data: isAdmin, error } = await supabase.rpc('is_admin');
		if (error || !isAdmin) {
			this.accessDenied = true;
			this.user = null;
			this.authenticated = false;
			await supabase.auth.signOut();
			return;
		}

		this.accessDenied = false;
		this.user = user;
		this.authenticated = true;
		await this.refreshAll();
		this.startRealtimeSync();
	}

	private realtimeStarted = false;
	private startRealtimeSync() {
		// verifyAdminAndLoad ruleaza la fiecare eveniment de auth cu sesiune activa
		// (SIGNED_IN, TOKEN_REFRESHED, ...), nu doar o data — fara aceasta garda,
		// a doua oara .on() arunca "cannot add postgres_changes callbacks after subscribe()".
		if (this.realtimeStarted) return;
		this.realtimeStarted = true;

		supabase
			.channel('public:notifications')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'notifications' },
				() => {
					this.notifUnread++; // Simple live badge update
				}
			)
			.subscribe();
	}

	async refreshAll() {
		this.incarcare = true;
		try {
			await EventRepository.autoFinalizeEvents().catch(() => {});
			
			const results = await Promise.allSettled([
				EventRepository.getEvents(),
				ProductRepository.getProducts(),
				BookingRepository.getBookings(),
				ServiceRepository.getServices(),
				GalleryRepository.getGallery(),
				OrderRepository.getOrders(),
				EquipmentRepository.getEquipment(),
				PartnerRepository.getPartners(),
				ContentRepository.getContent(),
				UserRepository.getUsers(1, 1),
				NotificationRepository.getNotifications(1, 100, 'all'),
				PostRepository.getPosts(true)
			]);

			if (results[0].status === 'fulfilled') this.evenimente = results[0].value;
			if (results[1].status === 'fulfilled') this.produse = results[1].value;
			if (results[2].status === 'fulfilled') this.rezervari = results[2].value;
			if (results[3].status === 'fulfilled') this.servicii = results[3].value;
			if (results[4].status === 'fulfilled') this.galerie = results[4].value;
			if (results[5].status === 'fulfilled') this.comenzi = results[5].value;
			if (results[6].status === 'fulfilled') this.echipament = results[6].value;
			if (results[7].status === 'fulfilled') this.parteneri = results[7].value;
			if (results[8].status === 'fulfilled') this.continutSite = results[8].value;
			if (results[9].status === 'fulfilled') this.utilTotal = results[9].value?.total || 0;
			if (results[10].status === 'fulfilled') {
				const notif = results[10].value;
				this.notificari = notif?.data || [];
				this.notifUnread = (notif?.data || []).filter((n: any) => !n.is_read).length;
			}
			if (results[11].status === 'fulfilled') this.articole = results[11].value;

		} catch (err) {
			console.error('Error refreshing admin data:', err);
		} finally {
			this.incarcare = false;
		}
	}

	async refreshEvents() {
		await EventRepository.autoFinalizeEvents();
		this.evenimente = await EventRepository.getEvents();
	}

	async refreshBookings() {
		this.rezervari = await BookingRepository.getBookings();
	}

	async refreshPosts() {
		this.articole = await PostRepository.getPosts(true);
	}
}

export const adminState = new AdminState();
