/**
 * ETA Calculation Edge Function
 *
 * Calculates estimated time of arrival using routing API
 * Called when responder location updates are received
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface EtaRequest {
  incident_response_id: string;
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
}

interface EtaResult {
  eta_minutes: number;
  distance_meters: number;
}

// Haversine formula for straight-line distance
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Simple ETA estimation based on distance
// In production, use a routing API like Mapbox Directions or Google Routes
function estimateEta(distanceMeters: number): number {
  // Assume average speed of 40 km/h for emergency response
  // This accounts for traffic, turns, etc.
  const avgSpeedMps = 40 * 1000 / 3600; // 40 km/h in m/s ≈ 11.1 m/s

  // Add 1.3x multiplier for road vs straight-line distance
  const roadDistanceEstimate = distanceMeters * 1.3;

  // Calculate time in minutes
  const timeSeconds = roadDistanceEstimate / avgSpeedMps;
  const timeMinutes = Math.ceil(timeSeconds / 60);

  // Minimum 1 minute
  return Math.max(1, timeMinutes);
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: EtaRequest = await req.json();

    let etaResult: EtaResult;

    // Try Mapbox Directions API if token is available
    if (mapboxToken) {
      try {
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${payload.origin_lon},${payload.origin_lat};${payload.destination_lon},${payload.destination_lat}?access_token=${mapboxToken}`;

        const response = await fetch(directionsUrl);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          etaResult = {
            eta_minutes: Math.ceil(route.duration / 60),
            distance_meters: Math.round(route.distance),
          };
        } else {
          throw new Error('No route found');
        }
      } catch (error) {
        console.warn('Mapbox routing failed, falling back to estimate:', error);
        // Fall back to simple estimation
        const distance = calculateDistance(
          payload.origin_lat,
          payload.origin_lon,
          payload.destination_lat,
          payload.destination_lon
        );
        etaResult = {
          eta_minutes: estimateEta(distance),
          distance_meters: Math.round(distance * 1.3),
        };
      }
    } else {
      // Use simple estimation
      const distance = calculateDistance(
        payload.origin_lat,
        payload.origin_lon,
        payload.destination_lat,
        payload.destination_lon
      );
      etaResult = {
        eta_minutes: estimateEta(distance),
        distance_meters: Math.round(distance * 1.3),
      };
    }

    // Update the incident response with new ETA
    const { error: updateError } = await supabase
      .from('incident_responses')
      .update({
        current_eta_minutes: etaResult.eta_minutes,
        eta_updated_at: new Date().toISOString(),
      })
      .eq('id', payload.incident_response_id);

    if (updateError) {
      console.error('Failed to update ETA:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...etaResult,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('ETA calculation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to calculate ETA' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
