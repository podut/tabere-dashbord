<script lang="ts">
	let navOpen = $state(false);

	function toggleNav() {
		navOpen = !navOpen;
	}

	function closeNav() {
		navOpen = false;
	}
</script>

<header class="antet" class:nav-deschis={navOpen}>
	<a href="/">
		<img class="logo" alt="Omnifood logo" src="/img/omnifood-logo.png" />
	</a>

	<nav class="nav-principal">
		<ul class="nav-principal-lista">
			<li><a class="nav-principal-link" href="/#how" onclick={closeNav}>Cum funcționează</a></li>
			<li><a class="nav-principal-link" href="/#meals" onclick={closeNav}>Meniuri</a></li>
			<li>
				<a class="nav-principal-link" href="/#testimonials" onclick={closeNav}>Testimoniale</a>
			</li>
			<li><a class="nav-principal-link" href="/#pricing" onclick={closeNav}>Prețuri</a></li>
			<li><a class="nav-principal-link nav-cta" href="/#cta" onclick={closeNav}>Încearcă gratuit</a></li>
		</ul>
	</nav>

	<button class="btn-nav-mobil" onclick={toggleNav}>
		<ion-icon class="icon-nav-mobil" name="menu-outline"></ion-icon>
		<ion-icon class="icon-nav-mobil" name="close-outline"></ion-icon>
	</button>
</header>

<style>
	/* Stilurile sunt preluate din CSS-ul global, dar pot fi adăugate și aici dacă este necesar */
</style>
