<script lang="ts">
	import { goto } from '$app/navigation';
	import { page as sveltePage } from '$app/stores';
	import { onMount } from 'svelte';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
	import PageContent from '$lib/page-content.svelte';
	import type { Page } from '$lib/content';

	interface Props {
		data: { page: Page; pages: Page[]; edition: string };
	}

	let { data }: Props = $props();
	let currentPage = $derived(data.page);
	let pages = $derived(data.pages);
	let edition = $derived(data.edition);
	let pageName = $derived(data.page?.slug ?? '');
	let currentIndex = $derived(pages.findIndex((x) => x.slug === pageName));

	let isMobile = $state(false);
	let showMobileCarousel = $state(false);
	let emblaApi = $state<EmblaCarouselType | undefined>();
	let isSyncingFromRoute = $state(false);

	let emblaConfig = $state<{ options: EmblaOptionsType; plugins: [] }>({
		options: {
			align: 'start',
			loop: false,
			containScroll: 'trimSnaps',
			startIndex: 0
		},
		plugins: []
	});
	let cancelCarouselActivation = () => {};

	function onEmblaSettle(api: EmblaCarouselType) {
		if (!showMobileCarousel || isSyncingFromRoute) {
			return;
		}

		const selectedSnap = api.selectedScrollSnap();
		const selectedPage = pages[selectedSnap];
		if (!selectedPage || selectedPage.slug === pageName) {
			return;
		}

		goto(`/${edition}/${selectedPage.slug}${$sveltePage.url.search}`, {
			noScroll: true
		});
	}

	function onemblaInit(event: CustomEvent<EmblaCarouselType>) {
		emblaApi?.off('settle', onEmblaSettle);
		emblaApi = event.detail;
		emblaApi.on('settle', onEmblaSettle);
	}

	$effect(() => {
		const index = currentIndex;
		if (emblaApi && showMobileCarousel && index >= 0) {
			isSyncingFromRoute = true;
			emblaApi.scrollTo(index, true);
			queueMicrotask(() => {
				isSyncingFromRoute = false;
			});
		}
	});

	$effect(() => {
		if (!isMobile) {
			showMobileCarousel = false;
		}
	});

	onMount(() => {
		const mediaQuery = window.matchMedia('(max-width: 575.98px)');
		const activateCarousel = () => {
			cancelCarouselActivation();

			if (!mediaQuery.matches) {
				return;
			}

			if ('requestIdleCallback' in window) {
				const idleId = window.requestIdleCallback(() => {
					showMobileCarousel = true;
				});
				cancelCarouselActivation = () => window.cancelIdleCallback(idleId);
				return;
			}

			const timeoutId = globalThis.setTimeout(() => {
				showMobileCarousel = true;
			}, 150);
			cancelCarouselActivation = () => globalThis.clearTimeout(timeoutId);
		};

		const updateIsMobile = () => {
			const wasMobile = isMobile;
			isMobile = mediaQuery.matches;
			if (!isMobile) {
				cancelCarouselActivation();
				showMobileCarousel = false;
			} else if (!wasMobile && !showMobileCarousel) {
				activateCarousel();
			}
		};

		// Set startIndex before isMobile=true so the carousel renders at the right slide immediately.
		emblaConfig.options.startIndex = currentIndex >= 0 ? currentIndex : 0;
		updateIsMobile();
		mediaQuery.addEventListener('change', updateIsMobile);

		return () => {
			cancelCarouselActivation();
			emblaApi?.off('settle', onEmblaSettle);
			mediaQuery.removeEventListener('change', updateIsMobile);
		};
	});
</script>

{#if showMobileCarousel}
	<div class="embla" use:emblaCarouselSvelte={emblaConfig} {onemblaInit}>
		<div class="embla__container">
			{#each pages as item (item.slug)}
				<div class="embla__slide">
					<PageContent page={item} {edition} />
				</div>
			{/each}
		</div>
	</div>
{:else}
	<PageContent page={currentPage} {edition} />
{/if}

<style>
	.embla {
		overflow: hidden;
		width: 100%;
		touch-action: pan-y pinch-zoom;
	}

	.embla__container {
		display: flex;
		gap: 1rem;
	}

	.embla__slide {
		flex: 0 0 100%;
		min-width: 0;
	}
</style>
