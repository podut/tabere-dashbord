import { supabase } from '$lib/supabase';
import type { WebsiteContent } from '$lib/types';

export class ContentRepository {
	static async getContent() {
		const { data, error } = await supabase
			.from('website_content')
			.select('*');

		if (error) throw error;
		return (data as WebsiteContent[]) || [];
	}

	static async getBySectionId(sectionId: string) {
		const { data, error } = await supabase
			.from('website_content')
			.select('*')
			.eq('section_id', sectionId)
			.maybeSingle();

		if (error) throw error;
		return data as WebsiteContent | null;
	}

	static async updateContent(id: string, content: any) {
		const { data, error } = await supabase
			.from('website_content')
			.update({ content })
			.eq('id', id)
			.select()
			.single();
		
		if (error) throw error;
		return data;
	}
}
