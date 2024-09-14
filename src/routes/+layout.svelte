<script lang="ts">
	import { Button, Col, Container, Input, Nav, NavItem, NavLink, Row, Styles } from '@sveltestrap/sveltestrap';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { isRecipe, type Content, type Page } from '$lib/content';
	import SimpleAutocomplete from "simple-svelte-autocomplete";
	import { ingredients as _ingredients } from '$lib/ingredients';

	export let data: Content;

	let theme = 'auto' as const;

	$: pages = data.pages;
	$: recipes = pages.filter(isRecipe)
	$: pageName = $page.params?.name;
	$: randomRecipe = recipes.filter((x) => x.slug !== pageName)[
		Math.floor(Math.random() * (recipes.length - 1))
	].slug;
	$: currentPageOrder = pages.findIndex((x) => x.slug === pageName);
	$: prevPage =
		pages[
			currentPageOrder >= 0 ? (currentPageOrder + pages.length - 1) % pages.length : 0
		].slug;
	$: nextPage =
		pages[currentPageOrder >= 0 ? (currentPageOrder + 1) % pages.length : 0].slug;
	
	const allIngredients = _ingredients.map(x => x.name);
	$: selectedIngredients = [] as string[]

	function onKeyDown(e: any) {
		if (e.keyCode === 37) {
			goto(`/${prevPage}`);
			e.preventDefault();
		}
		if (e.keyCode === 39) {
			goto(`/${nextPage}`);
			e.preventDefault();
		}
	}

	function level(page: Page): number {
		return page.parent == null ? 0 : 1 + level(page.parent)
	}
</script>

<Styles {theme} />
<div>
	<Container fluid>
		<Row>
			<Col xs="auto">
				<div class="menu">
					<Row>
						<Col class="d-flex justify-content-center mt-3">
							<a href="/"
								><img
									src="/foto/Logo.jpg"
									class="rounded-circle"
									style="width: 150px;"
									alt="Logo"
								/>
							</a>
						</Col>
					</Row>
					<hr />
					<Input type="select" bind:value={theme} class="mb-2">
						<option value="light">Světlý motiv</option>
						<option value="dark">Tmavý motiv</option>
						<option value="auto">Automatický motiv</option>
					</Input>
					<a href="/{prevPage}"><Button>&lt;</Button></a>
					<a href="/{randomRecipe}"><Button>Náhodný recept</Button></a>
					<a href="/{nextPage}"><Button>&gt;</Button></a>
					<!-- <SimpleAutocomplete items={allIngredients} bind:selectedItem={selectedIngredients} multiple={true}/> -->
					<hr />
					<div class="content-items">
						<Row>
							<Col>
								<Nav class="flex-column">
									{#each pages as item}
										<NavItem
											><NavLink href={'/' + item.slug}
												><div class:active={pageName === item.slug} style="margin-left: {level(item)*15}px">{item.title}</div></NavLink
											></NavItem
										>
									{/each}
								</Nav>
							</Col>
						</Row>
					</div>
				</div>
			</Col>
			<Col>
				<div class="mt-2">
					<slot />
				</div>
			</Col>
		</Row>
	</Container>
</div>

<svelte:window on:keydown={onKeyDown} />

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
		width: 250px;
		position: sticky;
		top: 0;
	}

	:global(.nav-link) {
		padding: 0 !important;
		padding-bottom: .5rem !important;
	}
</style>
