import { supabase } from '$lib/supabase';
import type { Product, Insert, Update } from '$lib/types';

export class ProductRepository {
	static async getProducts() {
		const { data, error } = await supabase
			.from('products')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) throw error;
		return data || [];
	}

	static async saveProduct(product: Insert<'products'> | Update<'products'>) {
		const isUpdate = 'id' in product && product.id;
		
		const { data, error } = isUpdate
			? await supabase.from('products').update(product as any).eq('id', product.id).select().single()
			: await supabase.from('products').insert([product as any]).select().single();

		if (error) throw error;
		return data;
	}

	static async deleteProduct(id: string) {
		const { error } = await supabase.from('products').delete().eq('id', id);
		if (error) throw error;
	}
}
