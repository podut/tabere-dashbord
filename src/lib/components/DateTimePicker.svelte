<script lang="ts">
	let {
		value = $bindable(''),
		placeholder = 'Selectează data și ora...',
		label = ''
	}: { value: string; placeholder?: string; label?: string } = $props();

	let open = $state(false);

	const MONTHS = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
	const DAYS_SHORT = ['Lu','Ma','Mi','Jo','Vi','Sâ','Du'];

	function parseValue(): Date {
		if (!value) return new Date();
		const d = new Date(value);
		return isNaN(d.getTime()) ? new Date() : d;
	}

	let sel = $state(parseValue());
	let hh  = $state(sel.getHours());
	let mm  = $state(sel.getMinutes());
	let viewYear  = $state(sel.getFullYear());
	let viewMonth = $state(sel.getMonth());

	$effect(() => {
		if (value) {
			const d = new Date(value);
			if (!isNaN(d.getTime())) {
				sel = d; hh = d.getHours(); mm = d.getMinutes();
				viewYear = d.getFullYear(); viewMonth = d.getMonth();
			}
		}
	});

	function pad(n: number) { return String(n).padStart(2, '0'); }

	function emit(d: Date, h: number, min: number) {
		value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(h)}:${pad(min)}`;
	}

	const calDays = $derived.by(() => {
		const first = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
		const offset = (first + 6) % 7; // Monday-first
		const inMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
		const inPrev  = new Date(viewYear, viewMonth, 0).getDate();
		const days: { d: number; m: number; y: number; cur: boolean }[] = [];
		for (let i = offset - 1; i >= 0; i--)
			days.push({ d: inPrev - i, m: viewMonth - 1, y: viewYear, cur: false });
		for (let d = 1; d <= inMonth; d++)
			days.push({ d, m: viewMonth, y: viewYear, cur: true });
		while (days.length < 42)
			days.push({ d: days.length - offset - inMonth + 1, m: viewMonth + 1, y: viewYear, cur: false });
		return days;
	});

	function isToday(d: number, m: number, y: number) {
		const t = new Date(); return d===t.getDate() && m===t.getMonth() && y===t.getFullYear();
	}
	function isSel(d: number, m: number, y: number) {
		// normalize month overflow when comparing
		const actual = new Date(y, m, d);
		return actual.getDate()===sel.getDate() && actual.getMonth()===sel.getMonth() && actual.getFullYear()===sel.getFullYear();
	}

	function pickDay(d: number, m: number, y: number) {
		const actual = new Date(y, m, d, hh, mm);
		sel = actual; viewYear = actual.getFullYear(); viewMonth = actual.getMonth();
		emit(actual, hh, mm);
	}

	function prevMonth() {
		if (viewMonth === 0) { viewMonth = 11; viewYear--; } else viewMonth--;
	}
	function nextMonth() {
		if (viewMonth === 11) { viewMonth = 0; viewYear++; } else viewMonth++;
	}

	function changeHH(delta: number) {
		hh = (hh + delta + 24) % 24;
		emit(sel, hh, mm);
	}
	function changeMM(delta: number) {
		mm = (mm + delta + 60) % 60;
		emit(sel, hh, mm);
	}
	function inputHH(e: Event) {
		hh = Math.max(0, Math.min(23, +(e.target as HTMLInputElement).value || 0));
		emit(sel, hh, mm);
	}
	function inputMM(e: Event) {
		mm = Math.max(0, Math.min(59, +(e.target as HTMLInputElement).value || 0));
		emit(sel, hh, mm);
	}

	function preset(offsetMs: number) {
		const d = new Date(Date.now() + offsetMs);
		sel = d; hh = d.getHours(); mm = d.getMinutes();
		viewYear = d.getFullYear(); viewMonth = d.getMonth();
		emit(d, hh, mm);
	}
	function presetTomorrow() {
		const d = new Date(); d.setDate(d.getDate()+1); d.setHours(9,0,0,0);
		sel = d; hh = 9; mm = 0; viewYear = d.getFullYear(); viewMonth = d.getMonth();
		emit(d, 9, 0);
	}

	const display = $derived(
		value
			? `${pad(sel.getDate())}.${pad(sel.getMonth()+1)}.${sel.getFullYear()}  ${pad(hh)}:${pad(mm)}`
			: ''
	);

	function outside(e: MouseEvent) {
		if (!(e.target as HTMLElement).closest('.dtp-root')) open = false;
	}
</script>

<svelte:window onclick={outside} />

<div class="dtp-root">
	{#if label}<label class="dtp-label">{label}</label>{/if}

	<button type="button" class="dtp-trigger" onclick={() => open = !open} class:dtp-open={open}>
		<svg class="dtp-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
		</svg>
		<span class="dtp-display">{display || placeholder}</span>
		<svg class="dtp-caret" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="6 9 12 15 18 9"/>
		</svg>
	</button>

	{#if open}
		<div class="dtp-panel">
			<!-- Month nav -->
			<div class="dtp-month-nav">
				<button type="button" class="dtp-nav-btn" onclick={prevMonth} aria-label="Luna anterioară">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
				</button>
				<span class="dtp-month-label">{MONTHS[viewMonth]} {viewYear}</span>
				<button type="button" class="dtp-nav-btn" onclick={nextMonth} aria-label="Luna următoare">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
				</button>
			</div>

			<!-- Day headers -->
			<div class="dtp-grid">
				{#each DAYS_SHORT as d}<div class="dtp-dow">{d}</div>{/each}

				{#each calDays as { d, m, y, cur }}
					<button
						type="button"
						class="dtp-day"
						class:dtp-day--other={!cur}
						class:dtp-day--today={isToday(d, m, y)}
						class:dtp-day--sel={isSel(d, m, y)}
						onclick={() => pickDay(d, m, y)}
					>{d}</button>
				{/each}
			</div>

			<!-- Divider -->
			<div class="dtp-divider"></div>

			<!-- Time picker -->
			<div class="dtp-time-row">
				<div class="dtp-time-spinner">
					<button type="button" class="dtp-spin-btn" onclick={() => changeHH(1)}>▲</button>
					<input class="dtp-time-input" type="number" min="0" max="23" value={hh} oninput={inputHH} />
					<button type="button" class="dtp-spin-btn" onclick={() => changeHH(-1)}>▼</button>
				</div>
				<span class="dtp-time-sep">:</span>
				<div class="dtp-time-spinner">
					<button type="button" class="dtp-spin-btn" onclick={() => changeMM(5)}>▲</button>
					<input class="dtp-time-input" type="number" min="0" max="59" value={mm} oninput={inputMM} />
					<button type="button" class="dtp-spin-btn" onclick={() => changeMM(-5)}>▼</button>
				</div>
			</div>

			<!-- Presets -->
			<div class="dtp-presets">
				<button type="button" class="dtp-preset" onclick={() => preset(0)}>Acum</button>
				<button type="button" class="dtp-preset" onclick={() => preset(30 * 60000)}>+30 min</button>
				<button type="button" class="dtp-preset" onclick={() => preset(60 * 60000)}>+1 oră</button>
				<button type="button" class="dtp-preset" onclick={presetTomorrow}>Mâine 09:00</button>
			</div>

			<!-- Close -->
			<button type="button" class="dtp-apply" onclick={() => open = false}>Confirmă</button>
		</div>
	{/if}
</div>

<style>
	.dtp-root { position: relative; width: 100%; }
	.dtp-label { display: block; margin-bottom: 0.6rem; font-size: 1.3rem; color: var(--text-grey); font-weight: 600; }

	/* ── Trigger ── */
	.dtp-trigger {
		width: 100%; display: flex; align-items: center; gap: 1rem;
		padding: 1.2rem 1.6rem; border-radius: 10px;
		border: 1px solid var(--border); background: var(--bg-dark);
		color: var(--text); font-size: 1.45rem; cursor: pointer;
		transition: border-color 0.2s, box-shadow 0.2s; text-align: left;
	}
	.dtp-trigger:hover, .dtp-trigger.dtp-open {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(197,160,48,0.12);
	}
	.dtp-icon { color: var(--primary); flex-shrink: 0; }
	.dtp-display { flex: 1; font-family: 'Courier New', monospace; font-weight: 600; letter-spacing: 0.04em; }
	.dtp-caret { color: var(--text-grey); flex-shrink: 0; transition: transform 0.2s; }
	.dtp-open .dtp-caret { transform: rotate(180deg); }

	/* ── Panel ── */
	.dtp-panel {
		position: absolute; top: calc(100% + 8px); left: 0; z-index: 500;
		background: var(--bg-card); border: 1px solid var(--border);
		border-radius: 16px; padding: 2rem;
		box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(197,160,48,0.08);
		min-width: 30rem; width: 100%;
		animation: dtpIn 0.15s ease-out;
	}
	@keyframes dtpIn {
		from { opacity: 0; transform: translateY(-6px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	/* ── Month nav ── */
	.dtp-month-nav {
		display: flex; align-items: center; justify-content: space-between;
		margin-bottom: 1.6rem;
	}
	.dtp-nav-btn {
		width: 3.2rem; height: 3.2rem; border-radius: 8px;
		border: 1px solid var(--border); background: var(--bg-dark);
		color: var(--text-grey); cursor: pointer; display: flex; align-items: center; justify-content: center;
		transition: all 0.15s;
	}
	.dtp-nav-btn:hover { border-color: var(--primary); color: var(--primary); background: rgba(197,160,48,0.08); }
	.dtp-month-label { font-size: 1.5rem; font-weight: 800; color: var(--primary); letter-spacing: 0.03em; }

	/* ── Calendar grid ── */
	.dtp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.3rem; }
	.dtp-dow {
		text-align: center; font-size: 1.1rem; font-weight: 700; color: var(--text-grey);
		text-transform: uppercase; letter-spacing: 0.06em; padding: 0.5rem 0 1rem;
	}
	.dtp-day {
		aspect-ratio: 1; border-radius: 8px; border: 1px solid transparent;
		background: transparent; color: var(--text); font-size: 1.3rem; font-weight: 600;
		cursor: pointer; transition: all 0.12s; display: flex; align-items: center; justify-content: center;
	}
	.dtp-day:hover:not(.dtp-day--sel) { background: rgba(197,160,48,0.1); border-color: rgba(197,160,48,0.25); color: var(--primary); }
	.dtp-day--other { color: rgba(138,154,122,0.35); }
	.dtp-day--today:not(.dtp-day--sel) {
		border-color: rgba(197,160,48,0.4); color: var(--primary);
		background: rgba(197,160,48,0.06);
	}
	.dtp-day--sel {
		background: var(--primary); color: #0A1A0A; border-color: var(--primary);
		font-weight: 800; box-shadow: 0 4px 14px rgba(197,160,48,0.35);
	}

	/* ── Divider ── */
	.dtp-divider { height: 1px; background: var(--border); margin: 1.8rem 0; }

	/* ── Time ── */
	.dtp-time-row {
		display: flex; align-items: center; justify-content: center; gap: 1.2rem; margin-bottom: 1.8rem;
	}
	.dtp-time-spinner { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
	.dtp-spin-btn {
		width: 3.2rem; height: 2.4rem; border-radius: 6px;
		border: 1px solid var(--border); background: var(--bg-dark);
		color: var(--text-grey); font-size: 1rem; cursor: pointer; transition: all 0.12s;
		display: flex; align-items: center; justify-content: center;
	}
	.dtp-spin-btn:hover { border-color: var(--primary); color: var(--primary); }
	.dtp-time-input {
		width: 5.6rem; text-align: center; font-size: 2.2rem; font-weight: 800;
		color: var(--primary); background: var(--bg-dark);
		border: 1px solid var(--border); border-radius: 10px; padding: 0.8rem 0;
		font-family: 'Courier New', monospace;
		-moz-appearance: textfield;
	}
	.dtp-time-input::-webkit-outer-spin-button,
	.dtp-time-input::-webkit-inner-spin-button { -webkit-appearance: none; }
	.dtp-time-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(197,160,48,0.12); }
	.dtp-time-sep { font-size: 2.4rem; font-weight: 900; color: var(--primary); line-height: 1; margin-bottom: 0.4rem; }

	/* ── Presets ── */
	.dtp-presets { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 1.8rem; }
	.dtp-preset {
		flex: 1; min-width: fit-content; padding: 0.7rem 1.2rem;
		border-radius: 8px; border: 1px solid var(--border);
		background: var(--bg-dark); color: var(--text-grey);
		font-size: 1.25rem; font-weight: 600; cursor: pointer; transition: all 0.12s;
		white-space: nowrap;
	}
	.dtp-preset:hover { border-color: var(--primary); color: var(--primary); background: rgba(197,160,48,0.06); }

	/* ── Apply ── */
	.dtp-apply {
		width: 100%; padding: 1.2rem; border-radius: 10px;
		background: var(--primary); color: #0A1A0A;
		border: none; font-size: 1.4rem; font-weight: 800;
		cursor: pointer; letter-spacing: 0.04em; transition: opacity 0.15s;
	}
	.dtp-apply:hover { opacity: 0.88; }
</style>
