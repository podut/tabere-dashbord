<script lang="ts">
	let { venituri = 0, comenziNoi = 0, utilTotal = 0, evenimenteDeFinalizat = 0 } = $props();
</script>

<section class="performanta-sectiune">
    <div class="stats-wrapper">
        <h3 class="sectiune-label">Performanță Sistem</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <span class="valoare">{venituri.toLocaleString()} RON</span>
                <span class="eticheta">Venituri Shop</span>
            </div>
            <div class="stat-card">
                <span class="valoare">{comenziNoi}</span>
                <span class="eticheta">Comenzi Noi</span>
            </div>
            <div class="stat-card">
                <span class="valoare">{utilTotal}</span>
                <span class="eticheta">Utilizatori</span>
            </div>
            <div class="stat-card">
                <span class="valoare">{evenimenteDeFinalizat}</span>
                <span class="eticheta">De Finalizat</span>
            </div>
        </div>
    </div>
</section>

<style>
    .performanta-sectiune { margin-bottom: 3rem; }
    .stats-wrapper { background: white; padding: 2.4rem; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
    .sectiune-label { font-size: 1.4rem; color: #888; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 2rem; }
    .stat-card { display: flex; flex-direction: column; gap: 0.5rem; padding: 1.5rem; border-radius: 12px; background: #f9f9f9; }
    .valoare { font-size: 2.4rem; font-weight: 800; color: var(--dark); }
    .eticheta { font-size: 1.2rem; color: #777; font-weight: 600; }
</style>
