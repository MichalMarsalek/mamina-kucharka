<script lang="ts">
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
	import { ingredients as _ingredients } from '$lib/ingredients';
	import type { Snippet } from 'svelte';

	interface Props {
		data: Content;
		children?: Snippet;
	}

	let { data, children }: Props = $props();

	let theme = $state('auto' as const);

	let pages = $derived(data.pages);
	let recipes = $derived(pages.filter(isRecipe));
	let pageName = $derived($page.params?.name);
	let pageId = $derived($page.route.id);
	let randomRecipe = $derived(
		recipes.filter((x) => x.slug !== pageName)[Math.floor(Math.random() * (recipes.length - 1))]
			.slug
	);
	let currentPageOrder = $derived(pages.findIndex((x) => x.slug === pageName));
	let prevPage = $derived(
		pages[currentPageOrder >= 0 ? (currentPageOrder + pages.length - 1) % pages.length : 0].slug
	);
	let nextPage = $derived(
		pages[currentPageOrder >= 0 ? (currentPageOrder + 1) % pages.length : 0].slug
	);

	function swipe(direction: -1 | 1) {
		goto(`/${direction === -1 ? prevPage : nextPage}`, { noScroll: true });
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.keyCode === 37 || e.keyCode === 39) {
			swipe((e.keyCode - 38) as -1 | 1);
			e.preventDefault();
		}
	}

	let touchstartX: number | undefined;
	let touchstartY: number | undefined;

	function ontouchstart(e: TouchEvent) {
		if (e.changedTouches.length !== 1) {
			return;
		}
		touchstartX = e.changedTouches[0].screenX;
		touchstartY = e.changedTouches[0].screenY;
	}

	function ontouchend(e: TouchEvent) {
		if (!touchstartX || !touchstartY || e.changedTouches.length !== 1) {
			return;
		}
		const xDiff = touchstartX - e.changedTouches[0].screenX;
		const yDiff = touchstartY - e.changedTouches[0].screenY;
		if (Math.abs(xDiff) > Math.abs(yDiff)) {
			if (xDiff < -50) {
				swipe(-1);
			} else if (xDiff > 50) {
				swipe(1)
			}
		}

		touchstartX = undefined;
		touchstartY = undefined;
	}

	function level(page: Page): number {
		return page.parent == null ? 0 : 1 + level(page.parent);
	}
</script>

<Styles {theme} />
<div>
	<Container fluid>
		<Row>
			<Col sm="auto">
				<div class="menu">
					<Row>
						<Col class="d-flex justify-content-center mt-3">
							<a href="/"
								><img
									src="/foto/Logo.webp"
									class="rounded-circle"
									style="width: 150px;"
									alt="Logo"
								/>
							</a>
						</Col>
					</Row>
					<hr />
					<Input type="select" bind:value={theme} class="mb-2 d-none d-sm-block">
						<option value="light">Světlý motiv</option>
						<option value="dark">Tmavý motiv</option>
						<option value="auto">Automatický motiv</option>
					</Input>
					<div class="d-flex w-100 gap-1">
						<a href="/{prevPage}"><Button>&lt;</Button></a>
						<a href="/{randomRecipe}" class="flex-grow-1"
							><Button class="w-100">Náhodný <span class="d-none d-sm-inline">recept</span></Button
							></a
						>
						<a href="/Obsah" class="flex-grow-1 d-sm-none"><Button class="w-100">Obsah</Button></a>
						<a href="/{nextPage}"><Button>&gt;</Button></a>
					</div>
					{#if !(pageId ?? '').endsWith('/Obsah')}
						<hr />
						<div class="content-items d-none d-sm-block">
							<Row>
								<Col>
									<Nav class="flex-column">
										<NavItem
											><NavLink href="/Obsah"
												><div class:active={pageId?.endsWith('Obsah')} style="margin-left: 0px">
													Obsah
												</div></NavLink
											></NavItem
										>
										{#each pages as item}
											<NavItem
												><NavLink href={'/' + item.slug}
													><div
														class:active={pageName === item.slug}
														style="margin-left: {level(item) * 15}px"
													>
														{item.title}
													</div></NavLink
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
				<div class="mt-2">
					{@render children?.()}
				</div>
			</Col>
		</Row>
	</Container>
</div>

<svelte:head>
	{#each recipes.flatMap(x => x.photos).map(x => x[1]) as photoSlug}
		<link rel="preload" href="/foto/{photoSlug}.webp" as="image" />
	{/each}
</svelte:head>
<svelte:window {onkeydown} />
<svelte:document {ontouchstart} {ontouchend} />

<style>
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
		padding: 0 !important;
		padding-bottom: 0.5rem !important;
	}

	:global(figcaption) {
		display: flex;
		justify-content: center;
		font-style: italic;
	}
</style>
