// Rate-limit simplu, in-memory, per IP. Se reseteaza la redeploy — suficient
// pentru traficul actual; daca abuzul devine real, migreaza pe Redis/Upstash.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
	const now = Date.now();
	const bucket = buckets.get(key);

	if (!bucket || now > bucket.resetAt) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return false;
	}

	bucket.count += 1;
	return bucket.count > limit;
}
