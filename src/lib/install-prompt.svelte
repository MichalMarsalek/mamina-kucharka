<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
	let showIosHint = $state(false);
	let dismissed = $state(false);
	let standalone = $state(false);
	let isMobile = $state(false);
	let installed = $state(false);

	// BeforeInstallPromptEvent is not in standard TS types
	interface BeforeInstallPromptEvent extends Event {
		prompt(): Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
	}

	const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
	const INSTALLED_KEY = 'pwa-installed';

	function isIos() {
		return /iphone|ipad|ipod/i.test(navigator.userAgent);
	}

	function isInStandaloneMode() {
		return (
			('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true) ||
			window.matchMedia('(display-mode: standalone)').matches ||
			window.matchMedia('(display-mode: fullscreen)').matches ||
			window.matchMedia('(display-mode: minimal-ui)').matches ||
			window.matchMedia('(display-mode: window-controls-overlay)').matches ||
			document.referrer.startsWith('android-app://')
		);
	}

	function isMobileDevice() {
		const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
		const smallViewport = window.matchMedia('(max-width: 768px)').matches;
		return hasCoarsePointer && smallViewport;
	}

	onMount(() => {
		const installedStored = localStorage.getItem(INSTALLED_KEY);
		if (installedStored === '1') installed = true;

		standalone = isInStandaloneMode();
		if (standalone) {
			installed = true;
			localStorage.setItem(INSTALLED_KEY, '1');
			return;
		}

		isMobile = isMobileDevice();

		const displayModeStandalone = window.matchMedia('(display-mode: standalone)');
		const displayModeFullscreen = window.matchMedia('(display-mode: fullscreen)');
		const displayModeMinimalUi = window.matchMedia('(display-mode: minimal-ui)');
		const displayModeOverlay = window.matchMedia('(display-mode: window-controls-overlay)');

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
			showIosHint = !installed;
			return;
		}

		const handler = (e: Event) => {
			e.preventDefault();
			deferredPrompt = e as BeforeInstallPromptEvent;
		};

		const onDisplayModeChange = () => {
			standalone = isInStandaloneMode();
			if (standalone) {
				installed = true;
				localStorage.setItem(INSTALLED_KEY, '1');
			}
		};

		const onAppInstalled = () => {
			installed = true;
			localStorage.setItem(INSTALLED_KEY, '1');
		};

		const detectRelatedInstalledApps = async () => {
			const nav = navigator as Navigator & {
				getInstalledRelatedApps?: () => Promise<Array<unknown>>;
			};
			if (typeof nav.getInstalledRelatedApps !== 'function') return;
			try {
				const apps = await nav.getInstalledRelatedApps();
				if (apps.length > 0) {
					installed = true;
					localStorage.setItem(INSTALLED_KEY, '1');
				}
			} catch {
				// Ignore unsupported/blocked related apps checks.
			}
		};

		window.addEventListener('beforeinstallprompt', handler);
		window.addEventListener('appinstalled', onAppInstalled);
		displayModeStandalone.addEventListener('change', onDisplayModeChange);
		displayModeFullscreen.addEventListener('change', onDisplayModeChange);
		displayModeMinimalUi.addEventListener('change', onDisplayModeChange);
		displayModeOverlay.addEventListener('change', onDisplayModeChange);
		void detectRelatedInstalledApps();
		return () => {
			window.removeEventListener('beforeinstallprompt', handler);
			window.removeEventListener('appinstalled', onAppInstalled);
			displayModeStandalone.removeEventListener('change', onDisplayModeChange);
			displayModeFullscreen.removeEventListener('change', onDisplayModeChange);
			displayModeMinimalUi.removeEventListener('change', onDisplayModeChange);
			displayModeOverlay.removeEventListener('change', onDisplayModeChange);
		};
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
	let isOElektronickeVerziPage = $derived(
		/^\/[\w-]+\/o-elektronické-verzi$/i.test(page.url.pathname)
	);
	let alwaysShow = $derived(
		isMobile && (isCoverPage || isOElektronickeVerziPage) && deferredPrompt !== null
	);
	let showGenericHint = $derived(
		isMobile &&
			(isCoverPage || isOElektronickeVerziPage) &&
			!installed &&
			!showIosHint &&
			deferredPrompt === null &&
			!dismissed
	);
	let visible = $derived(
		!standalone &&
			!installed &&
			((deferredPrompt !== null && (alwaysShow || !dismissed)) || showIosHint || showGenericHint)
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
		background: var(--bs-body-bg, #fff);
		color: var(--bs-body-color, #212529);
		border: 1px solid var(--bs-border-color, #dee2e6);
		border-radius: 0.75rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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
