/**
 * Nominatim (OpenStreetMap) API type definitions
 */

export interface NominatimNameDetails {
  name?: string;
}

export interface NominatimAddress {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface NominatimPlace {
  place_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  class?: string;
  namedetails?: NominatimNameDetails;
  address?: NominatimAddress;
  boundingbox?: [string, string, string, string]; // [min_lat, max_lat, min_lon, max_lon]
}

export type NominatimPlacesResponse = NominatimPlace[];
