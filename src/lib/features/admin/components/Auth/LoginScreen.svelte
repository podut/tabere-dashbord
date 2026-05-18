<script lang="ts">
	let { authenticated = $bindable(false), handleLogin, email = $bindable(''), password = $bindable(''), eroareLogin = $bindable(''), incarcare = $bindable(false) }: {
        authenticated: boolean,
        handleLogin: (e: SubmitEvent) => Promise<void>,
        email: string,
        password: string,
        eroareLogin: string,
        incarcare: boolean
    } = $props();
</script>

<div class="ecran-login">
    <div class="login-card">
        <div class="brand">
            <h1 class="login-titlu">HTCMX Airsoft</h1>
            <p class="login-subtitlu">Panou Administrare</p>
        </div>
        <form onsubmit={handleLogin}>
            <div class="camp">
                <label for="email">Email</label>
                <input id="email" type="email" bind:value={email} required placeholder="admin@htcmx.ro" />
            </div>
            <div class="camp">
                <label for="password">Parolă</label>
                <input id="password" type="password" bind:value={password} required placeholder="••••••••" />
            </div>
            {#if eroareLogin}<p class="eroare-mesaj">{eroareLogin}</p>{/if}
            <button type="submit" class="buton-primar" disabled={incarcare}>
                {incarcare ? 'Se verifică...' : 'Intră în Panou'}
            </button>
        </form>
    </div>
</div>

<style>
    .ecran-login { 
        min-height: 100vh; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        background: var(--bg);
        padding: 2rem;
    }
    .login-card {
        background: white;
        padding: 4rem;
        border-radius: 20px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        width: 100%;
        max-width: 42rem;
    }
    .brand { text-align: center; margin-bottom: 3rem; }
    .login-titlu { font-size: 2.8rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem; }
    .login-subtitlu { font-size: 1.4rem; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
    .eroare-mesaj { color: var(--danger); background: #fdecea; padding: 1rem; border-radius: 8px; font-size: 1.3rem; margin-bottom: 1.5rem; text-align: center; font-weight: 600; }
</style>
