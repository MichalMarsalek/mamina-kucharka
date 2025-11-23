<script lang="ts">
	import { goto } from '$app/navigation';
	import { defaultEdition } from '$lib/editions';

	let edition = $state(defaultEdition);
	$effect(() => {
		edition = localStorage.getItem('edition') ?? edition;
	});
	let contentPath = $derived(`/${edition}/Obsah`);

	function ontouchstart() {
		goto(contentPath);
	}
</script>

<a href={contentPath} {ontouchstart}>
	<div class="d-flex flex-column justify-content-between">
		<h1 class="d-flex justify-content-center"><span>Mámina<br />kuchařka</span></h1>
		<h2 class="d-flex justify-content-center"><span>aneb<br />Když kluci vyletí z hnízda</span></h2>
	</div>
</a>

<style>
	a {
		color: initial;
		text-decoration: none;
	}
	h1 {
		font-size: calc(min(10vh, 15vw));
		text-transform: uppercase;
	}
	h2 {
		font-size: calc(min(5vh, 7.5vw));
	}
	h1,
	h2 {
		text-align: center;
		text-shadow: 1px 1px 2px #000000;
	}
	@media screen and (orientation: landscape) {
		h1,
		h2 {
			color: white;
		}
	}

	:global(html, body) {
		height: 100%;
	}
	div {
		background-image: url('/foto/Přední-obálka.webp');
		height: 100%;
		background-repeat: no-repeat;
		background-size: contain;
		background-position: center;
	}
</style>
