---
name: cesium-viewer
description: "Sets up a CesiumJS Viewer with correct CDN tags, token configuration, and Scene/globe options."
---

Use this skill whenever generating a CesiumJS page to ensure the Viewer is initialised correctly.

## Required HTML head tags

Always include both the widget CSS and the main script from the CDN. Use CesiumJS version 1.138:

```html
<link
  rel="stylesheet"
  href="https://cesium.com/downloads/cesiumjs/releases/1.138/Build/Cesium/Widgets/widgets.css"
/>
<script src="https://cesium.com/downloads/cesiumjs/releases/1.138/Build/Cesium/Cesium.js"></script>
```

## Access token

Set the default access token before creating the Viewer:

```javascript
Cesium.Ion.defaultAccessToken = "<CESIUM_ION_TOKEN>";
```

## Viewer constructor

Create a Viewer attached to a `<div id="cesiumContainer">` element:

```javascript
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(), // Cesium World Terrain
  timeline: false, // hide timeline bar
  animation: false, // hide animation widget
  baseLayerPicker: false, // hide layer picker
  geocoder: false, // hide geocoder
  homeButton: false, // hide home button
  sceneModePicker: false, // hide scene mode picker
  navigationHelpButton: false, // hide help button
});
```

Enable common scene enhancements:

```javascript
viewer.scene.globe.enableLighting = true; // sun/shadow lighting
viewer.scene.fog.enabled = true;
viewer.scene.skyAtmosphere.show = true;
```

## Container div

Always include a full-page container div in the HTML body:

```html
<div
  id="cesiumContainer"
  style="width:100%;height:100vh;margin:0;padding:0;overflow:hidden;"
></div>
```

Also reset body margin in a `<style>` block:

```html
<style>
  html,
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
</style>
```
