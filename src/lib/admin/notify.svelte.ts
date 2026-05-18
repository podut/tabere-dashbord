// Store global reactiv pentru toast-uri si dialog de confirmare.
// Inlocuieste alert() / confirm() native din admin.

export type ToastKind = 'success' | 'error' | 'info';
export type ToastItem = { id: number; kind: ToastKind; message: string };

let nextId = 1;

class ToastStore {
	items = $state<ToastItem[]>([]);

	push(kind: ToastKind, message: string, durationMs = 3500) {
		const id = nextId++;
		this.items.push({ id, kind, message });
		setTimeout(() => this.dismiss(id), durationMs);
	}

	dismiss(id: number) {
		this.items = this.items.filter((t) => t.id !== id);
	}
}

export const toast = new ToastStore();

export const showToast = (kind: ToastKind, message: string, durationMs?: number) =>
	toast.push(kind, message, durationMs);

// ─── Confirm dialog (promise-based) ──────────────────────────────────────────

export type ConfirmRequest = {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	danger?: boolean;
};

class ConfirmStore {
	current = $state<ConfirmRequest | null>(null);
	private resolver: ((value: boolean) => void) | null = null;

	ask(req: ConfirmRequest): Promise<boolean> {
		// Daca exista deja un confirm in curs, il rezolva ca fiind "false".
		if (this.resolver) this.resolver(false);
		this.current = req;
		return new Promise<boolean>((resolve) => {
			this.resolver = resolve;
		});
	}

	answer(value: boolean) {
		this.current = null;
		const r = this.resolver;
		this.resolver = null;
		r?.(value);
	}
}

export const confirmStore = new ConfirmStore();

export const confirmDialog = (req: ConfirmRequest) => confirmStore.ask(req);
