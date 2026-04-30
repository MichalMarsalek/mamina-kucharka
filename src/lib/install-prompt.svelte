<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
	let showIosHint = $state(false);
	let dismissed = $state(false);
	let standalone = $state(false);
	let isMobile = $state(false);

	// BeforeInstallPromptEvent is not in standard TS types
	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

	function isIos() {
		return /iphone|ipad|ipod/i.test(navigator.userAgent);
	}

	function isInStandaloneMode() {
		return (
			('standalone' in navigator &&
				(navigator as { standalone?: boolean }).standalone === true) ||
			window.matchMedia('(display-mode: standalone)').matches
		);
	}

	onMount(() => {
		standalone = isInStandaloneMode();
		if (standalone) return;

		isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

		const stored = localStorage.getItem('pwa-install-dismissed');
		if (stored) {
			const ts = parseInt(stored, 10);
			if (Date.now() - ts < ONE_MONTH_MS) {
				dismissed = true;
			} else {
				localStorage.removeItem('pwa-install-dismissed');
			}
		}

		if (isIos()) {
			showIosHint = true;
			return;
		}

		const handler = (e: Event) => {
			e.preventDefault();
			deferredPrompt = e as BeforeInstallPromptEvent;
		};

		window.addEventListener('beforeinstallprompt', handler);
		return () => window.removeEventListener('beforeinstallprompt', handler);
	});

	async function install() {
		if (!deferredPrompt) return;
		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		deferredPrompt = null;
		if (outcome === 'dismissed') dismiss();
	}

	function dismiss() {
		dismissed = true;
		showIosHint = false;
		localStorage.setItem('pwa-install-dismissed', String(Date.now()));
	}

	let isCoverPage = $derived(page.url.pathname === '/');
	let alwaysShow = $derived(isMobile && isCoverPage);
	let showGenericHint = $derived(alwaysShow && !showIosHint && deferredPrompt === null);
	let visible = $derived(
		!standalone &&
			(deferredPrompt !== null || showIosHint || showGenericHint) &&
			(!dismissed || alwaysShow)
	);
</script>

{#if visible}
	<div class="install-banner" role="banner">
		<div class="install-content">
			<span class="install-icon">🍳</span>
			<div class="install-text">
				<strong>Přidat na plochu</strong>
				{#if showIosHint}
					<span>Klepněte na <strong>Sdílet</strong> a pak <strong>Přidat na plochu</strong>.</span>
				{:else if deferredPrompt}
					<span>Nainstalujte aplikaci pro rychlejší přístup.</span>
				{:else}
					<span>V menu prohlížeče vyberte <strong>Přidat na plochu</strong>.</span>
				{/if}
			</div>
		</div>
		<div class="install-actions">
			{#if deferredPrompt}
				<button class="btn-install" onclick={install}>Nainstalovat</button>
			{/if}
			{#if !alwaysShow}
				<button class="btn-dismiss" onclick={dismiss} aria-label="Zavřít">✕</button>
			{/if}
		</div>
	</div>
{/if}

<style>
	.install-banner {
		position: fixed;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 1rem;
		width: min(calc(100vw - 2rem), 480px);
		background: #fff;
		border: 1px solid #dee2e6;
		border-radius: 0.75rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}

	@media (prefers-color-scheme: dark) {
		.install-banner {
			background: #212529;
			border-color: #495057;
			color: #f8f9fa;
		}
	}

	.install-content {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.install-icon {
		font-size: 1.75rem;
		line-height: 1;
	}

	.install-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		font-size: 0.875rem;
	}

	.install-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.btn-install {
		padding: 0.4rem 0.9rem;
		border: none;
		border-radius: 0.5rem;
		background: #0d6efd;
		color: #fff;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-install:hover {
		background: #0b5ed7;
	}

	.btn-dismiss {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		color: inherit;
		opacity: 0.6;
		padding: 0.25rem;
	}

	.btn-dismiss:hover {
		opacity: 1;
	}
</style>
