---
name: cesiumjs-materials-shaders
description: "CesiumJS materials, shaders, and post-processing - Material, Fabric JSON, CustomShader, GLSL, PostProcessStage, PostProcessStageLibrary, bloom, depth of field, tonemapping. Use when defining custom materials, writing GLSL shaders for models or tilesets, adding screen-space post-processing effects, or configuring the visual rendering pipeline."
---
# CesiumJS Materials, Shaders & Post-Processing

Version baseline: CesiumJS 1.139 (March 2026). All imports use ES module style.

## Material System (Fabric JSON)

`Material` defines surface appearance for **Primitives** through a JSON schema called Fabric. Materials compile to GLSL and are consumed by `MaterialAppearance` or `PolylineMaterialAppearance`.

### Built-in Material Types

**Surface:** `Color` (color), `Image` (image, repeat), `DiffuseMap`, `AlphaMap`, `SpecularMap`, `EmissionMap` (image, channel(s), repeat), `BumpMap`, `NormalMap` (image, channel(s), strength, repeat).

**Patterns:** `Grid` (color, cellAlpha, lineCount, lineThickness), `Stripe` (evenColor, oddColor, repeat), `Checkerboard` (lightColor, darkColor, repeat), `Dot` (lightColor, darkColor, repeat).

**Effects:** `Water` (baseWaterColor, normalMap, frequency, animationSpeed), `RimLighting` (color, rimColor, width), `Fade` (fadeInColor, fadeOutColor, maximumDistance).

**Terrain:** `ElevationContour` (color, spacing, width), `ElevationRamp` (image, minimumHeight, maximumHeight).

**Polyline:** `PolylineArrow` (color), `PolylineDash` (color, gapColor, dashLength, dashPattern), `PolylineGlow` (color, glowPower, taperPower), `PolylineOutline` (color, outlineColor, outlineWidth).

### Creating Materials

```js
import { Material, Color, Cartesian2 } from "cesium";

// Shorthand with fromType (preferred for built-in types)
const colorMat = Material.fromType("Color", { color: new Color(1.0, 0.0, 0.0, 0.5) });

// Full Fabric notation
const gridMat = new Material({
  fabric: {
    type: "Grid",
    uniforms: { color: Color.GREEN, cellAlpha: 0.1, lineCount: new Cartesian2(8, 8) },
  },
});

// Async loading -- awaits textures before first frame, no flicker
const imageMat = await Material.fromTypeAsync("Image", { image: "./textures/facade.png" });
```

### Custom Fabric with GLSL Source

Use `source` for inline GLSL. Uniforms declared in `uniforms` are available by name in the shader.

```js
import { Material, Color } from "cesium";

const pulseMaterial = new Material({
  fabric: {
    uniforms: { color: Color.CYAN, speed: 2.0 },
    source: `czm_material czm_getMaterial(czm_materialInput materialInput) {
      czm_material material = czm_getDefaultMaterial(materialInput);
      float pulse = sin(czm_frameNumber * speed * 0.01) * 0.5 + 0.5;
      material.diffuse = color.rgb;
      material.alpha = color.a * pulse;
      return material;
    }`,
  },
  translucent: true,
});
```

### Applying Materials to Primitives

```js
import { Primitive, GeometryInstance, RectangleGeometry, Rectangle,
  MaterialAppearance, Material, Color, Cartesian2 } from "cesium";

viewer.scene.primitives.add(new Primitive({
  geometryInstances: new GeometryInstance({
    geometry: new RectangleGeometry({ rectangle: Rectangle.fromDegrees(-100, 30, -90, 40) }),
  }),
  appearance: new MaterialAppearance({
    material: Material.fromType("Checkerboard", {
      lightColor: Color.WHITE, darkColor: Color.BLACK, repeat: new Cartesian2(4, 4),
    }),
  }),
}));
```

### Compositing Sub-Materials (Fabric `materials` + `components`)

```js
import { Material, Color } from "cesium";

const compositeMat = new Material({ fabric: {
  materials: {
    gridMaterial: { type: "Grid" },
    colorMaterial: { type: "Color", uniforms: { color: Color.BLUE } },
  },
  components: {
    diffuse: "gridMaterial.diffuse + 0.2 * colorMaterial.diffuse",
    alpha: "min(gridMaterial.alpha, colorMaterial.alpha)",
  },
}});
```

## CustomShader (Models and 3D Tiles)

`CustomShader` injects user GLSL into `Model` and `Cesium3DTileset` rendering. It provides access to vertex attributes, feature IDs, and metadata.

### Enums

- **CustomShaderMode:** `MODIFY_MATERIAL` (default -- modifies before lighting), `REPLACE_MATERIAL` (replaces material stage)
- **LightingModel:** `UNLIT` (skip lighting), `PBR` (physically-based with IBL)
- **CustomShaderTranslucencyMode:** `INHERIT` (default), `OPAQUE`, `TRANSLUCENT`
- **UniformType:** `FLOAT`, `VEC2`, `VEC3`, `VEC4`, `INT`, `INT_VEC2`..`INT_VEC4`, `BOOL`, `MAT2`, `MAT3`, `MAT4`, `SAMPLER_2D`
- **VaryingType:** `FLOAT`, `VEC2`, `VEC3`, `VEC4`, `MAT2`, `MAT3`, `MAT4`

### Shader Signatures

Vertex: `void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput)`
Fragment: `void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)`

Available struct fields:
- `vsInput.attributes` / `fsInput.attributes`: `positionMC`, `normalMC`, `texCoord_0`, `color_0`
- `vsOutput.positionMC`: writable model-space position
- `fsInput.featureIds.featureId_0`, `fsInput.metadata.*` (3D Tiles metadata)
- `material.diffuse` (vec3), `.alpha`, `.normal` (vec3), `.specular`, `.roughness`, `.emissive` (vec3), `.occlusion`

### Basic CustomShader on a Model

```js
import { CustomShader, CustomShaderMode, LightingModel, UniformType, Cartesian3 } from "cesium";

const shader = new CustomShader({
  mode: CustomShaderMode.MODIFY_MATERIAL,
  lightingModel: LightingModel.PBR,
  uniforms: {
    u_highlightColor: { type: UniformType.VEC3, value: new Cartesian3(1.0, 0.843, 0.0) },
  },
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      material.diffuse = mix(material.diffuse, u_highlightColor, 0.3);
    }
  `,
});

const model = await Cesium.Model.fromGltfAsync({ url: "./building.glb", customShader: shader });
viewer.scene.primitives.add(model);
```

### CustomShader with TextureUniform

```js
import { CustomShader, UniformType, TextureUniform, LightingModel } from "cesium";

const detailShader = new CustomShader({
  lightingModel: LightingModel.PBR,
  uniforms: {
    u_detailTex: {
      type: UniformType.SAMPLER_2D,
      value: new TextureUniform({ url: "./detail_normal.png", repeat: true }),
    },
    u_strength: { type: UniformType.FLOAT, value: 0.5 },
  },
  fragmentShaderText: `void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
    vec3 dn = texture(u_detailTex, fsInput.attributes.texCoord_0 * 10.0).rgb * 2.0 - 1.0;
    material.normal = normalize(material.normal + dn * u_strength);
  }`,
});
```

### Vertex Displacement with Varyings

```js
import { CustomShader, UniformType, VaryingType } from "cesium";

const waveShader = new CustomShader({
  uniforms: { u_amp: { type: UniformType.FLOAT, value: 5.0 } },
  varyings: { v_disp: VaryingType.FLOAT },
  vertexShaderText: `void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
    float d = sin(vsInput.attributes.positionMC.x * 0.1 + czm_frameNumber * 0.05) * u_amp;
    vsOutput.positionMC += vsInput.attributes.normalMC * d;
    v_disp = d;
  }`,
  fragmentShaderText: `void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
    float t = clamp(v_disp / u_amp, 0.0, 1.0);
    material.diffuse = mix(vec3(0.0, 0.3, 1.0), vec3(1.0, 0.2, 0.0), t);
  }`,
});
```

### CustomShader on a 3D Tileset

```js
import { Cesium3DTileset, CustomShader, CustomShaderMode } from "cesium";

const tileset = await Cesium3DTileset.fromIonAssetId(96188);
viewer.scene.primitives.add(tileset);

tileset.customShader = new CustomShader({
  mode: CustomShaderMode.REPLACE_MATERIAL,
  fragmentShaderText: `
    void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
      float height = fsInput.attributes.positionWC.z;
      float t = clamp(height / 200.0, 0.0, 1.0);
      material.diffuse = mix(vec3(0.2, 0.4, 0.8), vec3(1.0, 0.8, 0.2), t);
    }
  `,
});
```

## ImageBasedLighting

Controls PBR image-based lighting for `Model` and `Cesium3DTileset`. `imageBasedLightingFactor` (Cartesian2) scales diffuse (x) and specular (y) from 0 to 1. Diffuse comes from `sphericalHarmonicCoefficients` (array of 9 Cartesian3, L0-L2). Specular comes from `specularEnvironmentMaps` (URL to KTX2 cube map).

```js
import { ImageBasedLighting, Cartesian2, Cartesian3 } from "cesium";

const coefficients = [ // 9 Cartesian3 values for L0..L2 bands
  new Cartesian3(0.35, 0.35, 0.38), new Cartesian3(0.11, 0.11, 0.11),
  new Cartesian3(0.04, 0.04, 0.04), new Cartesian3(-0.08, -0.08, -0.08),
  new Cartesian3(-0.02, -0.02, -0.02), new Cartesian3(0.04, 0.04, 0.04),
  new Cartesian3(-0.06, -0.06, -0.06), new Cartesian3(0.01, 0.01, 0.01),
  new Cartesian3(-0.03, -0.03, -0.03),
];
const ibl = new ImageBasedLighting({
  imageBasedLightingFactor: new Cartesian2(1.0, 1.0),
  sphericalHarmonicCoefficients: coefficients,
  specularEnvironmentMaps: "./environment/specular.ktx2",
});
const model = await Cesium.Model.fromGltfAsync({ url: "./helmet.glb", imageBasedLighting: ibl });
viewer.scene.primitives.add(model);
// Disable: model.imageBasedLighting.imageBasedLightingFactor = new Cartesian2(0.0, 0.0);
```

## Post-Processing

Screen-space pipeline via `viewer.scene.postProcessStages` (`PostProcessStageCollection`). Stages execute in order; each reads `colorTexture` and `depthTexture`.

### Built-in Effects (PostProcessStageLibrary)

`createBlurStage()` (delta, sigma, stepSize), `createDepthOfFieldStage()` (focalDistance, delta, sigma, stepSize), `createEdgeDetectionStage()` (color, length), `createSilhouetteStage()` (color, length), `createBlackAndWhiteStage()` (gradations), `createBrightnessStage()` (brightness), `createNightVisionStage()`, `createLensFlareStage()` (intensity, distortion, ghostDispersal, haloWidth).

### Collection Stages (Bloom, AO, FXAA, Tonemapping)

Bloom, ambient occlusion, and FXAA are accessed directly on the collection (not via the library). Tonemapping defaults to `PBR_NEUTRAL`.

```js
import { Tonemapper, PostProcessStageLibrary } from "cesium";

// Bloom
viewer.scene.postProcessStages.bloom.enabled = true;
viewer.scene.postProcessStages.bloom.uniforms.contrast = 128.0;
viewer.scene.postProcessStages.bloom.uniforms.brightness = -0.3;

// Ambient Occlusion (HBAO)
viewer.scene.postProcessStages.ambientOcclusion.enabled = true;
viewer.scene.postProcessStages.ambientOcclusion.uniforms.intensity = 3.0;

// FXAA
viewer.scene.postProcessStages.fxaa.enabled = true;

// Tonemapping: REINHARD, MODIFIED_REINHARD, FILMIC, ACES, PBR_NEUTRAL (default)
viewer.scene.postProcessStages.tonemapper = Tonemapper.ACES;
viewer.scene.postProcessStages.exposure = 1.2; // <1 darker, >1 brighter

// Depth of field (added via library)
const dof = viewer.scene.postProcessStages.add(
  PostProcessStageLibrary.createDepthOfFieldStage()
);
dof.uniforms.focalDistance = 500.0; // meters from camera
dof.uniforms.sigma = 3.8;
```

### Custom PostProcessStage

Custom stages receive `colorTexture`, `depthTexture` (sampler2D) and `v_textureCoordinates` (vec2). Output via `out_FragColor`. Uniforms can be constants or functions (re-evaluated each frame).

```js
import { PostProcessStage } from "cesium";

const sepia = viewer.scene.postProcessStages.add(new PostProcessStage({
  fragmentShader: `
    uniform sampler2D colorTexture; in vec2 v_textureCoordinates; uniform float intensity;
    void main() {
      vec4 c = texture(colorTexture, v_textureCoordinates);
      float gray = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      out_FragColor = vec4(mix(c.rgb, gray * vec3(1.2, 1.0, 0.8), intensity), c.a);
    }`,
  uniforms: { intensity: () => 0.8 }, // function uniform, re-evaluated each frame
}));
```

### Selected Feature Highlighting

Use `czm_selected()` in the fragment shader and assign features to `stage.selected`.

```js
import { PostProcessStage, Color } from "cesium";

const highlight = viewer.scene.postProcessStages.add(new PostProcessStage({
  fragmentShader: `
    uniform sampler2D colorTexture; in vec2 v_textureCoordinates; uniform vec4 highlight;
    void main() {
      vec4 color = texture(colorTexture, v_textureCoordinates);
      if (czm_selected()) {
        out_FragColor = vec4(mix(color.rgb, highlight.rgb, highlight.a), 1.0);
      } else { out_FragColor = color; }
    }`,
  uniforms: { highlight: () => new Color(1.0, 1.0, 0.0, 0.5) },
}));
highlight.selected = [pickedFeature];
```

### PostProcessStageComposite

```js
import { PostProcessStage, PostProcessStageComposite, PostProcessStageLibrary } from "cesium";

const blur = PostProcessStageLibrary.createBlurStage();
const combine = new PostProcessStage({
  fragmentShader: `
    uniform sampler2D colorTexture; uniform sampler2D blurTexture;
    in vec2 v_textureCoordinates;
    void main() {
      vec4 orig = texture(colorTexture, v_textureCoordinates);
      vec4 blurred = texture(blurTexture, v_textureCoordinates);
      out_FragColor = mix(orig, blurred, 0.5);
    }`,
  uniforms: { blurTexture: blur.name }, // reference another stage's output by name
});
viewer.scene.postProcessStages.add(new PostProcessStageComposite({
  stages: [blur, combine],
  inputPreviousStageTexture: false, // both read the original scene texture
}));
```

### Managing Stages

```js
viewer.scene.postProcessStages.remove(sepia); // remove specific stage
dof.enabled = false;                          // disable without removing
viewer.scene.postProcessStages.removeAll();   // remove all custom stages
```

## BlendingState

Predefined blending presets for `Appearance.renderState` on Primitives.

| Preset | Behavior |
|--------|---------|
| `BlendingState.DISABLED` | No blending |
| `BlendingState.ALPHA_BLEND` | Standard alpha: `src*srcA + dst*(1-srcA)` |
| `BlendingState.PRE_MULTIPLIED_ALPHA_BLEND` | Premultiplied: `src + dst*(1-srcA)` |
| `BlendingState.ADDITIVE_BLEND` | Additive: `src*srcA + dst` |

```js
import { MaterialAppearance, BlendingState, Material, Color } from "cesium";

const appearance = new MaterialAppearance({
  material: Material.fromType("Color", { color: Color.RED.withAlpha(0.5) }),
  renderState: { depthTest: { enabled: true }, blending: BlendingState.ALPHA_BLEND },
});
```

## Performance Tips

1. Prefer `Material.fromType()` for built-in types -- cached shader programs avoid recompilation.
2. Use `Material.fromTypeAsync()` for texture materials to prevent default-texture flicker.
3. Set `CustomShaderMode.REPLACE_MATERIAL` when the original PBR material is not needed -- skips material processing.
4. Use `LightingModel.UNLIT` for flat-colored visualizations to skip PBR calculations.
5. Set `PostProcessStage.textureScale` below 1.0 (e.g., 0.5) to reduce pixels processed in expensive stages.
6. Disable unused built-in stages (`bloom.enabled = false`) -- enabled stages consume GPU resources.
7. Combine effects in a `PostProcessStageComposite` to reduce intermediate texture allocations.
8. Set `repeat: false` on `TextureUniform` when tiling is unnecessary for `CLAMP_TO_EDGE` wrapping.
9. Minimize `PostProcessStage` count -- each requires a full-screen draw call and framebuffer.
10. Call `customShader.destroy()` when done to release GPU texture resources.

## See Also

- **cesiumjs-primitives** -- Geometry, Appearances, and Material application on Primitive API objects
- **cesiumjs-3d-tiles** -- Cesium3DTileset loading and styling (`tileset.customShader`)
- **cesiumjs-models-particles** -- Model loading and glTF (`model.customShader`)
