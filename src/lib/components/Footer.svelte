<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer class="subsol">
	<div class="container grila grila--subsol">
		<div class="coloana-logo">
			<a href="#" class="subsol-logo">
				<img class="logo" alt="Omnifood logo" src="/img/omnifood-logo.png" />
			</a>

			<ul class="linkuri-sociale">
				<li>
					<a class="subsol-link" href="#"
						><ion-icon class="icon-social" name="logo-instagram"></ion-icon></a
					>
				</li>
				<li>
					<a class="subsol-link" href="#"
						><ion-icon class="icon-social" name="logo-facebook"></ion-icon></a
					>
				</li>
				<li>
					<a class="subsol-link" href="#"
						><ion-icon class="icon-social" name="logo-twitter"></ion-icon></a
					>
				</li>
			</ul>

			<p class="drepturi-autor">
				Drepturi de autor &copy; <span class="an">{currentYear}</span> Podut Petru. Toate drepturile rezervate.
			</p>
		</div>

		<div class="coloana-adresa">
			<p class="subsol-titlu">Contactează-ne</p>
			<address class="contacte">
				<p class="adresa">Baia Mare, Maramureș, România</p>
				<p>
					<a class="subsol-link" href="mailto:podutpetru@gmail.com">podutpetru@gmail.com</a>
				</p>
			</address>
		</div>

		<nav class="coloana-nav">
			<p class="subsol-titlu">Cont</p>
			<ul class="subsol-nav">
				<li><a class="subsol-link" href="#">Creează cont</a></li>
				<li><a class="subsol-link" href="#">Conectare</a></li>
				<li><a class="subsol-link" href="#">Aplicație iOS</a></li>
				<li><a class="subsol-link" href="#">Aplicație Android</a></li>
			</ul>
		</nav>

		<nav class="coloana-nav">
			<p class="subsol-titlu">Companie</p>
			<ul class="subsol-nav">
				<li><a class="subsol-link" href="#">Despre Omnifood</a></li>
				<li><a class="subsol-link" href="#">Pentru afaceri</a></li>
				<li><a class="subsol-link" href="#">Parteneri de gătit</a></li>
				<li><a class="subsol-link" href="#">Cariere</a></li>
			</ul>
		</nav>

		<nav class="coloana-nav">
			<p class="subsol-titlu">Resurse</p>
			<ul class="subsol-nav">
				<li><a class="subsol-link" href="#">Director de rețete</a></li>
				<li><a class="subsol-link" href="#">Centru de ajutor</a></li>
				<li><a class="subsol-link" href="#">Confidențialitate și termeni</a></li>
			</ul>
		</nav>
	</div>
</footer>
