---
name: cesium-context7
description: "Fetches up-to-date documentation for Cesium, CesiumJS, CesiumJS Viewer, 3D Tiles, Unreal Engine integration, Unity integration, cesium-unreal, cesium-unity, ACesium3DTileset, ACesiumGeoreference, Globe Anchor, Cesium plugin, georeferencing, and Cesium-related APIs using Context7 MCP tools. Use this skill whenever the user asks about CesiumJS classes (Viewer, Entity, Camera, Scene, Cartesian3, ImageryLayer, DataSource, etc.), Unreal Engine Cesium components (ACesium3DTileset, ACesiumGeoreference, Globe Anchor), Unity Cesium components (Cesium3DTileset, CesiumCameraController), the 3D Tiles specification, or any Cesium integration or API question — even if they don't explicitly ask for docs. Always fetch docs before writing or reviewing Cesium code. Use query-docs with library IDs: /cesiumgs/cesium (CesiumJS), /cesiumgs/cesium-unreal (Unreal), /cesiumgs/cesium-unity (Unity), /websites/ogc_cs_22-025r4 (3D Tiles spec)."
---

# Context7 for Cesium Development

Fetch current Cesium documentation via Context7 before answering questions or generating code. Cesium APIs evolve quickly; fetching up-to-date docs prevents hallucinated method signatures and stale examples.

## When to use this skill

Use this skill for **any** of these:

- CesiumJS code: Viewer, Entity, Camera, Scene, Cartesian3, Primitive, DataSource, ImageryProvider, TerrainProvider, etc.
- Cesium for Unreal: ACesium3DTileset, ACesiumGeoreference, globe anchors, Blueprint integration
- Cesium for Unity: Cesium3DTileset component, CesiumCameraController, C# scripting
- 3D Tiles specification: tileset.json format, refinement strategies (ADD vs REPLACE), metadata schemas, implicit tiling
- General Cesium integration questions, even if the user doesn't say "look up docs"

## Workflow

1. **Identify the library** from the Known Library IDs below (almost always no need to call `resolve-library-id`).
2. **Call `query-docs`** with a focused query — fetch docs *before* writing or reviewing code.
3. **If the question spans multiple areas** (e.g., CesiumJS API + 3D Tiles spec, or Unreal + CesiumJS concepts), make separate `query-docs` calls and synthesize the results.
4. **Answer or generate code** using fetched documentation; cite specific classes/methods you used.

## Known Library IDs

| Library | ID | Use for |
|---|---|---|
| CesiumJS | `/cesiumgs/cesium` | Viewer, Entity, Camera, Scene, Cartesian3, Primitive, ImageryLayer, DataSource, … |
| Cesium for Unreal | `/cesiumgs/cesium-unreal` | ACesium3DTileset, ACesiumGeoreference, Globe Anchor, Blueprint |
| Cesium for Unity | `/cesiumgs/cesium-unity` | Cesium3DTileset, CesiumCameraController, C# scripting |
| 3D Tiles Spec | `/websites/ogc_cs_22-025r4` | tileset.json, refinement, metadata schemas, implicit tiling |

## Available Tools

### `query-docs`

Retrieve documentation for a library.

**Parameters**:
- `libraryId` (string, required): ID from the table above
- `query` (string, required): Specific topic or class/method name
- `version` (string, optional): Pin to a specific library version

### `resolve-library-id`

Search for an unknown library's Context7 ID.  
**Only call this when the library is not listed above.**

## Query Tips

Write focused, specific queries — you'll get better results:

| Instead of… | Try… |
|---|---|
| `"cesium camera"` | `"Camera.flyTo options and duration"` |
| `"entities"` | `"Entity billboard and label properties"` |
| `"3d tiles"` | `"3D Tiles ADD vs REPLACE refinement"` |
| `"unreal setup"` | `"ACesiumGeoreference SetOriginLongitudeLatitudeHeight"` |

## Examples

**Single-library query:**
```
query-docs({ libraryId: "/cesiumgs/cesium", query: "Viewer constructor options terrain provider" })
```

**Multi-library query (CesiumJS + 3D Tiles spec):**
```
query-docs({ libraryId: "/cesiumgs/cesium", query: "Cesium3DTileset load tileset.json" })
query-docs({ libraryId: "/websites/ogc_cs_22-025r4", query: "tileset.json root tile schema" })
```

**Cesium for Unreal + CesiumJS concepts:**
```
query-docs({ libraryId: "/cesiumgs/cesium-unreal", query: "ACesium3DTileset metadata filtering" })
query-docs({ libraryId: "/websites/ogc_cs_22-025r4", query: "3D Tiles metadata schema EXT_mesh_features" })
```