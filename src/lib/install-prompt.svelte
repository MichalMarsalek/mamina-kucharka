<script lang="ts">
	import { onMount } from 'svelte';

	let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
	let showIosHint = $state(false);
	let dismissed = $state(false);

	// BeforeInstallPromptEvent is not in standard TS types
	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	function isIos() {
		return /iphone|ipad|ipod/i.test(navigator.userAgent);
	}

	function isInStandaloneMode() {
		return (
			'standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true
		);
	}

	onMount(() => {
		if (isInStandaloneMode()) return; // Already installed

		const stored = sessionStorage.getItem('pwa-install-dismissed');
		if (stored) return;

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
		sessionStorage.setItem('pwa-install-dismissed', '1');
	}

	let visible = $derived(!dismissed && (deferredPrompt !== null || showIosHint));
</script>

{#if visible}
	<div class="install-banner" role="banner">
		<div class="install-content">
			<span class="install-icon">🍳</span>
			<div class="install-text">
				<strong>Přidat na plochu</strong>
				{#if showIosHint}
					<span>Klepněte na <strong>Sdílet</strong> a pak <strong>Přidat na plochu</strong>.</span>
				{:else}
					<span>Nainstalujte aplikaci pro rychlejší přístup.</span>
				{/if}
			</div>
		</div>
		<div class="install-actions">
			{#if !showIosHint}
				<button class="btn-install" onclick={install}>Nainstalovat</button>
			{/if}
			<button class="btn-dismiss" onclick={dismiss} aria-label="Zavřít">✕</button>
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
