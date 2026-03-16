---
name: cesium-camera
description: "Controls the CesiumJS camera: flyTo, setView, lookAt, and coordinate helpers."
---

Use this skill whenever the generated page needs to position or animate the camera.

## Fly to a position (animated)

`camera.flyTo` animates the camera to a destination over a given duration:

```javascript
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 3000),
  orientation: {
    heading: Cesium.Math.toRadians(0), // north
    pitch: Cesium.Math.toRadians(-45), // looking down at 45°
    roll: 0,
  },
  duration: 3, // seconds
});
```

## Set view (instant, no animation)

```javascript
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 10000),
  orientation: {
    heading: 0,
    pitch: Cesium.Math.toRadians(-90), // straight down
    roll: 0,
  },
});
```

## Look at a target with offset

```javascript
const target = Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 0);
const offset = new Cesium.HeadingPitchRange(
  Cesium.Math.toRadians(0), // heading
  Cesium.Math.toRadians(-30), // pitch
  5000, // range in metres
);
viewer.camera.lookAt(target, offset);
// Release the look-at lock so user can pan:
viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
```

## Fly to a geographic rectangle

```javascript
viewer.camera.flyTo({
  destination: Cesium.Rectangle.fromDegrees(-130, 24, -65, 50), // contiguous US
  duration: 2,
});
```

## Useful coordinate helpers

```javascript
// Single position
const pos = Cesium.Cartesian3.fromDegrees(lon, lat, heightMetres);

// Multiple positions from flat array [lon, lat, lon, lat, ...]
const positions = Cesium.Cartesian3.fromDegreesArray([lon1, lat1, lon2, lat2]);

// Degrees → radians
const rad = Cesium.Math.toRadians(degrees);
```

## Fly to all visible entities

```javascript
viewer.zoomTo(viewer.entities);
// or with padding:
viewer.flyTo(viewer.entities, {
  offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 10000),
});
```
