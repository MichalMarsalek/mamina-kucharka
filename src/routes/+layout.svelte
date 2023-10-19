<script lang="ts">
	import { Button, Col, Container, Input, Nav, NavItem, NavLink, Row, Styles } from 'sveltestrap';
	import { goto } from '$app/navigation';

	export let data: { recipes: any[] };

	let theme = 'auto';

	function randomRecipe() {
		goto(`/recept/${data.recipes[Math.floor(Math.random() * data.recipes.length)].key}`);
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
					<Button on:click={randomRecipe}>Náhodný recept</Button>
					<hr />
					<Row>
						<Col>
							<Nav class="flex-column">
								{#each data.recipes as item}
									<NavItem><NavLink href={'/recept/' + item.key}>{item.Recept}</NavLink></NavItem>
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
