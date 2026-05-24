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
import type { 
	EventRow, Booking, Product, OrderRow, Service, Equipment, 
	Partner, Gallery, WebsiteContent 
} from '$lib/types';

class AdminState {
	// Auth
	user = $state<User | null>(null);
	authenticated = $state(false);

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
			this.user = session.user;
			this.authenticated = true;
			await this.refreshAll();
		}

		supabase.auth.onAuthStateChange((_event, session) => {
			if (session) {
				this.user = session.user;
				this.authenticated = true;
			} else {
				this.user = null;
				this.authenticated = false;
			}
		});
	}

	async refreshAll() {
		this.incarcare = true;
		try {
			await EventRepository.autoFinalizeEvents();
			
			const [ev, prod, rez, serv, gal, cmd, eq, pt, site, users] = await Promise.all([
				EventRepository.getEvents(),
				ProductRepository.getProducts(),
				BookingRepository.getBookings(),
				ServiceRepository.getServices(),
				GalleryRepository.getGallery(),
				OrderRepository.getOrders(),
				EquipmentRepository.getEquipment(),
				PartnerRepository.getPartners(),
				ContentRepository.getContent(),
				UserRepository.getUsers(1, 1) // Doar pentru count
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
