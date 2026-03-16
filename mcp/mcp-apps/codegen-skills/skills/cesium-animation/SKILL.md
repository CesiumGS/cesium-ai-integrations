---
name: cesium-animation
description: "Animates CesiumJS scenes using the clock, SampledPositionProperty, and CZML data sources."
---

Use this skill whenever the generated page needs time-dynamic content, moving entities, or CZML playback.

## Clock setup

Configure the viewer clock before adding animated content:

```javascript
const start = Cesium.JulianDate.fromIso8601("2025-01-01T00:00:00Z");
const stop = Cesium.JulianDate.fromIso8601("2025-01-01T01:00:00Z");

viewer.clock.startTime = start.clone();
viewer.clock.stopTime = stop.clone();
viewer.clock.currentTime = start.clone();
viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
viewer.clock.multiplier = 60; // 1 second real time = 60 seconds simulation
viewer.clock.shouldAnimate = true;

// Sync the timeline widget if it is visible
viewer.timeline.zoomTo(start, stop);
```

## Moving entity with SampledPositionProperty

```javascript
const positionProperty = new Cesium.SampledPositionProperty();

// Add a sample at each time step
const times = [
  Cesium.JulianDate.fromIso8601("2025-01-01T00:00:00Z"),
  Cesium.JulianDate.fromIso8601("2025-01-01T00:30:00Z"),
  Cesium.JulianDate.fromIso8601("2025-01-01T01:00:00Z"),
];
const positions = [
  Cesium.Cartesian3.fromDegrees(-74.006, 40.7128, 1000),
  Cesium.Cartesian3.fromDegrees(-80.191, 25.775, 5000),
  Cesium.Cartesian3.fromDegrees(-87.629, 41.878, 1000),
];
times.forEach((t, i) => positionProperty.addSample(t, positions[i]));

// Interpolate smoothly
positionProperty.setInterpolationOptions({
  interpolationDegree: 3,
  interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
});

const entity = viewer.entities.add({
  availability: new Cesium.TimeIntervalCollection([
    new Cesium.TimeInterval({ start: times[0], stop: times[times.length - 1] }),
  ]),
  position: positionProperty,
  orientation: new Cesium.VelocityOrientationProperty(positionProperty),
  point: { pixelSize: 10, color: Cesium.Color.CYAN },
  path: {
    resolution: 1,
    material: new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.1,
      color: Cesium.Color.CYAN,
    }),
    width: 3,
  },
});

viewer.trackedEntity = entity;
```

## CZML data source

Load a CZML document (array of packets) directly:

```javascript
const czml = [
  { id: "document", name: "Demo", version: "1.0" },
  {
    id: "vehicle",
    availability: "2025-01-01T00:00:00Z/2025-01-01T01:00:00Z",
    position: {
      epoch: "2025-01-01T00:00:00Z",
      cartographicDegrees: [
        0, -74.006, 40.7128, 1000, 1800, -80.191, 25.775, 5000, 3600, -87.629,
        41.878, 1000,
      ],
    },
    point: { pixelSize: 10, color: { rgba: [0, 255, 255, 255] } },
  },
];

const dataSource = await Cesium.CzmlDataSource.load(czml);
viewer.dataSources.add(dataSource);
viewer.zoomTo(dataSource);
```

## TimeIntervalCollectionProperty (discrete values over time)

```javascript
const colorProperty = new Cesium.TimeIntervalCollectionProperty();
colorProperty.intervals.addInterval(
  new Cesium.TimeInterval({
    start: Cesium.JulianDate.fromIso8601("2025-01-01T00:00:00Z"),
    stop: Cesium.JulianDate.fromIso8601("2025-01-01T00:30:00Z"),
    data: Cesium.Color.RED,
  }),
);
colorProperty.intervals.addInterval(
  new Cesium.TimeInterval({
    start: Cesium.JulianDate.fromIso8601("2025-01-01T00:30:00Z"),
    stop: Cesium.JulianDate.fromIso8601("2025-01-01T01:00:00Z"),
    data: Cesium.Color.BLUE,
  }),
);
```
