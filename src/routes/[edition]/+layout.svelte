<script lang="ts">
	import { browser } from '$app/environment';
	import {
		Button,
		Col,
		Container,
		Input,
		Nav,
		NavItem,
		NavLink,
		Row,
		Styles
	} from '@sveltestrap/sveltestrap';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { isRecipe, type Content, type Page } from '$lib/content';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import PhotoTooltip from '$lib/photo-tooltip.svelte';

	interface Props {
		data: Content;
		children?: Snippet;
	}

	let { data, children }: Props = $props();

	let edition = $state($page.params.edition);
	$effect(() => {
		if (browser && edition) localStorage.setItem('edition', edition);
		const currentPath = $page.url.pathname;
		const newPath = currentPath.replace(`/${$page.params.edition}/`, `/${edition}/`);
		if (currentPath !== newPath) {
			goto(newPath, { replaceState: true });
		}
	});

	let theme = $state(
		((browser ? localStorage.getItem('theme') : null) ?? 'auto') as 'light' | 'dark' | 'auto'
	);
	$effect(() => {
		if (browser) localStorage.setItem('theme', theme);
	});

	let pages = $derived(data.pages);
	let recipes = $derived(pages.filter(isRecipe));
	let pageName = $derived($page.params?.name);
	let pageId = $derived($page.route.id);
	let randomRecipe = $derived.by(() => {
		const candidates = recipes.filter((x) => x.slug !== pageName);
		if (candidates.length > 0) {
			return candidates[Math.floor(Math.random() * candidates.length)].slug;
		}
		return recipes[0]?.slug ?? 'Obsah';
	});
	let currentPageOrder = $derived(pages.findIndex((x) => x.slug === pageName));
	let prevPage = $derived(
		pages[currentPageOrder >= 0 ? (currentPageOrder + pages.length - 1) % pages.length : 0].slug
	);
	let nextPage = $derived(
		pages[currentPageOrder >= 0 ? (currentPageOrder + 1) % pages.length : 0].slug
	);

	function swipe(direction: -1 | 1) {
		goto(`${direction === -1 ? prevPage : nextPage}`, { noScroll: true });
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
			swipe(e.key === 'ArrowLeft' ? -1 : 1);
			e.preventDefault();
		}
	}

	function level(page: Page): number {
		return page.parent == null ? 0 : 1 + level(page.parent);
	}

	function previewUrl(page: Page): string | undefined {
		const recipe = isRecipe(page) ? page : recipes.find((r) => r.slug === page.slug);
		return recipe && recipe.photos.length > 0 ? `/foto1/${recipe.photos[0][1]}.webp` : undefined;
	}

	// Reading progress bar
	let scrollY = $state(0);
	let scrollProgress = $state(0);
	$effect(() => {
		void scrollY;
		const el = document.documentElement;
		const scrollable = el.scrollHeight - el.clientHeight;
		scrollProgress = scrollable > 0 ? (scrollY / scrollable) * 100 : 0;
	});

	// Scroll to top
	let showScrollTop = $derived(scrollY > 300);

	// Cover-to-logo transition
	let logoElement = $state<HTMLImageElement | null>(null);
	let showLogoLaunch = $state(false);
	let logoLaunchStyle = $state('');
	let hideContentForMorph = $state(false);
	let hideRealLogoForMorph = $state(false);
	let launchActive = $state(false);

	onMount(() => {
		const pending = sessionStorage.getItem('coverMorphPending');
		if (!pending) {
			return;
		}
		sessionStorage.removeItem('coverMorphPending');

		const age = Date.now() - Number(pending);
		if (age > 5000 || Number.isNaN(age)) {
			return;
		}

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return;
		}

		hideContentForMorph = true;
		hideRealLogoForMorph = true;
		launchActive = false;

		requestAnimationFrame(() => {
			if (!logoElement) {
				hideContentForMorph = false;
				hideRealLogoForMorph = false;
				return;
			}
			const rect = logoElement.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const fromTranslateX = window.innerWidth / 2 - centerX;
			const fromTranslateY = window.innerHeight / 2 - centerY;
			const fromScale = Math.max(
				1.8,
				Math.min(3.2, Math.min(window.innerWidth, window.innerHeight) / 220)
			);
			logoLaunchStyle = `--launch-x:${rect.left}px; --launch-y:${rect.top}px; --launch-size:${rect.width}px; --from-tx:${fromTranslateX}px; --from-ty:${fromTranslateY}px; --from-scale:${fromScale};`;
			showLogoLaunch = true;

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					launchActive = true;
				});
			});

			window.setTimeout(() => {
				hideContentForMorph = false;
			}, 270);
			window.setTimeout(() => {
				showLogoLaunch = false;
				hideRealLogoForMorph = false;
			}, 1500);
		});
	});
</script>

<Styles {theme} />

<!-- Reading progress bar -->
<div class="progress-bar-wrap">
	<div class="progress-bar-fill" style:width="{scrollProgress}%"></div>
</div>

{#if showLogoLaunch}
	<div
		class="logo-launch-overlay"
		class:active={launchActive}
		style={logoLaunchStyle}
		aria-hidden="true"
	>
		<div class="logo-launch-frame">
			<div class="logo-launch-cover"></div>
		</div>
	</div>
{/if}

<div>
	<Container fluid>
		<Row>
			<Col sm="auto">
				<div class="menu">
					<div class="snap-page-start">
						<Row>
							<Col class="d-flex justify-content-center mt-3">
								<a href="/" class="logo-link">
									<img
										src="/foto/Logo.webp"
										bind:this={logoElement}
										class="rounded-circle logo-img"
										class:morphing={hideRealLogoForMorph}
										style="width: 150px;"
										alt="Logo"
									/>
								</a>
							</Col>
						</Row>
					</div>
					<hr />
					<Input
						type="select"
						bind:value={theme}
						class="mb-2 d-sm-block {pageId?.endsWith('/Obsah') ? '' : 'd-none'}"
					>
						<option value="light">Světlý motiv</option>
						<option value="dark">Tmavý motiv</option>
						<option value="auto">Automatický motiv</option>
					</Input>
					<!-- <Input type="select" bind:value={edition} class="mb-2 d-none d-sm-block">
						{#each Object.entries(editions) as [key, label]}
							<option value={key}>{label}</option>
						{/each}
					</Input> -->
					<div class="d-flex w-100 gap-1 snap-nav-row">
						<a href={prevPage}><Button class="nav-btn">❮</Button></a>
						<a href={randomRecipe} class="flex-grow-1"
							><Button class="w-100 nav-btn"
								>Náhodný <span class="d-none d-sm-inline">recept</span></Button
							></a
						>
						<a href="Obsah" class="flex-grow-1 d-sm-none"
							><Button class="w-100 nav-btn">Obsah</Button></a
						>
						<a href={nextPage}><Button class="nav-btn">❯</Button></a>
					</div>
					{#if !(pageId ?? '').endsWith('/Obsah')}
						<hr />
						<div class="content-items d-none d-sm-block">
							<Row>
								<Col>
									<Nav class="flex-column">
										<NavItem
											><NavLink href="Obsah"
												><div class:active={pageId?.endsWith('Obsah')} style="margin-left: 0px">
													Obsah
												</div></NavLink
											></NavItem
										>
										{#each pages as item (item.slug)}
											<NavItem
												><PhotoTooltip
													photoUrl={previewUrl(item)}
													side="right"
													alignSelector=".page-content"
													><NavLink href={item.slug}
														><div
															class:active={pageName === item.slug}
															style="margin-left: {level(item) * 15}px; margin-top: {level(item) *
																-5}px"
														>
															{item.title}
														</div></NavLink
													></PhotoTooltip
												></NavItem
											>
										{/each}
									</Nav>
								</Col>
							</Row>
						</div>
					{/if}
				</div>
			</Col>
			<Col>
				<div class="mt-2 page-content snap-content-start" class:hidden={hideContentForMorph}>
					{@render children?.()}
				</div>
			</Col>
		</Row>
	</Container>
</div>

{#if showScrollTop}
	<button class="scroll-top-btn" onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
		↑
	</button>
{/if}
<svelte:window {onkeydown} bind:scrollY />

<style>
	/* Reading progress bar */
	.progress-bar-wrap {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		z-index: 1000;
		background: transparent;
	}

	.progress-bar-fill {
		height: 100%;
		background: linear-gradient(
			90deg,
			var(--bs-primary, #0d6efd),
			color-mix(in srgb, var(--bs-primary, #0d6efd) 60%, #6ea8fe)
		);
		transition: width 0.1s linear;
		border-radius: 0 2px 2px 0;
	}

	/* Cover to logo transition */
	.logo-launch-overlay {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 2200;
	}

	.logo-launch-frame {
		position: fixed;
		left: var(--launch-x);
		top: var(--launch-y);
		width: var(--launch-size);
		height: var(--launch-size);
		overflow: hidden;
		border-radius: 50%;
		box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
		transform-origin: center center;
		transform: translate(var(--from-tx), var(--from-ty)) scale(var(--from-scale));
		transition:
			transform 1500ms cubic-bezier(0.2, 0.82, 0.22, 1),
			box-shadow 1500ms ease-out;
		will-change: transform;
		contain: paint;
	}

	.logo-launch-overlay.active .logo-launch-frame {
		transform: translate(0, 0) scale(1);
		box-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
	}

	.logo-launch-cover {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.logo-launch-cover {
		background-image: url('/foto/Logo.webp');
		background-position: center;
		background-repeat: no-repeat;
		background-size: cover;
		filter: saturate(0.95) contrast(1.02);
	}

	/* Logo */
	.logo-link {
		display: block;
	}

	.logo-img {
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
	}

	.logo-img.morphing {
		visibility: hidden;
	}

	.logo-link:hover .logo-img:not(.morphing) {
		transform: scale(1.06) rotate(2deg);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
	}

	/* Nav buttons */
	.page-content {
		opacity: 1;
		transition: opacity 660ms ease-out;
	}

	.page-content.hidden {
		opacity: 0;
	}

	.page-content :global(img) {
		transition: opacity 180ms ease-out;
	}

	:global(.nav-btn) {
		background: var(--bs-body-bg, white) !important;
		border-color: var(--bs-border-color, #dee2e6) !important;
		color: var(--bs-body-color) !important;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}

	:global(.nav-btn:hover) {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 12%, transparent) !important;
		border-color: color-mix(
			in srgb,
			var(--bs-primary, #0d6efd) 30%,
			var(--bs-border-color, #dee2e6)
		) !important;
	}

	:global(.nav-btn:active) {
		transform: scale(0.96) !important;
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 22%, transparent) !important;
	}

	:global(select.form-select) {
		cursor: pointer;
		background-color: var(--bs-body-bg, white) !important;
		border-color: var(--bs-border-color, #dee2e6) !important;
		color: var(--bs-body-color) !important;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}

	:global(select.form-select:hover) {
		background-color: color-mix(
			in srgb,
			var(--bs-primary, #0d6efd) 12%,
			var(--bs-body-bg, white)
		) !important;
		border-color: color-mix(
			in srgb,
			var(--bs-primary, #0d6efd) 30%,
			var(--bs-border-color, #dee2e6)
		) !important;
	}

	.active {
		font-weight: bold;
	}

	.content-items {
		height: calc(max(300px, 100vh - 316px));
		overflow-x: hidden;
		overflow-y: auto;
	}

	.menu {
		position: sticky;
		top: 0;
	}

	@media screen and (min-width: 576px) {
		.menu {
			width: 250px;
		}
	}

	:global(.nav-link) {
		padding: 4px 6px !important;
		color: var(--bs-body-color) !important;
		text-decoration: none !important;
		border-radius: 4px;
		transition: background-color 0.15s ease;
	}

	:global(.nav-link > div) {
		padding: 0;
	}

	:global(.nav-link:hover) {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 12%, transparent);
	}

	:global(.nav-link:has(.active)) {
		background: color-mix(in srgb, var(--bs-primary, #0d6efd) 18%, transparent);
	}

	:global(.nav-link > .active) {
		background: transparent;
	}

	:global(figcaption) {
		display: flex;
		justify-content: center;
		font-style: italic;
	}

	/* Scroll to top button */
	.scroll-top-btn {
		position: fixed;
		bottom: 24px;
		right: 24px;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: none;
		background: var(--bs-primary, #0d6efd);
		color: white;
		font-size: 1.2rem;
		cursor: pointer;
		z-index: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		transition:
			transform 0.2s ease,
			opacity 0.2s ease,
			box-shadow 0.2s ease;
		opacity: 0.85;
	}

	.scroll-top-btn:hover {
		transform: translateY(-3px);
		opacity: 1;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
	}

	.scroll-top-btn:active {
		transform: translateY(0);
	}

	@media screen and (max-width: 992px) {
		:global(html),
		:global(body) {
			scroll-snap-type: y mandatory;
			scroll-padding-top: 8px;
		}

		.snap-page-start,
		.snap-nav-row,
		.snap-content-start {
			scroll-snap-align: start;
			scroll-snap-stop: always;
		}
	}
</style>
