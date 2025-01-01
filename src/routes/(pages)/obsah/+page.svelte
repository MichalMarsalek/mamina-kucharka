<script lang="ts">
	import { Button, Col, Container, Input, Nav, NavItem, NavLink, Row, Styles } from '@sveltestrap/sveltestrap';
	import type { Content, Page, Recipe } from '$lib/content';

	export let data: Content;
	$: pages = data.pages;

	$: search = "";
	
	function level(page: Page): number {
		return page.parent == null ? 0 : 1 + level(page.parent)
	}
</script>

<h1>Obsah</h1>
<Input bind:value={search}/>
<Nav class="flex-column">
{#each pages as item}
	<NavItem
		><NavLink href={'/' + item.slug} class="d-flex"
			><div class="page" style="padding-left: {level(item)*15}px">{#if item.number}<span>{item.number}.&nbsp;</span>{/if}{item.title}</div>
			{#if item.page}<div>str.&nbsp;{item.page}</div>{/if}</NavLink
		></NavItem
	>
{/each}
</Nav>

<style>
	.page {
		width: 450px;
	}
</style>