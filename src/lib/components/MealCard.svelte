<script lang="ts">
	interface Props {
		masa: {
			image: string;
			alt: string;
			category: string;
			name: string;
			price: number;
			description: string;
			isFeatured?: boolean;
		};
	}

	let { masa }: Props = $props();

	// Mapare categorie → clasă CSS pentru eticheta colorată
	function categorieClasa(categorie: string) {
		const map: Record<string, string> = {
			vegetarian: 'eticheta--vegetarian',
			vegan: 'eticheta--vegan',
			paleo: 'eticheta--paleo',
			pescatarian: 'eticheta--pescatarian'
		};
		return map[categorie.toLowerCase()] ?? 'eticheta--vegetarian';
	}
</script>

<div class="masa">
	<div class="masa-img-container">
		<img src={masa.image} class="masa-img" alt={masa.alt} loading="lazy" />
	</div>
	<div class="masa-continut">
		<div class="masa-etichete">
			<span class="eticheta {categorieClasa(masa.category)}">{masa.category}</span>
		</div>
		<p class="masa-titlu">{masa.name}</p>
		<ul class="masa-atribute">
			<li class="masa-atribut">
				<ion-icon class="masa-icon" name="cash-outline"></ion-icon>
				<span><strong>{masa.price.toFixed(2)}</strong> lei / porție</span>
			</li>
			<li class="masa-atribut">
				<ion-icon class="masa-icon" name="restaurant-outline"></ion-icon>
				<span>{masa.description}</span>
			</li>
		</ul>
	</div>
</div>
