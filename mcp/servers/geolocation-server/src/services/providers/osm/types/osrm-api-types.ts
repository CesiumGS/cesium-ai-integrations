/**
 * OSRM (Open Source Routing Machine) API type definitions
 * Based on OSRM v5.5.1 API specification
 * https://project-osrm.org/docs/v5.5.1/api/
 */

export interface OSRMManeuver {
  location?: [number, number]; // [longitude, latitude]
  bearing_before?: number; // Clockwise angle from true north before maneuver
  bearing_after?: number; // Clockwise angle from true north after maneuver
  type?: string; // turn, new name, depart, arrive, merge, ramp, on_ramp, off_ramp, fork, end of road, etc.
  modifier?: string; // uturn, sharp right, right, slight right, straight, slight left, left, sharp left
  exit?: number; // Exit number for roundabouts
}

export interface OSRMIntersection {
  location?: [number, number];
  bearings?: number[];
  entry?: boolean[];
  in?: number;
  out?: number;
  lanes?: Array<{
    indications?: string[];
    valid?: boolean;
  }>;
}

export interface OSRMStep {
  distance?: number; // Distance in meters
  duration?: number; // Duration in seconds
  geometry?: string; // Encoded polyline
  name?: string; // Name of the road
  ref?: string; // Reference number/code for the way
  pronunciation?: string; // Pronunciation hint
  destinations?: string; // Destinations of the way
  mode?: string; // Mode of transportation (driving, walking, etc.)
  maneuver?: OSRMManeuver;
  intersections?: OSRMIntersection[];
}

export interface OSRMLeg {
  distance?: number; // Distance in meters
  duration?: number; // Duration in seconds
  summary?: string; // Names of the two major roads used
  steps?: OSRMStep[];
  annotation?: {
    distance?: number[]; // Distance for each segment
    duration?: number[]; // Duration for each segment
    datasources?: number[]; // Datasource index for each segment
    nodes?: number[]; // OSM node IDs
  };
}

export interface OSRMRoute {
  distance?: number; // Distance in meters
  duration?: number; // Duration in seconds
  geometry?: string; // Encoded polyline
  legs?: OSRMLeg[];
  weight_name?: string; // Name of weight (usually "routability" or "duration")
  weight?: number; // Weight value
}

export interface OSRMWaypoint {
  name?: string; // Name of the street
  location?: [number, number]; // [longitude, latitude]
  distance?: number; // Distance from input coordinate
  hint?: string; // Unique identifier for the segment
}

export interface OSRMResponse {
  code: string; // Ok, InvalidUrl, InvalidService, InvalidOptions, etc.
  message?: string; // Human-readable error message
  routes?: OSRMRoute[];
  waypoints?: OSRMWaypoint[];
}
