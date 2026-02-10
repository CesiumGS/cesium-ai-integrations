import { z } from 'zod';

// Cesium camera operation schemas
export const CesiumPositionSchema = z.object({
  longitude: z.number().min(-180).max(180).describe('Longitude in degrees'),
  latitude: z.number().min(-90).max(90).describe('Latitude in degrees'),
  height: z.number().min(0).describe('Height in meters above ground')
});

export const CesiumOrientationSchema = z.object({
  heading: z.number().describe('Heading in degrees (0 = North)'),
  pitch: z.number().min(-90).max(90).describe('Pitch in degrees (-90 = down, 0 = horizon, 90 = up)'),
  roll: z.number().describe('Roll in degrees')
});

export const CesiumViewportSchema = z.object({
  west: z.number().min(-180).max(180).describe('Western longitude boundary'),
  south: z.number().min(-90).max(90).describe('Southern latitude boundary'),
  east: z.number().min(-180).max(180).describe('Eastern longitude boundary'),
  north: z.number().min(-90).max(90).describe('Northern latitude boundary')
});

// Enhanced schemas based on Cesium documentation
export const EasingFunctionSchema = z.enum([
  'LINEAR_NONE',
  'QUADRATIC_IN',
  'QUADRATIC_OUT', 
  'QUADRATIC_IN_OUT',
  'CUBIC_IN',
  'CUBIC_OUT',
  'CUBIC_IN_OUT',
  'QUARTIC_IN',
  'QUARTIC_OUT',
  'QUARTIC_IN_OUT',
  'QUINTIC_IN',
  'QUINTIC_OUT',
  'QUINTIC_IN_OUT',
  'SINUSOIDAL_IN',
  'SINUSOIDAL_OUT',
  'SINUSOIDAL_IN_OUT',
  'EXPONENTIAL_IN',
  'EXPONENTIAL_OUT',
  'EXPONENTIAL_IN_OUT',
  'CIRCULAR_IN',
  'CIRCULAR_OUT',
  'CIRCULAR_IN_OUT',
  'BACK_IN',
  'BACK_OUT',
  'BACK_IN_OUT',
  'ELASTIC_IN',
  'ELASTIC_OUT',
  'ELASTIC_IN_OUT',
  'BOUNCE_IN',
  'BOUNCE_OUT',
  'BOUNCE_IN_OUT'
]).optional().describe('Animation easing function');


export const HeadingPitchRangeSchema = z.object({
  heading: z.number().describe('Heading in radians'),
  pitch: z.number().describe('Pitch in radians'),
  range: z.number().min(0).describe('Distance from target in meters')
}).describe('Camera position relative to a target point');

// Type exports for TypeScript
export type CesiumPosition = z.infer<typeof CesiumPositionSchema>;
export type CesiumOrientation = z.infer<typeof CesiumOrientationSchema>;
export type CesiumViewport = z.infer<typeof CesiumViewportSchema>;