/**
 * Face escape caracterelor speciale folosite de operatorii ILIKE din Supabase (%) 
 * pentru a preveni căutări neașteptate.
 */
export function sanitizeSearch(query: string): string {
	return query.replace(/[%_]/g, '\\$&');
}
