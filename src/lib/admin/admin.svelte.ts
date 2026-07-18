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
import type { 
	EventRow, Booking, Product, OrderRow, Service, Equipment, 
	Partner, Gallery, WebsiteContent, NotificationRow
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
		const { data: { session } } = await supabase.auth.getSession();
		if (session) {
			await this.verifyAdminAndLoad(session.user);
		}

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

	private startRealtimeSync() {
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
			await EventRepository.autoFinalizeEvents();
			
			const [ev, prod, rez, serv, gal, cmd, eq, pt, site, users, notifData] = await Promise.all([
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
				NotificationRepository.getNotifications(1, 100, 'all')
			]);

			this.evenimente = ev;
			this.produse = prod;
			this.rezervari = rez;
			this.servicii = serv;
			this.galerie = gal;
			this.comenzi = cmd;
			this.echipament = eq;
			this.parteneri = pt;
			this.continutSite = site;
			this.utilTotal = users.total;
			this.notificari = notifData.data;
			this.notifUnread = notifData.data.filter((n: any) => !n.is_read).length;

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
}

export const adminState = new AdminState();
