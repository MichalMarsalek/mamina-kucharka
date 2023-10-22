<script lang="ts">
	import { Button, Col, Container, Input, Nav, NavItem, NavLink, Row, Styles } from 'sveltestrap';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	export let data: { recipes: any[] };

	let theme = 'auto';

	$: pageName = $page.params?.name;
	$: randomRecipe = data.recipes.filter((x) => x.key !== pageName)[
		Math.floor(Math.random() * (data.recipes.length - 1))
	].key;
	$: currentPageOrder = data.recipes.findIndex((x) => x.key === pageName);
	$: prevRecipe =
		data.recipes[
			currentPageOrder >= 0 ? (currentPageOrder + data.recipes.length - 1) % data.recipes.length : 0
		].key;
	$: nextRecipe =
		data.recipes[currentPageOrder >= 0 ? (currentPageOrder + 1) % data.recipes.length : 0].key;

	function onKeyDown(e: any) {
		if (e.keyCode === 37) {
			goto(`/recept/${prevRecipe}`);
			e.preventDefault();
		}
		if (e.keyCode === 39) {
			goto(`/recept/${nextRecipe}`);
			e.preventDefault();
		}
	}
</script>

<Styles {theme} />
<div class="my-5">
	<Container fluid>
		<Row>
			<Col xs="auto">
				<div style="width: 250px">
					<Row>
						<Col class="d-flex justify-content-center">
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
						<option value="light">Light theme</option>
						<option value="dark">Dark theme</option>
						<option value="auto">Auto theme</option>
					</Input>
					<a href="/recept/{prevRecipe}"><Button>&lt;</Button></a>
					<a href="/recept/{randomRecipe}"><Button>Náhodný recept</Button></a>
					<a href="/recept/{nextRecipe}"><Button>&gt;</Button></a>
					<hr />
					<Row>
						<Col>
							<Nav class="flex-column">
								{#each data.recipes as item}
									<NavItem
										><NavLink href={'/recept/' + item.key}
											><span class:active={pageName === item.key}>{item.Recept}</span></NavLink
										></NavItem
									>
								{/each}
							</Nav>
						</Col>
					</Row>
				</div>
			</Col>
			<Col>
				<slot />
			</Col>
		</Row>
	</Container>
</div>

<svelte:window on:keydown={onKeyDown} />

<style>
	.active {
		font-weight: bold;
		margin-left: 15px;
	}
</style>
