<script lang="ts">
	import Cropper from 'svelte-easy-crop';
	import { getCroppedImg } from '$lib/utils/image';

	let { cropImage, saving, onFinish, onCancel }: {
		cropImage: string;
		saving: boolean;
		onFinish: (blob: Blob) => void;
		onCancel: () => void;
	} = $props();

	let crop = $state({ x: 0, y: 0 });
	let zoom = $state(1);
	let croppedAreaPixels = $state<any>(null);
	let processing = $state(false);

	async function handleFinalizare() {
		if (!croppedAreaPixels) return;
		processing = true;
		try {
			const blob = await getCroppedImg(cropImage, croppedAreaPixels);
			if (!blob) throw new Error('Eroare la procesare imagine.');
			onFinish(blob);
		} finally {
			processing = false;
		}
	}
</script>

<div class="modal-overlay modal-overlay--crop" role="dialog" aria-modal="true" aria-label="Decupează imaginea">
	<div class="login-card modal-crop">
		<h2>Decupează Imaginea</h2>
		<div class="zona-crop">
			<Cropper
				image={cropImage}
				bind:crop
				bind:zoom
				aspect={16 / 9}
				oncropcomplete={({ pixels }) => (croppedAreaPixels = pixels)}
			/>
		</div>
		<div class="butoane-modal">
			<button class="buton-iesire" onclick={onCancel}>Anulează</button>
			<button
				class="buton-primar"
				onclick={handleFinalizare}
				disabled={saving || processing || !croppedAreaPixels}
			>
				{processing || saving ? 'Se salvează...' : 'Finalizează'}
			</button>
		</div>
	</div>
</div>

<style>
	.modal-overlay--crop { z-index: 2000; }
	.modal-crop { max-width: 90rem; height: 90vh; display: flex; flex-direction: column; }
	.modal-crop h2 { margin-bottom: 1.6rem; }
	.zona-crop { flex: 1; position: relative; background: #222; border-radius: 12px; overflow: hidden; margin-bottom: 2rem; }
	.butoane-modal { display: flex; gap: 1rem; }
	.butoane-modal .buton-iesire { flex: 1; }
	.butoane-modal .buton-primar { flex: 2; }
</style>
