type CesiumGlobal = typeof import("cesium");

declare global {
  const Cesium: CesiumGlobal;
}

export {};
