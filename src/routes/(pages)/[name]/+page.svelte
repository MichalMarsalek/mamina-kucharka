<script lang="ts">
	import { isChapter, isValuesField, type Page } from '$lib/content';
	import { Col, Image, Row, Icon } from '@sveltestrap/sveltestrap';
	import { fade } from 'svelte/transition';
	import SvelteMarkdown from 'svelte-markdown';
	import AnchorRenderer from '$lib/anchor-renderer.svelte';
	import FavouriteStar from '$lib/favourite-star.svelte';

	interface Props {
		data: { page: Page };
	}

	let { data }: Props = $props();
	let page = $derived(data.page);

	$inspect(page);

	function isLink(x: string) {
		return /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/.test(x);
	}
</script>

{#key page?.slug}
	<main>
		<Row>
			{#if page}
				{#if page.photos.length > 0}
					<Col xs="12" lg="6">
						{#each page?.photos ?? [] as [photoName, photoSlug]}
							<figure class="photo">
								<Image fluid src="/foto/{photoSlug}.jpg" alt={photoName ?? page.title} />
								{#if photoName}
									<figcaption>{photoName}</figcaption>
								{/if}
							</figure>
						{/each}
					</Col>
				{/if}
				<Col>
					<div
						out:fade={{ duration: 150 }}
						in:fade={{ delay: 150 }}
						class:chapter={isChapter(page)}
					>
						<div>
							<h1 class="d-flex justify-content-between">
								<div class="header">
									<span class="title">{page.title}</span>
									{#if page.subtitle}<br />{page.subtitle}{/if}
									{#each page.tags as tag}
										<span class="badge badge-primary">{tag}</span>
									{/each}
								</div>
								<div class="star"><FavouriteStar slug={page.slug} /></div>
							</h1>
							{#if page.page}<div class="mb-2">str. {page.page}</div>{/if}

							{#if page.ingredients}
								{#if page.portions}
									Na {page.portions} {page.portions == 1 ? 'porci' : 'porce'}:
								{:else}
									Ingredience:
								{/if}
								<ul>
									{#each page.ingredients as item}
										<li title={item.normalized.join(', ')}>{item.raw}</li>
									{/each}
								</ul>
							{/if}

							{#if page.ingredients}
								Postup:
								<ul>
									{#each page.steps as item}
										<li>{item}</li>
									{/each}
								</ul>
							{/if}

							{#each page.customFields as field}
								{#if field.name}
									{field.name}:
								{/if}
								{#if isValuesField(field)}
									<ul>
										{#each field.values as value}
											<li>
												{#if isLink(value)}
													<a href={value} target="_blank">{value}</a>
												{:else}
													{value}
												{/if}
											</li>
										{/each}
									</ul>
								{:else}
									<SvelteMarkdown source={field.markdown} renderers={{ link: AnchorRenderer }} />
								{/if}
							{/each}
						</div>
					</div>
				</Col>
			{:else}
				Tento recept tady bohužel nemáme.
			{/if}
		</Row>
	</main>
{/key}

<style>
	h1 .badge {
		font-size: initial;
	}

	@media screen and (max-width: 992px) {
		.photo {
			max-height: 30vh;
			overflow: hidden;
		}
		:global(.photo img) {
			max-height: 30vh;
			object-fit: cover;
			width: 100%;
		}
	}

	@media screen and (max-width: 576px) and (orientation: portrait) {
		.photo:not(:first-child) {
			display: none;
		}
		.photo {
			height: 30vh;
			overflow: hidden;
		}
		main {
			min-height: calc(100vh - 10px);
		}
	}

	.header {
		max-width: calc(100% - 30px);
	}

	.header .title {
		text-transform: uppercase;
	}

	:global(.right) {
		text-align: right;
		width: 100%;
		margin-bottom: 20px;
	}
	:global(.center) {
		text-align: center;
		width: 100%;
		margin-bottom: 20px;
	}

	.chapter {
		text-align: center;
		display: flex;
		justify-content: center;
		margin-top: 100px;
	}

	.chapter > div {
		min-width: 25vw;
	}

	.chapter h1 {
		width: 100%;
	}
</style>
