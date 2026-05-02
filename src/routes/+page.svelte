<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { defaultEdition } from '$lib/editions';
	import { onMount } from 'svelte';

	let edition = $state(
		browser ? (localStorage.getItem('edition') ?? defaultEdition) : defaultEdition
	);
	let contentPath = $derived(`/${edition}/Obsah`);

	function markCoverMorph() {
		sessionStorage.setItem('coverMorphPending', String(Date.now()));
	}

	function onclick() {
		markCoverMorph();
	}

	function nonPassiveTouch(node: HTMLElement) {
		function handler(e: TouchEvent) {
			e.preventDefault();
			markCoverMorph();
			goto(contentPath);
		}
		node.addEventListener('touchstart', handler, { passive: false });
		return {
			destroy() {
				node.removeEventListener('touchstart', handler);
			}
		};
	}

	let mounted = $state(false);
	onMount(() => {
		requestAnimationFrame(() => {
			mounted = true;
		});
	});

	let tiltX = $state(0);
	let tiltY = $state(0);

	function onmousemove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		tiltX = ((e.clientY - cy) / rect.height) * 20;
		tiltY = -((e.clientX - cx) / rect.width) * 20;
	}

	function onmouseleave() {
		tiltX = 0;
		tiltY = 0;
	}
</script>

<a href={contentPath} {onclick} use:nonPassiveTouch>
	<div
		class="cover"
		{onmousemove}
		{onmouseleave}
		style:--tilt-x="{tiltX}deg"
		style:--tilt-y="{tiltY}deg"
		role="presentation"
	>
		<div class="tilt-inner">
			<div class="overlay"></div>
			<div class="photo-frame">
				<div class="text-content">
					<h1 class:show={mounted}><span>Mámina</span><br /><span>kuchařka</span></h1>
					<h2 class:show={mounted}>
						<span>aneb</span><br /><span>Když kluci vyletí z hnízda</span>
					</h2>
					<p class="hint" class:show={mounted}>↵ kliknutím otevřít</p>
				</div>
			</div>
		</div>
	</div>
</a>

<style>
	a {
		color: initial;
		text-decoration: none;
		display: block;
		height: 100%;
	}

	:global(html, body) {
		height: 100%;
	}

	.cover {
		height: 100%;
		background-image: url('/foto/Přední-obálka.webp');
		background-repeat: no-repeat;
		background-size: contain;
		background-position: center;
		perspective: 900px;
		cursor: pointer;
		overflow: hidden;
	}

	.tilt-inner {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.overlay {
		position: absolute;
		inset: 0;
		background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.12) 100%);
		pointer-events: none;
	}

	.photo-frame {
		aspect-ratio: 7443 / 10247;
		width: 100%;
		max-height: 100%;
		position: relative;
		transform: rotateX(var(--tilt-x)) rotateY(var(--tilt-y));
		transition: transform 0.12s ease-out;
		will-change: transform;
	}

	.text-content {
		position: absolute;
		inset: 0;
	}

	h1 {
		position: absolute;
		top: 0.5rem;
		left: 50%;
		width: 92%;
		color: white;
		font-size: clamp(2rem, min(10vh, 15vw), 8rem);
		text-transform: uppercase;
		text-align: center;
		text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.45);
		opacity: 0;
		transform: translate(-50%, -24px);
		transition:
			opacity 0.9s ease,
			transform 0.9s ease;
		margin: 0;
	}

	h1.show {
		opacity: 1;
		transform: translate(-50%, 0);
	}

	h2 {
		position: absolute;
		bottom: 0.5rem;
		left: 50%;
		width: 92%;
		color: white;
		font-size: clamp(1rem, min(5vh, 7.5vw), 4rem);
		text-align: center;
		text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.45);
		opacity: 0;
		transform: translate(-50%, 24px);
		transition:
			opacity 0.9s ease 0.35s,
			transform 0.9s ease 0.35s;
		margin: 0;
	}

	h2.show {
		opacity: 1;
		transform: translate(-50%, 0);
	}

	.hint {
		position: absolute;
		right: 1rem;
		bottom: 0.5rem;
		text-align: center;
		color: white;
		font-size: clamp(0.7rem, 2vw, 0.95rem);
		letter-spacing: 0.12em;
		opacity: 0;
		transition: opacity 1.2s ease 1.1s;
		margin: 0;
		white-space: nowrap;
	}

	.hint.show {
		opacity: 0.45;
	}

	@media screen and (max-width: 768px) {
		h2 {
			bottom: 2.5rem;
		}
	}
</style>
