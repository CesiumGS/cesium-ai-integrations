---
name: cesium-entities
description: "Adds CesiumJS entities (points, polylines, polygons, billboards, labels, 3D models) to a Viewer."
---

Use this skill whenever the generated page needs to place objects on the globe.

## Adding entities

All entities are added via `viewer.entities.add({})`. Common properties shared by every entity:

```javascript
viewer.entities.add({
  name: "My Entity",
  position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
  // ... shape descriptor below
});
```

## Point

```javascript
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 0),
  point: {
    pixelSize: 10,
    color: Cesium.Color.RED,
    outlineColor: Cesium.Color.WHITE,
    outlineWidth: 2,
  },
});
```

## Polyline

Positions are passed as a flat `[lon, lat, lon, lat, ...]` array:

```javascript
viewer.entities.add({
  polyline: {
    positions: Cesium.Cartesian3.fromDegreesArray([
      -74.006, 40.7128, -87.629, 41.878,
    ]),
    width: 3,
    material: Cesium.Color.YELLOW,
  },
});
```

## Polygon

```javascript
viewer.entities.add({
  polygon: {
    hierarchy: Cesium.Cartesian3.fromDegreesArray([
      -74.006, 40.7128, -74.0, 40.72, -73.99, 40.71,
    ]),
    material: Cesium.Color.BLUE.withAlpha(0.5),
    outline: true,
    outlineColor: Cesium.Color.WHITE,
  },
});
```

## Billboard (image marker)

```javascript
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 0),
  billboard: {
    image: "https://example.com/icon.png",
    width: 32,
    height: 32,
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
  },
});
```

## Label

```javascript
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 0),
  label: {
    text: "New York",
    font: "14pt sans-serif",
    fillColor: Cesium.Color.WHITE,
    outlineColor: Cesium.Color.BLACK,
    outlineWidth: 2,
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    pixelOffset: new Cesium.Cartesian2(0, -10),
  },
});
```

## 3D Model (glTF / glb from Cesium ion)

```javascript
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 0),
  model: {
    uri: Cesium.IonResource.fromAssetId(12345), // replace with real asset id
    minimumPixelSize: 64,
    maximumScale: 20000,
  },
});
```

## Dynamic color with CallbackProperty

```javascript
let toggle = false;
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(0, 0, 0),
  point: {
    pixelSize: 12,
    color: new Cesium.CallbackProperty(() => {
      toggle = !toggle;
      return toggle ? Cesium.Color.RED : Cesium.Color.BLUE;
    }, false),
  },
});
```

## Zoom to entities

After adding entities, fly the camera to them:

```javascript
viewer.zoomTo(viewer.entities);
```
