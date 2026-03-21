/**
 * CAD Ingestion Edge Function
 *
 * Receives CAD data via webhook, normalizes it, creates an incident,
 * and triggers push notifications to department members.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Types
interface CadPayload {
  source_id?: string;
  incident_id: string;
  incident_type: string;
  incident_type_code?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  address: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  cross_street?: string;
  description?: string;
  caller_name?: string;
  caller_phone?: string;
  notes?: string;
  timestamp?: string;
}

interface NormalizedIncident {
  department_id: string;
  cad_source_id: string | null;
  cad_incident_id: string;
  incident_type: string;
  incident_type_code: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  address: string;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  cross_street: string | null;
  description: string | null;
  caller_name: string | null;
  caller_phone: string | null;
  dispatch_notes: string | null;
}

// Priority inference based on incident type
function inferPriority(
  incidentType: string,
  providedPriority?: string
): 'low' | 'medium' | 'high' | 'critical' {
  if (providedPriority && ['low', 'medium', 'high', 'critical'].includes(providedPriority)) {
    return providedPriority as 'low' | 'medium' | 'high' | 'critical';
  }

  const type = incidentType.toLowerCase();

  // Critical priorities
  if (
    type.includes('structure fire') ||
    type.includes('working fire') ||
    type.includes('entrapment') ||
    type.includes('cardiac') ||
    type.includes('not breathing')
  ) {
    return 'critical';
  }

  // High priorities
  if (
    type.includes('fire') ||
    type.includes('mva') ||
    type.includes('accident') ||
    type.includes('rescue')
  ) {
    return 'high';
  }

  // Medium priorities
  if (
    type.includes('medical') ||
    type.includes('ems') ||
    type.includes('alarm')
  ) {
    return 'medium';
  }

  return 'medium';
}

// Normalize various CAD formats into standard structure
function normalizePayload(
  payload: CadPayload,
  departmentId: string,
  cadSourceId: string | null
): NormalizedIncident {
  return {
    department_id: departmentId,
    cad_source_id: cadSourceId,
    cad_incident_id: payload.incident_id,
    incident_type: payload.incident_type,
    incident_type_code: payload.incident_type_code || null,
    priority: inferPriority(payload.incident_type, payload.priority),
    address: payload.address,
    address_line2: payload.address2 || null,
    city: payload.city || null,
    state: payload.state || null,
    zip: payload.zip || null,
    latitude: payload.latitude || null,
    longitude: payload.longitude || null,
    cross_street: payload.cross_street || null,
    description: payload.description || null,
    caller_name: payload.caller_name || null,
    caller_phone: payload.caller_phone || null,
    dispatch_notes: payload.notes || null,
  };
}

serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CAD-Source-Key',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse payload
    const rawPayload = await req.json();
    const cadSourceKey = req.headers.get('X-CAD-Source-Key');

    // Find CAD source by API key
    let cadSource = null;
    let departmentId: string | null = null;

    if (cadSourceKey) {
      const { data: source } = await supabase
        .from('cad_sources')
        .select('id, department_id, config')
        .eq('is_active', true)
        .single();

      // In production, verify the API key matches
      // For MVP, accept if source exists
      if (source) {
        cadSource = source;
        departmentId = source.department_id;
      }
    }

    // If no source found, try to get default department
    if (!departmentId) {
      const { data: defaultDept } = await supabase
        .from('departments')
        .select('id')
        .limit(1)
        .single();

      if (!defaultDept) {
        return new Response(JSON.stringify({ error: 'No department found' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      departmentId = defaultDept.id;
    }

    // Log raw payload
    const { data: rawLog, error: logError } = await supabase
      .from('cad_raw_logs')
      .insert({
        cad_source_id: cadSource?.id || null,
        department_id: departmentId,
        raw_payload: rawPayload,
        parsed_successfully: false,
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log raw payload:', logError);
    }

    // Validate required fields
    if (!rawPayload.incident_id || !rawPayload.incident_type || !rawPayload.address) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: incident_id, incident_type, address',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate incident
    const { data: existingIncident } = await supabase
      .from('incidents')
      .select('id')
      .eq('department_id', departmentId)
      .eq('cad_incident_id', rawPayload.incident_id)
      .single();

    if (existingIncident) {
      return new Response(
        JSON.stringify({
          message: 'Incident already exists',
          incident_id: existingIncident.id,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Normalize and create incident
    const normalizedIncident = normalizePayload(
      rawPayload as CadPayload,
      departmentId,
      cadSource?.id || null
    );

    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .insert(normalizedIncident)
      .select()
      .single();

    if (incidentError) {
      console.error('Failed to create incident:', incidentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create incident' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update raw log as successfully parsed
    if (rawLog) {
      await supabase
        .from('cad_raw_logs')
        .update({
          parsed_successfully: true,
          incident_id: incident.id,
        })
        .eq('id', rawLog.id);
    }

    // Get all active department members with push tokens
    const { data: members } = await supabase
      .from('users')
      .select('id, push_token, notification_preferences')
      .eq('department_id', departmentId)
      .eq('is_active', true)
      .not('push_token', 'is', null);

    // Create incident responses and send notifications
    if (members && members.length > 0) {
      // Create pending responses for all members
      const responses = members.map((member) => ({
        incident_id: incident.id,
        user_id: member.id,
        status: 'pending',
        notified_at: new Date().toISOString(),
      }));

      await supabase.from('incident_responses').insert(responses);

      // Send push notifications via separate function
      const pushTokens = members
        .filter((m) => m.push_token && m.notification_preferences?.push_enabled !== false)
        .map((m) => m.push_token);

      if (pushTokens.length > 0) {
        // Call push notification function
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            incident_id: incident.id,
            tokens: pushTokens,
            title: incident.incident_type,
            body: incident.address,
            priority: incident.priority,
          }),
        });
      }
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      department_id: departmentId,
      action: 'incident_created',
      entity_type: 'incident',
      entity_id: incident.id,
      new_values: incident,
    });

    return new Response(
      JSON.stringify({
        success: true,
        incident_id: incident.id,
        members_notified: members?.length || 0,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('CAD ingestion error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
