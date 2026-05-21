<script lang="ts">
	import { Styles } from '@sveltestrap/sveltestrap';
	import InstallPrompt from '$lib/install-prompt.svelte';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const SUPPORT_POPUP_KEY = 'support-popup-last-confirmed-at';
	const SUPPORT_POPUP_INTERVAL_MS = 45 * 24 * 60 * 60 * 1000;
	let showSupportPopup = $state(false);
	let supportConfirmed = $state(false);

	function continueToBook() {
		if (!supportConfirmed) {
			return;
		}
		localStorage.setItem(SUPPORT_POPUP_KEY, String(Date.now()));
		showSupportPopup = false;
	}

	function closePage() {
		window.close();
		if (!window.closed) {
			window.open('', '_self');
			window.close();
		}
		if (!window.closed) {
			window.location.href = 'about:blank';
		}
	}

	onMount(() => {
		const lastShownRaw = localStorage.getItem(SUPPORT_POPUP_KEY);
		const lastShown = lastShownRaw ? Number.parseInt(lastShownRaw, 10) : NaN;
		const shouldShow =
			Number.isNaN(lastShown) || Date.now() - lastShown >= SUPPORT_POPUP_INTERVAL_MS;
		if (shouldShow) {
			showSupportPopup = true;
		}
	});
</script>

<InstallPrompt />
<Styles theme="auto" />

{@render children()}

{#if showSupportPopup}
	<div class="support-popup-backdrop" role="presentation">
		<div
			class="support-popup"
			role="dialog"
			aria-modal="true"
			aria-label="Poděkování za podporu"
			tabindex="-1"
		>
			<div class="support-intro">
				<img src="/foto/Logo.webp" alt="Mámina kuchařka" class="support-logo-circle" />
				<p>
					Děkuji, že jste Máminu kuchařku podpořili na HitHitu nebo zakoupením papírové knihy. Pokud
					jste tak ještě neučinili, zvažte, prosím, koupi knihy nebo drobný příspěvek. Za vznikem
					knihy stojí spousta práce, času a lásky. Děkuji!
				</p>
			</div>

			<div class="support-options">
				<a
					href="https://bookla.cz/"
					target="_blank"
					rel="noopener noreferrer"
					class="support-option support-link"
				>
					<span>Koupit papírovou knihu</span>
					<img
						src="https://bookla.cz/assets/images/logo.svg"
						alt="Bookla logo"
						class="bookla-logo"
					/>
					<strong>Bookla</strong>
				</a>
				<div class="support-option">
					<span>Drobný příspěvek autorce na ebook</span>
					<img
						src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAcwAAAHMAQMAAABiFQrFAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAGUExURQAAAP///6XZn90AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJlSURBVHja7ZxRjoJADIbHzIMvJHMEj+LR1qPtUTgCCS8+ELuCjNMBXAlES+n/Pyk7ny1tbaaA6yb0Q3dd08u7SjdPW0YP2lAnglo61xXoQZtVGYeDiFW/HG0d9sRVtutvzh3T+mN/lKnpLWtCvYjVYAi1lFeU/4bRYnX5V+7pQL7owtHeS+e4w19GvYjVIILKhMlSSSCvG/7myITphdVbXMS2l9tAi+VoAPrh5MhY9U5ZDQdt52qphl+g1A3cp4Xd/y26wqoXsSoTpqAtOStQbyjCKIlZaCEZJqbYTI/jo0zrUCeCBm1WvYhVGbQwVBIe5f8Fh0di1xGHlxTfaR4atKFOm8OWwuRFHFaHWiqJVVbphfI94pSWo9VytBZxWAZttCVHBiVDaI280qfLP5PP2mZE48vHeH2+2+OTNtB/UVqO1trOVSZMMlZlHLaUV1E0EP32KLWLDrGZUpq9L2lh34eBzkAbEauVCKouORUijOSMHc575HDKPjzWDZppr4WoF7GqDg2GrFpKDiK86bxSUnfk1L+5DreX2UI/uELwNZS0WVWHrghTo81hmXOtDJWEury228tnj+wUB+543ZH1VZ/ZcIbQQpvDwZBVGYcLbQ4DnYnSlG7dH1kHjR/IBu56OUpAgQIFukl0Quw3K9lRSnedPFCgQIHuEvVZHy3TY9xl+hQ2ewMF+gKtDKEoie2jrNGVgye0Kf13r6bbIz4FdA5aAQUKdHcoa6bn0Z0VoECBAt0/SuN7zY+F75spUKBAgapFmYZTNntYGyhQoEB3j47E0OzpGxcH7qwBAwUKFOg+UKr+AH2k4vxrMGVGAAAAAElFTkSuQmCC"
						alt="QR kód pro příspěvek"
						class="support-qr"
					/>
				</div>
			</div>

			<label class="support-checkbox-row">
				<input type="checkbox" bind:checked={supportConfirmed} />
				<span>Máminu kuchařku jsem již podpořil</span>
			</label>

			<div class="support-actions">
				<button
					type="button"
					class="support-popup-continue"
					onclick={continueToBook}
					disabled={!supportConfirmed}
				>
					Pokračovat
				</button>
				<button type="button" class="support-popup-close" onclick={closePage}>Zavřít</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.support-popup-backdrop {
		position: fixed;
		inset: 0;
		z-index: 2400;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.4);
		-webkit-backdrop-filter: blur(8px);
		backdrop-filter: blur(8px);
	}

	.support-popup {
		width: min(676px, 100%);
		background: var(--bs-body-bg, #fff);
		color: var(--bs-body-color, #212529);
		border-radius: 12px;
		padding: 1rem;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
		border: 1px solid var(--bs-border-color, #dee2e6);
	}

	.support-popup p {
		margin: 0 0 0.9rem 0;
		line-height: 1.4;
	}

	.support-intro {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.support-logo-circle {
		width: 75px;
		height: 75px;
		border-radius: 50%;
		object-fit: cover;
		flex: 0 0 auto;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.support-options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 0.9rem;
	}

	.support-option {
		min-height: 170px;
		border: 1px solid var(--bs-border-color, #dee2e6);
		border-radius: 10px;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.support-link {
		color: inherit;
		text-decoration: none;
	}

	.support-link:hover {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 7%, transparent);
	}

	.bookla-logo {
		width: 56px;
		height: 56px;
	}

	.support-option strong {
		font-size: 1.25rem;
		font-weight: 800;
	}

	.support-qr {
		width: 100%;
		max-width: 138px;
		height: auto;
	}

	.support-checkbox-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.9rem;
	}

	.support-checkbox-row input {
		width: 18px;
		height: 18px;
	}

	.support-actions {
		display: flex;
		gap: 0.6rem;
		justify-content: flex-end;
	}

	.support-popup-continue {
		border: 1px solid var(--bs-primary, #0d6efd);
		background: var(--bs-primary, #0d6efd);
		color: #fff;
		padding: 0.45rem 0.9rem;
		border-radius: 8px;
		cursor: pointer;
	}

	.support-popup-continue:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.support-popup-close {
		border: 1px solid var(--bs-border-color, #dee2e6);
		background: var(--bs-body-bg, #fff);
		color: var(--bs-body-color, #212529);
		padding: 0.45rem 0.9rem;
		border-radius: 8px;
		cursor: pointer;
	}

	.support-popup-close:hover {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 10%, transparent);
	}

	@media screen and (max-width: 640px) {
		.support-options {
			grid-template-columns: 1fr;
		}

		.support-actions {
			justify-content: stretch;
		}

		.support-actions button {
			flex: 1;
		}
	}
</style>
