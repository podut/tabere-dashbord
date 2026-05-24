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
    
    /* Pe desktop, StatsGrid este global si vizibil. Pe mobile, este sectiune in main. */
    .stats-wrapper { background: var(--bg-card); padding: 2.4rem; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
    .sectiune-label { font-size: 1.4rem; color: var(--text-grey); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2rem; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 2rem; }
    
    .stat-card { display: flex; flex-direction: column; gap: 0.5rem; padding: 1.8rem; border-radius: 12px; background: var(--primary-tint); border: 1px solid var(--border); transition: all 0.2s; }
    .stat-card:hover { transform: translateY(-3px); border-color: var(--primary); background: var(--primary-tint2); }
    
    .valoare { font-size: 2.6rem; font-weight: 800; color: var(--primary); }
    .eticheta { font-size: 1.2rem; color: var(--text-grey); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

    @media (max-width: 600px) {
        .performanta-sectiune { margin-bottom: 0; }
        .stats-wrapper { border: none; box-shadow: none; padding: 1rem; background: transparent; }
        .stats-grid { grid-template-columns: 1fr; gap: 1.2rem; }
    }
</style>
