// Aliasuri scurte peste tipurile generate din Supabase.
// Pentru orice tabela, foloseste `Row<'events'>` in loc de `Database['public']['Tables']['events']['Row']`.

import type { Database } from './database';

export type Row<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Row'];

export type Insert<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Insert'];

export type Update<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Update'];

// Aliasuri concrete pentru tabelele cel mai des folosite in admin.
// Sufix "Row" pe cele care intra in coliziune cu tipuri DOM
// (Event, Notification) — evita conflicte in handler-e.
export type EventRow = Row<'events'>;
export type Booking = Row<'bookings'>;
export type Product = Row<'products'>;
export type OrderRow = Row<'orders'> & { order_items?: OrderItem[] };
export type OrderItem = Row<'order_items'>;
export type Service = Row<'services'>;
export type Equipment = Row<'equipment'>;
export type Partner = Row<'partners'>;
export type Gallery = Row<'gallery'>;
export type NotificationRow = Row<'notifications'>;
// website_content.content este JSONB - tipam ce stim ca scriem din admin.
export type WebsiteContent = Omit<Row<'website_content'>, 'content'> & {
	content: { image?: string } | null;
};
export type Profile = Row<'profiles'>;
