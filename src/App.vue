<!--
	FC Tycoon™ 2027 Match Simulator - Root Application Component

	Copyright © 2025 Darkwave Studios LLC. All rights reserved.
	This file is part of FC Tycoon™ 2027 Match Simulator.
	Licensed under the FC Tycoon Match Simulator Source Available License.
	See LICENSE.md in the project root for license terms.
-->

<template>
	<div id="app">
		<router-view />
	</div>
</template>

<script>
export default {
	name: 'App',
}
</script>

<style>
/* Global styles */
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

html,
body {
	width: 100%;
	height: 100%;
	overflow: hidden;
	background-color: #1e1e1e;
	color: #e0e0e0;
}

#app {
	width: 100%;
	height: 100%;
	font-family: Verdana, Roboto, 'Segoe UI', Tahoma, Geneva, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}
</style>
