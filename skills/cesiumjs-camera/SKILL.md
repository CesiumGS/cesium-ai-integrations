---
name: cesiumjs-camera
description: "CesiumJS camera control - Camera, flyTo, lookAt, setView, ScreenSpaceCameraController, CameraEventAggregator, flight animation. Use when positioning the camera, creating flyTo animations, constraining user navigation, tracking entities, or converting between screen and world coordinates."
---
# CesiumJS Camera & Navigation

> **Baseline:** CesiumJS v1.139 -- ES module imports (`import { ... } from "cesium";`)

## Camera Fundamentals

Access via `viewer.camera`. The camera has a `position` (Cartesian3 in world
coords), orientation vectors (`direction`, `up`, `right`), and a frustum.
All angles are **radians**.

Read-only computed properties: `positionWC`, `positionCartographic`,
`directionWC`, `upWC`, `rightWC`, `heading` (0 = north, clockwise), `pitch`
(negative = down), `roll`, `transform`, `viewMatrix`, `inverseViewMatrix`.

Events: `moveStart` / `moveEnd` fire when movement begins/ends. `changed`
fires when the camera moves by more than `percentageChanged` (default 0.5).

---

## setView -- Instant Placement

Teleports the camera. `destination` is a `Cartesian3` or `Rectangle`.
`orientation` accepts `{ heading, pitch, roll }` or `{ direction, up }`.

```js
import { Cartesian3, Math as CesiumMath } from "cesium";

viewer.camera.setView({
  destination: Cartesian3.fromDegrees(-117.16, 32.71, 15000.0),
  orientation: {
    heading: CesiumMath.toRadians(0.0),   // north
    pitch: CesiumMath.toRadians(-90.0),    // straight down
    roll: 0.0,
  },
});
```

```js
import { Rectangle } from "cesium";

// View a geographic rectangle (top-down, orientation defaults to north/down)
viewer.camera.setView({
  destination: Rectangle.fromDegrees(-77.0, 38.0, -72.0, 42.0),
});
```

---

## flyTo -- Animated Flight

Smoothly animates the camera. Key options: `destination` (required),
`orientation`, `duration` (seconds, auto if omitted), `complete` / `cancel`
callbacks, `maximumHeight`, `pitchAdjustHeight`, `flyOverLongitude`,
`flyOverLongitudeWeight`, `easingFunction`, `endTransform`.

```js
import { Cartesian3, Math as CesiumMath } from "cesium";

viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(-122.22, 46.12, 5000.0),
  orientation: {
    heading: CesiumMath.toRadians(20.0),
    pitch: CesiumMath.toRadians(-35.0),
    roll: 0.0,
  },
  duration: 3,
});
```

```js
import { Cartesian3, Math as CesiumMath, EasingFunction } from "cesium";

// Chain flights using the complete callback
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(-73.986, 40.748, 363.0),
  complete() {
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-73.986, 40.758, 187.0),
      orientation: {
        heading: CesiumMath.toRadians(200.0),
        pitch: CesiumMath.toRadians(-50.0),
      },
      easingFunction: EasingFunction.LINEAR_NONE,
    });
  },
});
```

```js
// Long-distance flight: LA to Tokyo via Europe
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(139.815, 35.714, 20000.0),
  duration: 20,
  flyOverLongitude: Cesium.Math.toRadians(60.0), // eastward via Europe
  pitchAdjustHeight: 1000, // look down at high altitude
});
```

Control in-progress flights with `completeFlight()` (jumps to end state) and
`cancelFlight()` (stays at current position).

---

## flyHome

Fly to the default view. Override with `Camera.DEFAULT_VIEW_RECTANGLE`.

```js
import { Camera, Rectangle } from "cesium";

Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(-10.0, 35.0, 40.0, 60.0);
viewer.camera.flyHome(2.0); // duration in seconds; omit for auto
```

---

## lookAt -- Lock Camera to Target

Positions the camera to look at a world-coordinate target from an offset
(`HeadingPitchRange` or `Cartesian3` in the local ENU frame). The camera is
locked until you call `lookAtTransform(Matrix4.IDENTITY)`.

```js
import { Cartesian3, Math as CesiumMath, HeadingPitchRange } from "cesium";

const target = Cartesian3.fromDegrees(-72.0, 40.0);
viewer.camera.lookAt(
  target,
  new HeadingPitchRange(
    CesiumMath.toRadians(50.0), // heading
    CesiumMath.toRadians(-20.0), // pitch
    5000.0, // range in meters
  ),
);
```

```js
import { Matrix4 } from "cesium";

// Release the lookAt lock to restore free navigation
viewer.camera.lookAtTransform(Matrix4.IDENTITY);
```

---

## lookAtTransform -- Custom Reference Frames

Set camera position relative to an arbitrary transform matrix.

```js
import { Cartesian3, Transforms, HeadingPitchRange, Math as CesiumMath } from "cesium";

// View in an east-north-up frame centered on a point
const center = Cartesian3.fromDegrees(-75.598, 40.039);
const transform = Transforms.eastNorthUpToFixedFrame(center);
viewer.camera.lookAtTransform(
  transform,
  new HeadingPitchRange(0.0, CesiumMath.toRadians(-45.0), 5000.0),
);
```

```js
import { Transforms, Matrix4, Cartesian3, defined } from "cesium";

// View Earth in the ICRF (inertial) frame -- stars stay fixed
function icrf(scene, time) {
  if (scene.mode !== Cesium.SceneMode.SCENE3D) return;
  const icrfToFixed = Transforms.computeIcrfToFixedMatrix(time);
  if (defined(icrfToFixed)) {
    const offset = Cartesian3.clone(viewer.camera.position);
    viewer.camera.lookAtTransform(
      Matrix4.fromRotationTranslation(icrfToFixed),
      offset,
    );
  }
}
viewer.scene.postUpdate.addEventListener(icrf);
```

---

## flyToBoundingSphere / viewBoundingSphere

Frame the camera around a `BoundingSphere`. Range is auto-computed when 0.

```js
import { BoundingSphere, Cartesian3, HeadingPitchRange, Math as CesiumMath } from "cesium";

const sphere = new BoundingSphere(Cartesian3.fromDegrees(-117.16, 32.71), 1000.0);

// Animated
viewer.camera.flyToBoundingSphere(sphere, {
  offset: new HeadingPitchRange(0.0, CesiumMath.toRadians(-45.0), 0.0),
  duration: 2.0,
});

// Instant
viewer.camera.viewBoundingSphere(sphere);
```

---

## Movement, Rotation, Look, and Zoom Methods

**Movement** (translate position by meters, default `defaultMoveAmount` = 100 km):
`moveForward`, `moveBackward`, `moveUp`, `moveDown`, `moveLeft`, `moveRight`,
`move(direction, amount)`.

**Rotation** (orbit around reference frame center, preserves distance, default
`defaultRotateAmount` = PI/3600 rad): `rotateUp`, `rotateDown`, `rotateLeft`,
`rotateRight`, `rotate(axis, angle)`.

**Look** (first-person rotate-in-place, default `defaultLookAmount` = PI/60 rad):
`lookUp`, `lookDown`, `lookLeft`, `lookRight`, `look(axis, angle)`,
`twistLeft`, `twistRight`.

**Zoom** (along view direction, default `defaultZoomAmount` = 100 km):
`zoomIn(amount)`, `zoomOut(amount)`.

```js
// Scale movement speed to altitude for natural feel
const height = viewer.scene.globe.ellipsoid
  .cartesianToCartographic(viewer.camera.position).height;
const speed = height / 100.0;
viewer.camera.moveForward(speed);
```

---

## ScreenSpaceCameraController

Handles default mouse/touch input. Access via
`viewer.scene.screenSpaceCameraController`.

### Constraining Navigation

```js
const ctrl = viewer.scene.screenSpaceCameraController;

ctrl.minimumZoomDistance = 500;       // meters from surface
ctrl.maximumZoomDistance = 50000;
ctrl.maximumTiltAngle = Math.PI / 2; // prevent going below horizon

// Disable specific interactions
ctrl.enableRotate = false;
ctrl.enableTilt = false;
ctrl.enableZoom = false;
ctrl.enableTranslate = false; // 2D / Columbus only
ctrl.enableLook = false;
ctrl.enableInputs = false;    // disable everything at once

// Inertia (0 = none, 0.9 = default)
ctrl.inertiaSpin = 0.5;
ctrl.inertiaZoom = 0.5;
ctrl.inertiaTranslate = 0.5;

// Allow camera underground
ctrl.enableCollisionDetection = false;
```

### Remapping Input Events

```js
import { CameraEventType, KeyboardEventModifier } from "cesium";

const ctrl = viewer.scene.screenSpaceCameraController;
ctrl.rotateEventTypes = CameraEventType.RIGHT_DRAG;
ctrl.tiltEventTypes = {
  eventType: CameraEventType.LEFT_DRAG,
  modifier: KeyboardEventModifier.CTRL,
};
ctrl.zoomEventTypes = CameraEventType.WHEEL;
```

`CameraEventType` values: `LEFT_DRAG`, `RIGHT_DRAG`, `MIDDLE_DRAG`, `WHEEL`,
`PINCH`. Combine with `KeyboardEventModifier`: `SHIFT`, `CTRL`, `ALT`.

---

## Custom First-Person Controls

```js
import { ScreenSpaceEventHandler, ScreenSpaceEventType, Cartesian3 } from "cesium";

const ctrl = viewer.scene.screenSpaceCameraController;
// Disable defaults
ctrl.enableRotate = ctrl.enableTranslate = ctrl.enableZoom = false;
ctrl.enableTilt = ctrl.enableLook = false;

const canvas = viewer.canvas;
canvas.setAttribute("tabindex", "0");

let looking = false, startPos, mousePos;
const handler = new ScreenSpaceEventHandler(canvas);
handler.setInputAction((m) => { looking = true; startPos = mousePos = Cartesian3.clone(m.position); }, ScreenSpaceEventType.LEFT_DOWN);
handler.setInputAction((m) => { mousePos = m.endPosition; }, ScreenSpaceEventType.MOUSE_MOVE);
handler.setInputAction(() => { looking = false; }, ScreenSpaceEventType.LEFT_UP);

const flags = {};
const keyMap = { KeyW: "fwd", KeyS: "back", KeyA: "left", KeyD: "right", KeyQ: "up", KeyE: "down" };
document.addEventListener("keydown", (e) => { if (keyMap[e.code]) flags[keyMap[e.code]] = true; });
document.addEventListener("keyup", (e) => { if (keyMap[e.code]) flags[keyMap[e.code]] = false; });

viewer.clock.onTick.addEventListener(() => {
  const cam = viewer.camera;
  if (looking) {
    cam.lookRight((mousePos.x - startPos.x) / canvas.clientWidth * 0.05);
    cam.lookUp(-(mousePos.y - startPos.y) / canvas.clientHeight * 0.05);
  }
  const spd = viewer.scene.globe.ellipsoid
    .cartesianToCartographic(cam.position).height / 100;
  if (flags.fwd) cam.moveForward(spd);
  if (flags.back) cam.moveBackward(spd);
  if (flags.left) cam.moveLeft(spd);
  if (flags.right) cam.moveRight(spd);
  if (flags.up) cam.moveUp(spd);
  if (flags.down) cam.moveDown(spd);
});
```

---

## Camera Events

```js
// Movement start/end
const offStart = viewer.camera.moveStart.addEventListener(() => console.log("moving"));
const offEnd = viewer.camera.moveEnd.addEventListener(() => console.log("stopped"));
// offStart(); offEnd(); // call return values to unsubscribe

// Significant change detection
viewer.camera.percentageChanged = 0.1;
viewer.camera.changed.addEventListener((pct) => {
  console.log(`Camera changed ${(pct * 100).toFixed(1)}%`);
});
```

---

## pickEllipsoid -- Screen to Globe

```js
import { Cartesian2 } from "cesium";

const center = new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
const worldPos = viewer.camera.pickEllipsoid(center);
if (worldPos) {
  const carto = viewer.scene.globe.ellipsoid.cartesianToCartographic(worldPos);
  console.log(Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude));
}
```

---

## Entity Tracking

```js
// Track an entity (sets camera to follow automatically)
viewer.trackedEntity = viewer.entities.getById("vehicle");

// Customize default tracking offset
import { Camera, HeadingPitchRange, Math as CesiumMath } from "cesium";
Camera.DEFAULT_OFFSET = new HeadingPitchRange(
  CesiumMath.toRadians(90.0), CesiumMath.toRadians(-25.0), 500.0,
);

viewer.trackedEntity = undefined; // stop tracking
```

`EntityView` is the internal class that implements tracking. It computes a
VVLH (velocity-based) or ENU reference frame depending on entity speed.

---

## DebugCameraPrimitive

Visualize a camera frustum for debugging or multi-camera setups.

```js
viewer.scene.primitives.add(new Cesium.DebugCameraPrimitive({
  camera: viewer.camera,
  color: Cesium.Color.YELLOW,
  updateOnChange: true,
}));
```

---

## Performance Tips

1. **Prefer `setView` over `flyTo` with `duration: 0`** -- direct assignment
   avoids tween overhead.
2. **Avoid reading `heading`/`pitch`/`roll` every frame** -- each computes an
   ENU transform. Cache or use `direction`/`up` vectors instead.
3. **Throttle `changed` events** -- raise `percentageChanged` (e.g., 0.5) to
   reduce listener frequency.
4. **Always release `lookAt` locks** -- call
   `lookAtTransform(Matrix4.IDENTITY)` or user interaction stays disabled.
5. **Set `maximumHeight` for short flights** -- prevents the camera from
   zooming to space on nearby targets.
6. **Scale movement to altitude** -- divide camera height for natural speed
   in per-frame move loops.
7. **Re-enable collision after underground views** -- set
   `enableCollisionDetection` back to `true` once done.

---

## See Also

- **cesiumjs-spatial-math** -- Cartesian3, Cartographic, Matrix4, Transforms, coordinate conversions
- **cesiumjs-interaction** -- ScreenSpaceEventHandler, Scene.pick, mouse/touch events
- **cesiumjs-entities** -- Entity, trackedEntity, EntityCollection, data sources
