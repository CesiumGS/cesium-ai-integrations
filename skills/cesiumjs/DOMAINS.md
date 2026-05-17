# CesiumJS Skills Domain Mapping

> **Version baseline:** CesiumJS v1.139.1 (2026-03-05)
> **Last updated:** 2026-03-24
> **Total public symbols assigned:** ~535

This document is the definitive source of truth for the CesiumJS skill decomposition. Every public class, function, and enum in CesiumJS is assigned to exactly one domain. Other domains may cross-reference a symbol, but only one domain **owns** it.

## Relationship to cesium-context7

These baked-in skills and `cesium-context7` are **independent and complementary**:

| | Baked-in Skills (`cesiumjs-*`) | Context7 (`cesium-context7`) |
|---|---|---|
| **Latency** | Instant — no network call | Requires MCP round-trip |
| **Availability** | Always — no MCP required | Requires Context7 MCP server |
| **Content** | Curated patterns, examples, best practices | Full official docs, version-specific |
| **Best for** | Common patterns, Quick Starts, "how do I..." | Version-pinned API signatures, cutting-edge features |
| **Activation** | Passive via description matching | Explicit via `query-docs` tool call |

Both can activate simultaneously. Use baked-in skills for patterns and recipes; use Context7 to validate against a specific CesiumJS version.

---

---

## Domain Summary

| # | Skill Name | Entries | Description (passive activation) |
|---|-----------|---------|----------------------------------|
| 9 | `cesiumjs-time-properties` | ~57 | CesiumJS time, properties, and animation - Clock, JulianDate, TimeInterval, Property, SampledProperty, CallbackProperty, interpolation, splines, CZML temporal data. Use when making entity attributes time-dynamic, configuring the simulation clock, interpolating positions over time, or working with sampled or callback properties. |
| 10 | `cesiumjs-spatial-math` | ~55 | CesiumJS spatial math - Cartesian3, Cartographic, Matrix4, Quaternion, Transforms, Ellipsoid, BoundingSphere, projections, coordinate conversions. Use when converting between coordinate systems, computing positions on the ellipsoid, performing spatial intersection tests, building model matrices, or working with geographic projections. |
| 13 | `cesiumjs-core-utilities` | ~46 | CesiumJS core utilities and networking - Resource, Color, Event, Request, RequestScheduler, error handling, helper functions, feature detection. Use when fetching remote data, managing HTTP requests, working with colors, handling events, debugging errors, or using utility functions like defined, clone, or buildModuleUrl. |

---

## Domain 10: cesiumjs-spatial-math (~55 entries)

### Vectors and Points
- Cartesian2
- Cartesian3
- Cartesian4
- Cartographic
- Spherical

### Matrices
- Matrix2
- Matrix3
- Matrix4

### Rotation/Orientation
- Quaternion
- HeadingPitchRoll

### Transforms
- Transforms
- SceneTransforms
- TranslationRotationScale

### Ellipsoid and Geodesy
- Ellipsoid
- EllipsoidGeodesic
- EllipsoidRhumbLine
- EllipsoidTangentPlane

### Bounding Volumes
- BoundingRectangle
- BoundingSphere
- AxisAlignedBoundingBox
- OrientedBoundingBox
- CullingVolume

### Geometric Primitives
- Plane
- Ray
- Rectangle
- NearFarScalar
- Interval
- Occluder

### Projections and Tiling
- GeographicProjection
- GeographicTilingScheme
- MapProjection (interface)
- WebMercatorProjection
- WebMercatorTilingScheme
- TilingScheme (interface)

### Frustums
- PerspectiveFrustum
- PerspectiveOffCenterFrustum
- OrthographicFrustum
- OrthographicOffCenterFrustum

### Intersections
- IntersectionTests
- Intersections2D

### Math Utilities
- Math (CesiumMath)

### Polynomial Solvers
- CubicRealPolynomial
- QuadraticRealPolynomial
- QuarticRealPolynomial
- TridiagonalSystemSolver

### Specialized
- HilbertOrder
- Simon1994PlanetaryPositions
- Stereographic

### Enums
- Axis
- Intersect
- Visibility
- ComponentDatatype
- IndexDatatype

---

## Domain 13: cesiumjs-core-utilities (~46 entries)

### Networking
- Resource
- Request
- RequestScheduler
- RequestErrorEvent
- DefaultProxy
- Proxy (interface)
- TrustedServers

### Worker Processing
- TaskProcessor

### Color and Display
- Color
- DistanceDisplayCondition
- PinBuilder

### Events
- Event
- EventHelper

### Error Types
- DeveloperError
- RuntimeError

### Data Structures
- AssociativeArray
- Queue

### Detection and State
- FeatureDetection
- Fullscreen
- Frozen

### Global Functions
- defined
- clone
- combine
- createGuid
- buildModuleUrl
- formatError
- destroyObject
- getAbsoluteUri
- getBaseUri
- getExtensionFromUri
- getFilenameFromUri
- getImagePixels
- getTimestamp
- isLeapYear
- mergeSort
- objectToQuery
- queryToObject
- binarySearch
- subdivideArray
- writeTextToCanvas
- srgbToLinear (cross-ref from Domain 8)
- barycentricCoordinates
- pointInsideTriangle

### Enums
- RequestState
- RequestType
- PixelDatatype
- PixelFormat
- WebGLConstants

### Notes
- `defaultValue` was removed in v1.134 — use `??` operator instead
- `Frozen.EMPTY_OBJECT` and `Frozen.EMPTY_ARRAY` replace `defaultValue.EMPTY_OBJECT` (v1.128)

---

## Domain 9: cesiumjs-time-properties (~57 entries)

### Time Core
- Clock
- JulianDate
- GregorianDate
- TimeInterval
- TimeIntervalCollection
- LeapSecond
- Iso8601

### Property Interfaces
- Property
- PositionProperty
- MaterialProperty

### Value Properties
- ConstantProperty
- ConstantPositionProperty
- SampledProperty
- SampledPositionProperty
- CallbackProperty
- CallbackPositionProperty
- CompositeProperty
- CompositePositionProperty
- CompositeMaterialProperty
- ReferenceProperty
- TimeIntervalCollectionProperty
- TimeIntervalCollectionPositionProperty
- PropertyArray
- PositionPropertyArray
- PropertyBag
- NodeTransformationProperty

### Velocity Properties
- VelocityOrientationProperty
- VelocityVectorProperty

### Material Properties
- ColorMaterialProperty
- ImageMaterialProperty
- GridMaterialProperty
- StripeMaterialProperty
- CheckerboardMaterialProperty
- PolylineArrowMaterialProperty
- PolylineDashMaterialProperty
- PolylineGlowMaterialProperty
- PolylineOutlineMaterialProperty

### Splines
- Spline (base)
- CatmullRomSpline
- HermiteSpline
- LinearSpline
- QuaternionSpline
- ConstantSpline
- SteppedSpline
- MorphWeightSpline

### Interpolation
- HermitePolynomialApproximation
- LagrangePolynomialApproximation
- LinearApproximation
- PackableForInterpolation

### Animation Helpers
- EasingFunction
- VideoSynchronizer

### Enums
- ClockRange
- ClockStep
- TimeStandard
- ExtrapolationType
- TrackingReferenceFrame
- ReferenceFrame

### Design Decision
> Properties live here (not with Entities) because they are the temporal data-binding layer. SampledProperty and CallbackProperty are meaningless without Clock/JulianDate. MaterialProperties (ColorMaterialProperty, etc.) are Property subclasses that vary over time. The `Material` class (Fabric system for Primitives) belongs in cesiumjs-materials-shaders.

---

## Cross-Cutting Ownership Rules

These rules prevent activation collisions (multiple skills triggering for the same prompt):

| Concept | Primary Domain | Cross-Referenced In | Rule |
|---------|---------------|--------------------|----|
| `*Graphics` classes | 3 (entities) | 7 (primitives) | Entity API = `*Graphics`; Primitive API = `*Geometry` |
| `*Geometry` classes | 7 (primitives) | 3 (entities) | Same boundary, other direction |
| CustomShader | 8 (materials-shaders) | 4 (3d-tiles), 12 (models) | Shader authoring is distinct from model/tileset loading |
| ImageBasedLighting | 8 (materials-shaders) | 4 (3d-tiles), 12 (models) | PBR lighting is a rendering concept |
| ClippingPlane/Polygon | 4 (3d-tiles) | 6 (terrain-env), 12 (models) | Most common use is 3D Tiles clipping |
| Material (Fabric) | 8 (materials-shaders) | 7 (primitives) | Primitives consume Materials via Appearances |
| Material*Property | 9 (time-properties) | 3 (entities) | Property subclasses (temporal) vs Material class (Fabric) |
| Ion/IonResource | 1 (viewer-setup) | 5 (imagery) | Setup-time config vs provider usage |
| createOsmBuildingsAsync | 1 (viewer-setup) | 4 (3d-tiles) | Factory helper vs tileset config |
| EntityView | 2 (camera) | 3 (entities) | Camera tracking = camera concern |
| ShadowMap | 6 (terrain-env) | 8 (materials-shaders) | Scene-level rendering config |
| SceneTransforms | 10 (spatial-math) | 1 (viewer-setup) | Coordinate transform utility |

---

## Recently Added APIs (v1.120-v1.139)

| Version | Addition | Domain |
|---------|----------|--------|
| v1.122 | CallbackPositionProperty | 9 |
| v1.123 | maximumTiltAngle (Camera) | 2 |
| v1.124 | TrackingReferenceFrame, Entity.trackingReferenceFrame | 9, 3 |
| v1.124 | ITwinPlatform | 1 |
| v1.128 | ITwinData, Frozen | 1, 13 |
| v1.128 | Frozen.EMPTY_OBJECT, Frozen.EMPTY_ARRAY | 13 |
| v1.133 | Ellipsoid.MARS | 10 |
| v1.134 | Google2DImageryProvider | 5 |
| v1.134 | `defaultValue` removed (use `??`) | 13 |
| v1.135 | Cesium3DTilesTerrainProvider (experimental) | 4 |
| v1.136 | Scene.pickAsync | 11 |
| v1.139 | EquirectangularPanorama | 6 |
| v1.139 | CubeMapPanorama | 6 |
| v1.139 | GoogleStreetViewCubeMapPanoramaProvider | 6 |



## Skill File See Also Cross-References

| Skill | See Also |
|-------|----------|
| cesiumjs-viewer-setup | camera, entities, imagery, terrain-environment |
| cesiumjs-camera | spatial-math, interaction, entities |
| cesiumjs-entities | time-properties, primitives, interaction |
| cesiumjs-3d-tiles | materials-shaders, interaction, terrain-environment |
| cesiumjs-imagery | viewer-setup, terrain-environment |
| cesiumjs-terrain-environment | viewer-setup, imagery, spatial-math |
| cesiumjs-primitives | entities, materials-shaders, spatial-math |
| cesiumjs-materials-shaders | primitives, 3d-tiles, models-particles |
| cesiumjs-time-properties | entities, viewer-setup, models-particles |
| cesiumjs-spatial-math | camera, primitives, terrain-environment |
| cesiumjs-interaction | entities, 3d-tiles, camera |
| cesiumjs-models-particles | materials-shaders, entities, 3d-tiles |
| cesiumjs-core-utilities | viewer-setup, imagery, entities |
