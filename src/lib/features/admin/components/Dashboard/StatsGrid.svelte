<script lang="ts">
	let { venituri = 0, comenziNoi = 0, utilTotal = 0, evenimenteDeFinalizat = 0 } = $props();
</script>

<div class="dashboard-home">
    <div class="welcome-header">
        <h1>Control Panel</h1>
        <p>Prezentare generală a activității HTCMX Airsoft</p>
    </div>

    <section class="performanta-sectiune">
        <h3 class="sectiune-label">Indicatori Performanță</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <span class="icon">💰</span>
                <div class="stat-info">
                    <span class="valoare">{venituri.toLocaleString()} RON</span>
                    <span class="eticheta">Venituri Shop</span>
                </div>
            </div>
            <div class="stat-card">
                <span class="icon">📦</span>
                <div class="stat-info">
                    <span class="valoare">{comenziNoi}</span>
                    <span class="eticheta">Comenzi Noi</span>
                </div>
            </div>
            <div class="stat-card">
                <span class="icon">👥</span>
                <div class="stat-info">
                    <span class="valoare">{utilTotal}</span>
                    <span class="eticheta">Utilizatori</span>
                </div>
            </div>
            <div class="stat-card">
                <span class="icon">🎯</span>
                <div class="stat-info">
                    <span class="valoare">{evenimenteDeFinalizat}</span>
                    <span class="eticheta">De Finalizat</span>
                </div>
            </div>
        </div>
    </section>

    <div class="quick-actions">
        <h3 class="sectiune-label">Acțiuni Rapide</h3>
        <div class="actions-grid">
            <div class="action-item">
                <span class="action-icon">🔔</span>
                <p>Trimite Notificare</p>
            </div>
            <div class="action-item">
                <span class="action-icon">⚔️</span>
                <p>Meci Nou</p>
            </div>
            <div class="action-item">
                <span class="action-icon">🔧</span>
                <p>Status Service</p>
            </div>
        </div>
    </div>
</div>

<style>
    .dashboard-home { animation: fadeIn 0.3s ease-out; }
    
    .welcome-header { margin-bottom: 3.2rem; }
    .welcome-header h1 { font-size: 3.2rem; color: var(--text); font-weight: 900; letter-spacing: -1px; margin: 0; }
    .welcome-header p { color: var(--text-grey); font-size: 1.6rem; margin-top: 0.4rem; font-weight: 500; }

    .performanta-sectiune { margin-bottom: 4rem; }
    .sectiune-label { font-size: 1.3rem; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2rem; opacity: 0.8; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(24rem, 1fr)); gap: 2rem; }
    
    .stat-card { 
        display: flex; align-items: center; gap: 2rem; padding: 2.4rem; border-radius: 20px; 
        background: var(--bg-card); border: 1px solid var(--border);
        box-shadow: 0 10px 25px rgba(0,0,0,0.2); transition: all 0.2s;
    }
    .stat-card:hover { transform: translateY(-4px); border-color: var(--primary); }
    
    .icon { font-size: 3.6rem; background: var(--bg-dark); width: 6.4rem; height: 6.4rem; display: flex; align-items: center; justify-content: center; border-radius: 14px; border: 1px solid var(--border); }
    
    .stat-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .valoare { font-size: 2.6rem; font-weight: 800; color: var(--text); line-height: 1; }
    .eticheta { font-size: 1.2rem; color: var(--text-grey); font-weight: 700; text-transform: uppercase; }

    .quick-actions { background: rgba(197, 160, 48, 0.05); padding: 2.4rem; border-radius: 20px; border: 1px solid rgba(197, 160, 48, 0.1); }
    .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 1.6rem; }
    
    .action-item { 
        background: var(--bg-card); padding: 2rem; border-radius: 16px; border: 1px solid var(--border); 
        text-align: center; cursor: pointer; transition: all 0.2s;
    }
    .action-item:hover { border-color: var(--primary); background: var(--primary-tint); }
    .action-icon { font-size: 2.8rem; display: block; margin-bottom: 0.8rem; }
    .action-item p { margin: 0; font-weight: 700; font-size: 1.4rem; color: var(--text); }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 600px) {
        .welcome-header h1 { font-size: 2.6rem; }
        .stats-grid { grid-template-columns: 1fr; }
        .stat-card { padding: 1.8rem; }
        .icon { width: 5.2rem; height: 5.2rem; font-size: 2.8rem; }
        .valoare { font-size: 2.2rem; }
    }
</style>
