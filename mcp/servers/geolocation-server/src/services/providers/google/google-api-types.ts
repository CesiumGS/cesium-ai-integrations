/**
 * Google Places API and Routes API type definitions
 */

// ============================================================================
// Google Places API Types
// ============================================================================

export interface GoogleDisplayName {
  text?: string;
}

export interface GoogleLatLng {
  latitude: number;
  longitude: number;
}

export interface GoogleOpeningHours {
  openNow?: boolean;
}

export interface GooglePhoto {
  name: string;
}

export interface GooglePlace {
  id?: string;
  displayName?: GoogleDisplayName;
  name?: string;
  formattedAddress?: string;
  location?: GoogleLatLng;
  viewport?: GoogleViewport;
  types?: string[];
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number;
  currentOpeningHours?: GoogleOpeningHours;
  photos?: GooglePhoto[];
}

export interface GooglePlacesResponse {
  places: GooglePlace[];
}

export interface GoogleTextSearchRequestBody {
  textQuery: string;
  maxResultCount: number;
  regionCode?: string;
  locationBias?: {
    circle: {
      center: {
        latitude: number;
        longitude: number;
      };
      radius: number;
    };
  };
}

export interface GoogleNearbySearchRequestBody {
  maxResultCount: number;
  locationRestriction: {
    circle: {
      center: {
        latitude: number;
        longitude: number;
      };
      radius: number;
    };
  };
  includedTypes?: string[];
  textQuery?: string;
  minRating?: number;
}

// ============================================================================
// Google Routes API Types
// ============================================================================

export interface GoogleLocation {
  latLng: GoogleLatLng;
}

export interface GoogleViewport {
  low?: GoogleLatLng;
  high?: GoogleLatLng;
}

export interface GoogleNavigationInstruction {
  instructions?: string;
}

export interface GoogleStep {
  distanceMeters?: number;
  staticDuration?: string;
  navigationInstruction?: GoogleNavigationInstruction;
}

export interface GoogleLeg {
  distanceMeters?: number;
  duration?: string;
  startLocation?: GoogleLocation;
  endLocation?: GoogleLocation;
  steps?: GoogleStep[];
}

export interface GooglePolyline {
  encodedPolyline?: string;
}

export interface GoogleTravelAdvisory {
  duration?: string;
}

export interface GoogleRoute {
  distanceMeters?: number;
  duration?: string;
  polyline?: GooglePolyline;
  legs?: GoogleLeg[];
  viewport?: GoogleViewport;
  warnings?: string[];
  description?: string;
  travelAdvisory?: GoogleTravelAdvisory;
}

export interface GoogleRoutesResponse {
  routes: GoogleRoute[];
}

export interface GoogleRouteRequestBody {
  origin: {
    location: {
      latLng: {
        latitude: number;
        longitude: number;
      };
    };
  };
  destination: {
    location: {
      latLng: {
        latitude: number;
        longitude: number;
      };
    };
  };
  travelMode: string;
  computeAlternativeRoutes: boolean;
  routeModifiers: {
    avoidTolls?: boolean;
    avoidHighways?: boolean;
    avoidFerries?: boolean;
  };
  routingPreference?: string;
  intermediates?: Array<{
    location: {
      latLng: {
        latitude: number;
        longitude: number;
      };
    };
  }>;
  departureTime?: string;
}
