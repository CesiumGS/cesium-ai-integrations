# 🌍 Cesium Agent Skills

A collection of [Agent Skills](https://agentskills.io/) specifically designed for working with Cesium ecosystem.

## 🤖 What are Agent Skills?

Agent Skills are folders of instructions, scripts, and resources that AI agents can discover and use to perform tasks more accurately and efficiently. They provide agents with:

- **Domain expertise**: Specialized knowledge about the Cesium ecosystem, including CesiumJS, Cesium ion, 3D Tiles, and geospatial concepts
- **Procedural knowledge**: Step-by-step instructions for common Cesium platform tasks and workflows
- **Context-aware guidance**: Company-, team-, and project-specific information about working with Cesium technologies

The Agent Skills format is an open standard originally developed by Anthropic and adopted by leading AI development tools including VS Code, GitHub Copilot, and many others.

## 💡 Why Cesium Agent Skills?

The Cesium platform provides powerful tools for 3D geospatial visualization and data management, including CesiumJS, Cesium ion, 3D Tiles, and related technologies. These skills help AI agents:

- Understand Cesium platform terminology and concepts (CesiumJS APIs, 3D Tiles, Cesium ion, CZML, terrain, imagery, etc.)
- Navigate documentation across the Cesium ecosystem effectively
- Follow Cesium best practices for performance, data optimization, and visual quality
- Implement common patterns across CesiumJS development, ion asset management, and 3D Tiles workflows
- Troubleshoot platform-specific issues and integrate Cesium technologies effectively

## Available Skills

This directory contains Cesium ecosystem agent skills organized into two categories:

### CesiumJS Domain Skills (Baked-In Reference)

13 self-contained, domain-level skills that passively activate when developers ask CesiumJS questions. Each skill provides a Quick Start, API reference, runnable code examples, performance tips, and cross-references. Based on CesiumJS v1.139.x.

| # | Skill | Description |
|---|-------|-------------|
| 1 | **[cesiumjs-viewer-setup](./cesiumjs-viewer-setup/)** | Viewer, CesiumWidget, widgets, Ion token, Scene configuration, factory helpers, geocoders |
| 2 | **[cesiumjs-camera](./cesiumjs-camera/)** | Camera flyTo/lookAt/setView, ScreenSpaceCameraController, flight animation |
| 3 | **[cesiumjs-entities](./cesiumjs-entities/)** | Entity API, Graphics types, DataSources (GeoJSON/KML/CZML/GPX), Visualizers |
| 4 | **[cesiumjs-3d-tiles](./cesiumjs-3d-tiles/)** | Cesium3DTileset, styling, metadata, voxels, point clouds, I3S, clipping |
| 5 | **[cesiumjs-imagery](./cesiumjs-imagery/)** | ImageryProvider types, layers, WMS/WMTS, split-screen comparisons |
| 6 | **[cesiumjs-terrain-environment](./cesiumjs-terrain-environment/)** | TerrainProvider, Globe, atmosphere, sky, fog, lighting, shadows, panoramas |
| 7 | **[cesiumjs-primitives](./cesiumjs-primitives/)** | Primitive API, GeometryInstance, Appearances, Billboard/Label/Point collections |
| 8 | **[cesiumjs-materials-shaders](./cesiumjs-materials-shaders/)** | Material/Fabric, CustomShader, GLSL, PostProcessStage, bloom, tonemapping |
| 9 | **[cesiumjs-time-properties](./cesiumjs-time-properties/)** | Clock, JulianDate, Property system, SampledProperty, splines, interpolation |
| 10 | **[cesiumjs-spatial-math](./cesiumjs-spatial-math/)** | Cartesian3, Matrix4, Transforms, Ellipsoid, BoundingSphere, projections |
| 11 | **[cesiumjs-interaction](./cesiumjs-interaction/)** | ScreenSpaceEventHandler, Scene.pick/drillPick, hover, drag interactions |
| 12 | **[cesiumjs-models-particles](./cesiumjs-models-particles/)** | Model/glTF loading, animation, ParticleSystem, emitters |
| 13 | **[cesiumjs-core-utilities](./cesiumjs-core-utilities/)** | Resource, Color, Event, RequestScheduler, error handling, helper functions |

The domain mapping and class ownership rules are documented in **[cesiumjs/DOMAINS.md](./cesiumjs/DOMAINS.md)**.

### Live Documentation Skill

- **[cesium-context7](./cesium-context7/)**: Fetches up-to-date Cesium documentation via Context7 MCP tools. Covers CesiumJS, Cesium for Unreal, Cesium for Unity, and the 3D Tiles specification.

### How the Two Skill Types Work Together

The baked-in `cesiumjs-*` skills and the live `cesium-context7` skill are **independent and complementary**:

| | Baked-in Skills (`cesiumjs-*`) | Context7 (`cesium-context7`) |
|---|---|---|
| **Latency** | Instant | Requires MCP round-trip |
| **Availability** | Always works, no MCP required | Requires Context7 MCP server |
| **Content** | Curated patterns, examples, best practices | Full official docs, version-specific |
| **Best for** | Common patterns, Quick Starts, "how do I..." | Version-pinned API signatures, cutting-edge features |

Both can activate simultaneously. Use baked-in skills for patterns and recipes; use Context7 to validate against a specific CesiumJS version or query Unreal/Unity/3D Tiles spec docs.

## 🚀 Using These Skills

If you're using an AI assistant that supports Agent Skills (like GitHub Copilot in VS Code), these skills will be automatically discovered and used when working on Cesium-related tasks in this workspace.

Skills are typically stored as `SKILL.md` files within their respective directories, along with any supporting resources.

## 🤝 Contributing New Skills

To add a new Cesium agent skill:

1. Create a new directory under `skills/` with a descriptive name
2. Create a `SKILL.md` file following the [Agent Skills specification](https://agentskills.io/specification)
3. Include any supporting resources (examples, documentation, scripts)
4. Update this README to list the new skill


## 🔗 Resources

- [Agent Skills Homepage](https://agentskills.io/)
- [Agent Skills Specification](https://agentskills.io/specification)
- [Example Skills Repository](https://github.com/anthropics/skills)
- [Cesium Documentation](https://cesium.com/docs/)
- [Cesium ion](https://cesium.com/platform/cesium-ion/)
- [3D Tiles Specification](https://github.com/CesiumGS/3d-tiles)

## 📄 License

See the [LICENSE](../LICENSE) file in the root of this repository.
