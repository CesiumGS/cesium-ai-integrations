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

## Domain Summary

| # | Skill Name | Entries | Description (passive activation) |
|---|-----------|---------|----------------------------------|
| 1 | `cesiumjs-viewer-setup` | ~70 | CesiumJS viewer setup - Viewer, CesiumWidget, widgets, Ion token, Scene configuration, SceneMode, factory helpers, geocoders, platform services. Use when initializing a CesiumJS application, configuring viewer widgets, setting Ion access tokens, creating default terrain or imagery, or bootstrapping a 3D globe. |
| 2 | `cesiumjs-camera` | ~10 | CesiumJS camera control - Camera, flyTo, lookAt, setView, ScreenSpaceCameraController, CameraEventAggregator, flight animation. Use when positioning the camera, creating flyTo animations, constraining user navigation, tracking entities, or converting between screen and world coordinates. |
| 3 | `cesiumjs-entities` | ~60 | CesiumJS entities and data sources - Entity, EntityCollection, DataSource, GeoJsonDataSource, KmlDataSource, CzmlDataSource, Graphics types, Visualizers. Use when adding points, labels, models, polygons, or polylines to the map, loading GeoJSON/KML/CZML/GPX data, or working with the high-level Entity API. |
| 4 | `cesiumjs-3d-tiles` | ~45 | CesiumJS 3D Tiles - Cesium3DTileset, styling, metadata, feature picking, voxels, point clouds, I3S, Gaussian splats, clipping planes and polygons. Use when loading 3D Tiles tilesets, styling building features, querying metadata properties, working with voxels or point clouds, or clipping spatial data. |
| 5 | `cesiumjs-imagery` | ~30 | CesiumJS imagery layers - ImageryProvider, ImageryLayer, ImageryLayerCollection, WMS, WMTS, Bing, OpenStreetMap, ArcGIS, Mapbox, tile discard policies. Use when adding or swapping base map layers, configuring imagery providers, layering multiple map sources, or creating split-screen imagery comparisons. |
| 6 | `cesiumjs-terrain-environment` | ~35 | CesiumJS terrain, globe, and environment - TerrainProvider, Globe, sampleTerrain, atmosphere, sky, fog, lighting, shadows, panoramas. Use when configuring terrain providers, querying terrain heights, customizing atmosphere or sky rendering, adding panoramas, or adjusting scene lighting and shadows. |
| 7 | `cesiumjs-primitives` | ~72 | CesiumJS primitives and geometry - Primitive, GeometryInstance, Appearance, Billboard/Label/PointPrimitive collections, built-in geometry shapes, ground primitives, classification. Use when rendering performance-critical static geometry, creating custom shapes, batching draw calls, or using low-level billboard, label, and point collections. |
| 8 | `cesiumjs-materials-shaders` | ~27 | CesiumJS materials, shaders, and post-processing - Material, Fabric JSON, CustomShader, GLSL, PostProcessStage, PostProcessStageLibrary, bloom, depth of field, tonemapping. Use when defining custom materials, writing GLSL shaders for models or tilesets, adding screen-space post-processing effects, or configuring the visual rendering pipeline. |
| 9 | `cesiumjs-time-properties` | ~57 | CesiumJS time, properties, and animation - Clock, JulianDate, TimeInterval, Property, SampledProperty, CallbackProperty, interpolation, splines, CZML temporal data. Use when making entity attributes time-dynamic, configuring the simulation clock, interpolating positions over time, or working with sampled or callback properties. |
| 10 | `cesiumjs-spatial-math` | ~55 | CesiumJS spatial math - Cartesian3, Cartographic, Matrix4, Quaternion, Transforms, Ellipsoid, BoundingSphere, projections, coordinate conversions. Use when converting between coordinate systems, computing positions on the ellipsoid, performing spatial intersection tests, building model matrices, or working with geographic projections. |
| 11 | `cesiumjs-interaction` | ~8 | CesiumJS interaction and picking - ScreenSpaceEventHandler, Scene.pick, Scene.drillPick, Scene.pickPosition, mouse and touch events. Use when handling user clicks on the globe, selecting entities or 3D Tiles features, implementing hover effects, or building drag-based interactions. |
| 12 | `cesiumjs-models-particles` | ~20 | CesiumJS models, glTF, and particle effects - Model, ModelAnimation, ModelNode, ParticleSystem, emitters, GPM extensions. Use when loading glTF/GLB 3D models, playing model animations, positioning particle effects like fire or smoke, or working with geospatial positioning metadata. |
| 13 | `cesiumjs-core-utilities` | ~46 | CesiumJS core utilities and networking - Resource, Color, Event, Request, RequestScheduler, error handling, helper functions, feature detection. Use when fetching remote data, managing HTTP requests, working with colors, handling events, debugging errors, or using utility functions like defined, clone, or buildModuleUrl. |

---

## Domain 1: cesiumjs-viewer-setup (~70 entries)

### Core Initialization
- Viewer
- CesiumWidget
- Scene

### Platform Configuration
- Ion
- IonResource
- GoogleMaps
- ITwinPlatform
- ITwinData

### Widgets
- Animation
- BaseLayerPicker
- Cesium3DTilesInspector
- CesiumInspector
- FullscreenButton
- Geocoder
- HomeButton
- I3SBuildingSceneLayerExplorer
- InfoBox
- NavigationHelpButton
- PerformanceWatchdog
- ProjectionPicker
- SceneModePicker
- SelectionIndicator
- Timeline
- VoxelInspector
- VRButton
- SvgPathBindingHandler

### ViewModels
- AnimationViewModel
- BaseLayerPickerViewModel
- Cesium3DTilesInspectorViewModel
- CesiumInspectorViewModel
- ClockViewModel
- FullscreenButtonViewModel
- GeocoderViewModel
- HomeButtonViewModel
- I3sBslExplorerViewModel
- InfoBoxViewModel
- NavigationHelpButtonViewModel
- PerformanceWatchdogViewModel
- ProjectionPickerViewModel
- ProviderViewModel
- SceneModePickerViewModel
- SelectionIndicatorViewModel
- ToggleButtonViewModel
- VoxelInspectorViewModel
- VRButtonViewModel

### Widget Infrastructure
- Command
- createCommand

### Viewer Mixins
- viewerCesium3DTilesInspectorMixin
- viewerCesiumInspectorMixin
- viewerDragDropMixin
- viewerPerformanceWatchdogMixin
- viewerVoxelInspectorMixin

### Geocoder Services
- GeocoderService (interface)
- BingMapsGeocoderService
- CartographicGeocoderService
- GoogleGeocoderService
- IonGeocoderService
- OpenCageGeocoderService
- PeliasGeocoderService

### Factory Helpers
- createWorldImageryAsync
- createWorldTerrainAsync
- createWorldBathymetryAsync
- createGooglePhotorealistic3DTileset
- createOsmBuildingsAsync

### Credits
- Credit
- CreditDisplay
- FrameRateMonitor

### Enums
- SceneMode
- MapMode2D
- GeocodeType
- IonGeocodeProviderType
- IonWorldImageryStyle

---

## Domain 2: cesiumjs-camera (~10 entries)

### Core
- Camera
- CameraEventAggregator
- ScreenSpaceCameraController
- EntityView

### Debug
- DebugCameraPrimitive

### Types
- HeadingPitchRange

### Enums
- CameraEventType
- KeyboardEventModifier

### Key Methods (documented as patterns)
- Camera.flyTo
- Camera.lookAt
- Camera.setView
- Camera.flyHome
- Camera.flyToBoundingSphere
- Camera.viewBoundingSphere
- Camera.lookAtTransform
- Camera.move / moveForward / moveBackward / moveUp / moveDown / moveLeft / moveRight
- Camera.zoomIn / zoomOut
- Camera.rotate / rotateUp / rotateDown / rotateLeft / rotateRight
- Camera.lookUp / lookDown / lookLeft / lookRight
- ScreenSpaceCameraController.enableTilt / enableZoom / enableRotate
- ScreenSpaceCameraController.minimumZoomDistance / maximumZoomDistance
- ScreenSpaceCameraController.maximumTiltAngle

---

## Domain 3: cesiumjs-entities (~60 entries)

### Entity Core
- Entity
- EntityCollection
- EntityCluster
- CompositeEntityCollection

### Graphics Types (17)
- BillboardGraphics
- BoxGraphics
- Cesium3DTilesetGraphics
- CorridorGraphics
- CylinderGraphics
- EllipseGraphics
- EllipsoidGraphics
- LabelGraphics
- ModelGraphics
- PathGraphics
- PlaneGraphics
- PointGraphics
- PolygonGraphics
- PolylineGraphics
- PolylineVolumeGraphics
- RectangleGraphics
- WallGraphics

### DataSources
- DataSource (interface)
- CustomDataSource
- CzmlDataSource
- GeoJsonDataSource
- GpxDataSource
- KmlDataSource

### DataSource Infrastructure
- DataSourceClock
- DataSourceCollection
- DataSourceDisplay

### KML Helpers
- KmlCamera
- KmlFeatureData
- KmlLookAt
- KmlTour
- KmlTourFlyTo
- KmlTourWait

### Visualizers
- Visualizer (interface)
- BillboardVisualizer
- Cesium3DTilesetVisualizer
- GeometryVisualizer
- LabelVisualizer
- ModelVisualizer
- PathVisualizer
- PointVisualizer
- PolylineVisualizer

### GeometryUpdaters
- GeometryUpdater (base)
- GroundGeometryUpdater
- BoxGeometryUpdater
- CorridorGeometryUpdater
- CylinderGeometryUpdater
- EllipseGeometryUpdater
- EllipsoidGeometryUpdater
- PlaneGeometryUpdater
- PolygonGeometryUpdater
- PolylineGeometryUpdater
- PolylineVolumeGeometryUpdater
- RectangleGeometryUpdater
- WallGeometryUpdater

### Functions
- exportKml

### Enums
- HeightReference
- HorizontalOrigin
- VerticalOrigin
- LabelStyle
- ColorBlendMode
- ShadowMode

### Ownership Rule
> `*Graphics` classes belong here. `*Geometry` classes belong in cesiumjs-primitives. This is the Entity API vs Primitive API divide.

---

## Domain 4: cesiumjs-3d-tiles (~45 entries)

### 3D Tiles Core
- Cesium3DTileset
- Cesium3DTile
- Cesium3DTileContent
- Cesium3DTileFeature
- Cesium3DTilePointFeature
- Cesium3DTileStyle

### Style Expressions
- ConditionsExpression
- Expression
- StyleExpression

### Voxels
- VoxelPrimitive
- VoxelProvider (interface)
- Cesium3DTilesVoxelProvider
- VoxelContent
- VoxelCell
- VoxelShapeType (enum)

### Metadata
- MetadataClass
- MetadataClassProperty
- MetadataEnum
- MetadataEnumValue
- MetadataSchema
- PickedMetadataInfo
- MetadataComponentType (enum)
- MetadataType (enum)

### I3S
- I3SDataProvider
- I3SFeature
- I3SField
- I3SGeometry
- I3SLayer
- I3SNode
- I3SStatistics
- I3SSublayer
- I3SSymbology

### Clipping
- ClippingPlane
- ClippingPlaneCollection
- ClippingPolygon
- ClippingPolygonCollection

### Specialized Content
- GaussianSplat3DTileContent
- TimeDynamicPointCloud

### Terrain Bridge (experimental)
- Cesium3DTilesTerrainData
- Cesium3DTilesTerrainProvider

### Rendering Config
- PointCloudShading
- Cesium3DTileColorBlendMode (enum)

### Enums
- ClassificationType

---

## Domain 5: cesiumjs-imagery (~30 entries)

### Core
- ImageryProvider (interface)
- ImageryLayer
- ImageryLayerCollection
- ImageryLayerFeatureInfo

### Providers (17)
- ArcGisMapServerImageryProvider
- ArcGisMapService
- BingMapsImageryProvider
- Google2DImageryProvider
- GoogleEarthEnterpriseImageryProvider
- GoogleEarthEnterpriseMapsProvider
- GridImageryProvider
- IonImageryProvider
- MapboxImageryProvider
- MapboxStyleImageryProvider
- OpenStreetMapImageryProvider
- SingleTileImageryProvider
- TileCoordinatesImageryProvider
- TileMapServiceImageryProvider
- UrlTemplateImageryProvider
- WebMapServiceImageryProvider
- WebMapTileServiceImageryProvider

### Utilities
- TimeDynamicImagery
- GetFeatureInfoFormat
- GoogleEarthEnterpriseMetadata

### Discard Policies
- DiscardEmptyTileImagePolicy
- DiscardMissingTileImagePolicy
- NeverTileDiscardPolicy

### Enums
- ArcGisBaseMapType
- BingMapsStyle
- SplitDirection

---

## Domain 6: cesiumjs-terrain-environment (~35 entries)

### Terrain Core
- TerrainProvider (interface)
- TerrainData (interface)
- Terrain (helper)

### Terrain Providers
- ArcGISTiledElevationTerrainProvider
- CesiumTerrainProvider
- CustomHeightmapTerrainProvider
- EllipsoidTerrainProvider
- GoogleEarthEnterpriseTerrainProvider
- VRTheWorldTerrainProvider

### Terrain Data
- GoogleEarthEnterpriseTerrainData
- HeightmapTerrainData
- QuantizedMeshTerrainData

### Terrain Utilities
- sampleTerrain
- sampleTerrainMostDetailed
- TileAvailability

### Globe
- Globe
- GlobeTranslucency

### Atmosphere and Sky
- SkyBox
- SkyAtmosphere
- Atmosphere
- Fog
- DynamicEnvironmentMapManager

### Celestial Bodies
- Sun
- Moon

### Lighting
- SunLight
- DirectionalLight
- Light (interface)
- ShadowMap

### Panoramas
- Panorama (interface)
- PanoramaProvider (interface)
- EquirectangularPanorama
- CubeMapPanorama
- GoogleStreetViewCubeMapPanoramaProvider

### Functions
- createElevationBandMaterial

### Enums
- DynamicAtmosphereLightingType
- HeightmapEncoding
- ShadowMode (cross-ref from Domain 3)

---

## Domain 7: cesiumjs-primitives (~72 entries)

### Primitives
- Primitive
- PrimitiveCollection
- ClassificationPrimitive
- GroundPrimitive
- GroundPolylinePrimitive

### Geometry Infrastructure
- Geometry
- GeometryAttribute
- GeometryAttributes
- GeometryFactory
- GeometryInstance
- GeometryInstanceAttribute
- GeometryPipeline
- VertexFormat

### Geometry Types (31)
- BoxGeometry / BoxOutlineGeometry
- CircleGeometry / CircleOutlineGeometry
- CoplanarPolygonGeometry / CoplanarPolygonOutlineGeometry
- CorridorGeometry / CorridorOutlineGeometry
- CylinderGeometry / CylinderOutlineGeometry
- EllipseGeometry / EllipseOutlineGeometry
- EllipsoidGeometry / EllipsoidOutlineGeometry
- FrustumGeometry / FrustumOutlineGeometry
- GroundPolylineGeometry
- PlaneGeometry / PlaneOutlineGeometry
- PolygonGeometry / PolygonOutlineGeometry
- PolylineGeometry
- PolylineVolumeGeometry / PolylineVolumeOutlineGeometry
- RectangleGeometry / RectangleOutlineGeometry
- SimplePolylineGeometry
- SphereGeometry / SphereOutlineGeometry
- WallGeometry / WallOutlineGeometry

### Helper
- PolygonHierarchy

### Appearances
- Appearance
- DebugAppearance
- EllipsoidSurfaceAppearance
- MaterialAppearance
- PerInstanceColorAppearance
- PolylineColorAppearance
- PolylineMaterialAppearance

### Instance Attributes
- ColorGeometryInstanceAttribute
- DistanceDisplayConditionGeometryInstanceAttribute
- ShowGeometryInstanceAttribute

### Primitive Collections
- BillboardCollection
- LabelCollection
- PolylineCollection
- PointPrimitiveCollection
- CloudCollection

### Primitive Items
- Billboard
- Label
- Polyline
- PointPrimitive
- CumulusCloud

### Debug
- DebugModelMatrixPrimitive
- ViewportQuad

### Functions
- createTangentSpaceDebugPrimitive

### Enums
- ArcType
- CornerType
- PrimitiveType
- CloudType
- StripeOrientation
- WindingOrder

---

## Domain 8: cesiumjs-materials-shaders (~27 entries)

### Material System
- Material
- MaterialSupport

### Custom Shaders
- CustomShader
- TextureUniform
- ImageBasedLighting

### Post-Processing
- PostProcessStage
- PostProcessStageCollection
- PostProcessStageComposite
- PostProcessStageLibrary

### Shader/Render Enums
- CustomShaderMode
- CustomShaderTranslucencyMode
- LightingModel
- UniformType
- VaryingType
- PostProcessStageSampleMode
- Tonemapper
- BlendEquation
- BlendFunction
- BlendOption
- CullFace
- DepthFunction
- StencilFunction
- StencilOperation

### Rendering State
- BlendingState

### Texture Config
- CompressedTextureBuffer
- TextureMagnificationFilter
- TextureMinificationFilter

### Functions
- createElevationBandMaterial (cross-ref from Domain 6)
- srgbToLinear

### Ownership Rules
> **CustomShader:** Primary home. Applied to `Model.customShader` and `Cesium3DTileset.customShader`, but shader authoring is a distinct skill.
> **ImageBasedLighting:** Primary home. Used by `Model.imageBasedLighting` and `Cesium3DTileset.imageBasedLighting`.

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

## Domain 11: cesiumjs-interaction (~8 entries)

### Event Handling
- ScreenSpaceEventHandler
- ScreenSpaceEventType (enum)

### Functions
- addDrillPickedResults
- computePickingDrawingBufferRectangle

### Scene Picking Methods (documented as patterns)
- Scene.pick()
- Scene.drillPick()
- Scene.pickPosition()
- Scene.pickVoxel()
- Scene.pickAsync()

### Types Returned by Picking (cross-refs)
- Cesium3DTileFeature (Domain 4)
- ModelFeature (Domain 12)
- Entity (Domain 3)
- PickedMetadataInfo (Domain 4)

### Key Patterns to Document
- Entity selection with click handler
- 3D Tiles feature picking and property inspection
- Terrain position picking (lon/lat/height from click)
- Multi-pick with drillPick
- Hover highlighting with mousemove
- Drag-based drawing and measurement
- Coordinate readout on click
- Conditional behavior based on picked object type

---

## Domain 12: cesiumjs-models-particles (~20 entries)

### Model Core
- Model
- ModelAnimation
- ModelAnimationCollection
- ModelFeature
- ModelNode

### Particle System
- ParticleSystem
- Particle
- ParticleBurst
- ParticleEmitter (base)
- BoxEmitter
- CircleEmitter
- ConeEmitter
- SphereEmitter

### GPM Extension
- AnchorPointDirect
- AnchorPointIndirect
- CorrelationGroup
- GltfGpmLocal
- Spdcf

### Enums
- ModelAnimationLoop

### Cross-References
- CustomShader (primary: Domain 8)
- ImageBasedLighting (primary: Domain 8)
- ClippingPlane/ClippingPolygon (primary: Domain 4)
- ModelGraphics (primary: Domain 3)

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

---

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
