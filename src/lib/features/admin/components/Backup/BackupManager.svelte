<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { showToast } from '$lib/admin/notify.svelte';

	let loading = $state(false);
	let lastBackup = $state<{ name: string; kb: number; at: string } | null>(null);

	function stamp(d: Date) {
		const p = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
	}

	async function descarcaBackup() {
		if (loading) return;
		loading = true;
		try {
			const { data, error } = await supabase.rpc('admin_backup_dump');
			if (error) throw error;
			const dump = data as unknown as string;
			if (typeof dump !== 'string' || dump.length === 0) throw new Error('Backup gol');

			const now = new Date();
			const name = `htcmx-backup-${stamp(now)}.sql`;
			const blob = new Blob([dump], { type: 'application/sql;charset=utf-8' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = name;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 10_000);

			lastBackup = { name, kb: Math.round(blob.size / 1024), at: now.toLocaleString('ro-RO') };
			showToast('success', 'Backup descărcat');
		} catch (e: any) {
			console.error('Backup eșuat', e);
			showToast('error', `Backup eșuat: ${e?.message ?? 'eroare necunoscută'}`);
		} finally {
			loading = false;
		}
	}
</script>

<div class="backup-manager">
	<p class="subtitle-text">
		Descarcă o copie completă a bazei de date (schema + toate datele) ca fișier <code>.sql</code>, pe calculatorul tău.
	</p>

	<div class="backup-card">
		<div class="backup-card-head">
			<h3 class="backup-title">Backup bază de date</h3>
			<p class="backup-desc">
				Include tabelele, tipurile, cheile și constrângerile, indexurile, funcțiile, politicile RLS, triggerele
				și conținutul tuturor tabelelor din schema <code>public</code>.
			</p>
		</div>

		<button class="btn-backup" onclick={descarcaBackup} disabled={loading}>
			{loading ? 'Se generează…' : '💾 Descarcă backup acum'}
		</button>

		{#if lastBackup}
			<p class="backup-last">
				Ultimul backup: <strong>{lastBackup.name}</strong> · {lastBackup.kb} KB · {lastBackup.at}
			</p>
		{/if}
	</div>

	<div class="backup-note">
		<h4>Ce nu este inclus</h4>
		<ul>
			<li>Conturile utilizatorilor (schema <code>auth</code>), deci cheile externe către ele sunt comentate în fișier.</li>
			<li>Fișierele din Storage (imagini galerie, bannere); acestea se copiază separat.</li>
		</ul>
		<h4>Restaurare</h4>
		<p>
			Pe o bază goală: <code>psql "$DATABASE_URL" -f htcmx-backup-….sql</code>. Fișierul conține date personale
			(rezervări, comenzi) — păstrează-l într-un loc sigur.
		</p>
	</div>
</div>

<style>
	.subtitle-text { color: var(--text-grey); font-size: 1.4rem; margin-bottom: 2.4rem; font-weight: 500; }
	.backup-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 2.4rem; display: flex; flex-direction: column; gap: 1.6rem; align-items: flex-start; margin-bottom: 2.4rem; }
	.backup-title { font-size: 2rem; font-weight: 700; color: var(--text); margin: 0 0 0.4rem; }
	.backup-desc { font-size: 1.3rem; color: var(--text-grey); margin: 0; }
	.btn-backup { background: var(--primary); color: var(--bg-dark); border: none; border-radius: 10px; padding: 1.1rem 2.2rem; font-size: 1.5rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
	.btn-backup:hover { opacity: 0.85; }
	.btn-backup:disabled { opacity: 0.5; cursor: progress; }
	.backup-last { font-size: 1.3rem; color: var(--text-grey); margin: 0; }
	.backup-note { font-size: 1.3rem; color: var(--text-grey); }
	.backup-note h4 { color: var(--text); font-size: 1.5rem; margin: 1.2rem 0 0.6rem; }
	.backup-note ul { margin: 0; padding-left: 2rem; }
	.backup-note p { margin: 0; }
	code { background: rgba(255, 255, 255, 0.06); padding: 0.1rem 0.5rem; border-radius: 6px; font-size: 1.2rem; word-break: break-word; }
	@media (max-width: 600px) {
		.backup-card { padding: 1.6rem; }
		.btn-backup { width: 100%; }
	}
</style>
