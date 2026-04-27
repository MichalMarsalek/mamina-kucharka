<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		photoUrl,
		side = 'right',
		width = 224,
		offsetX = 0,
		alignSelector,
		children
	}: {
		photoUrl?: string;
		side?: 'left' | 'right';
		width?: number;
		offsetX?: number;
		alignSelector?: string;
		children: Snippet;
	} = $props();

	let visible = $state(false);
	let x = $state(0);
	let y = $state(0);
	let hostElement = $state<HTMLDivElement | null>(null);

	const gap = 12;
	const viewportPadding = 8;
	const tooltipAspectRatio = 3 / 4;

	function clamp(value: number, min: number, max: number): number {
		return Math.max(min, Math.min(value, max));
	}

	function tooltipHeight() {
		return width * tooltipAspectRatio;
	}

	function computeX() {
		if (!hostElement) return 0;
		const anchor = (hostElement.firstElementChild as HTMLElement) ?? hostElement;
		const rect = anchor.getBoundingClientRect();
		const alignLeft = alignSelector
			? document.querySelector<HTMLElement>(alignSelector)?.getBoundingClientRect().left
			: undefined;
		let nx =
			side === 'left'
				? rect.left - width - gap
				: alignLeft !== undefined
					? alignLeft + gap
					: rect.right + gap;
		nx += offsetX;
		return clamp(nx, viewportPadding, window.innerWidth - width - viewportPadding);
	}

	function placeVerticallyAt(clientY: number) {
		const h = tooltipHeight();
		y = clamp(clientY - h / 2, viewportPadding, window.innerHeight - h - viewportPadding);
	}

	function show(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		if (!photoUrl) return;
		if (!hostElement) return;
		x = computeX();
		placeVerticallyAt(e.clientY);
		visible = true;
	}

	function hide() {
		visible = false;
	}

	function move(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		if (!visible) return;
		placeVerticallyAt(e.clientY);
	}

	function showFromFocus() {
		if (!photoUrl) return;
		if (!hostElement) return;
		x = computeX();
		const rect = (
			(hostElement.firstElementChild as HTMLElement | null) ?? hostElement
		).getBoundingClientRect();
		placeVerticallyAt(rect.top + rect.height / 2);
		visible = true;
	}

	function hideFromBlur() {
		visible = false;
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}
</script>

<div
	class="tooltip-host"
	bind:this={hostElement}
	onpointerenter={show}
	onpointerleave={hide}
	onpointermove={move}
	onfocus={showFromFocus}
	onblur={hideFromBlur}
	role="none"
>
	{@render children()}
</div>

{#if visible && photoUrl}
	<div use:portal class="photo-tooltip" style="left: {x}px; top: {y}px; width: {width}px">
		{#key photoUrl}
			<img src={photoUrl} alt="" />
		{/key}
	</div>
{/if}

<style>
	.tooltip-host {
		display: contents;
	}

	.photo-tooltip {
		position: fixed;
		z-index: 2147483647;
		pointer-events: none;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
		border: 1px solid var(--bs-border-color, #dee2e6);
		background: var(--bs-body-bg, white);
	}

	.photo-tooltip img {
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		display: block;
		animation: tooltip-photo-swap 0.2s ease-out;
	}

	@keyframes tooltip-photo-swap {
		from {
			opacity: 0.35;
			transform: scale(1.03);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
