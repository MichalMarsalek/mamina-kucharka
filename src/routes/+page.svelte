<script lang="ts">
	import { Container } from '@sveltestrap/sveltestrap';
</script>

<a href="/obsah">
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
		text-align: center;
		text-shadow: 1px 1px 2px #000000;
	}
	h2 {
		font-size: calc(min(5vh, 7.5vw));
		text-align: center;
		text-shadow: 1px 1px 2px #000000;
	}

	div {
		background-image: url('/foto/Přední-obálka.jpg');
		height: 100vh;
		background-repeat: no-repeat;
		background-size: contain;
		background-position: center;
	}
</style>
