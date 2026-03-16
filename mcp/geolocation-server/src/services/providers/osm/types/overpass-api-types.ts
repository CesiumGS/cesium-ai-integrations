/**
 * Overpass API (OpenStreetMap) type definitions
 *
 * Overpass API provides direct querying of OpenStreetMap data
 * Better for POI searches than Nominatim
 */

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    amenity?: string;
    shop?: string;
    tourism?: string;
    leisure?: string;
    cuisine?: string;
    "addr:street"?: string;
    "addr:city"?: string;
    "addr:postcode"?: string;
    "addr:housenumber"?: string;
    [key: string]: string | undefined;
  };
}

export interface OverpassResponse {
  version: number;
  generator: string;
  osm3s: {
    timestamp_osm_base: string;
    copyright: string;
  };
  elements: OverpassElement[];
}
