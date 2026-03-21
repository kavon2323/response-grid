/**
 * CAD Ingestion Edge Function
 *
 * Receives CAD data via webhook or text parsing, normalizes it, creates an incident,
 * and triggers push notifications to department members.
 *
 * Supports both JSON payloads and raw CAD page text in the format:
 *   CAD Page
 *   Incident #004525
 *   RespArea E2
 *   MEDC2: MED, CODE 2 MEDICAL
 *   Address
 *   google maps link
 *   Resources: ems, fire, police
 *   Remarks: ...
 *   Responding to: ...
 *   Determined: ...
 *   Caller Statement: ...
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
  // New CAD page fields
  response_area?: string;
  resources_assigned?: string[];
  remarks?: string;
  responding_to?: string;
  determined?: string;
  caller_statement?: string;
  google_maps_url?: string;
  raw_cad_text?: string;
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
  // New CAD page fields
  response_area: string | null;
  resources_assigned: string[];
  remarks: string | null;
  responding_to: string | null;
  determined: string | null;
  caller_statement: string | null;
  google_maps_url: string | null;
  raw_cad_text: string | null;
}

/**
 * Parse raw CAD page text into structured data
 * Expected format:
 *   CAD Page
 *   Incident #004525
 *   RespArea E2
 *   MEDC2: MED, CODE 2 MEDICAL
 *   123 Main Street
 *   https://maps.google.com/...
 *   Resources: Engine 1, Medic 2, Police Unit 5
 *   Remarks: Additional info here
 *   Responding to: Medical emergency
 *   Determined: Cardiac arrest
 *   Caller Statement: Patient not breathing
 */
function parseCadPageText(rawText: string): CadPayload | null {
  const lines = rawText.trim().split('\n').map(line => line.trim()).filter(Boolean);

  if (lines.length < 4) {
    return null;
  }

  const result: Partial<CadPayload> = {
    raw_cad_text: rawText,
  };

  let currentSection = '';
  let addressLines: string[] = [];
  let foundIncidentLine = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Skip "CAD Page" header
    if (lowerLine === 'cad page') {
      continue;
    }

    // Parse Incident number: "Incident #004525"
    if (lowerLine.startsWith('incident #') || lowerLine.startsWith('incident#')) {
      const match = line.match(/incident\s*#?\s*(\d+)/i);
      if (match) {
        result.incident_id = match[1];
        foundIncidentLine = true;
      }
      continue;
    }

    // Parse Response Area: "RespArea E2"
    if (lowerLine.startsWith('resparea') || lowerLine.startsWith('resp area')) {
      const match = line.match(/resp\s*area\s+(.+)/i);
      if (match) {
        result.response_area = match[1].trim();
      }
      continue;
    }

    // Parse Incident Type: "MEDC2: MED, CODE 2 MEDICAL"
    if (line.includes(':') && !lowerLine.startsWith('remarks') &&
        !lowerLine.startsWith('responding to') && !lowerLine.startsWith('determined') &&
        !lowerLine.startsWith('caller statement') && !lowerLine.startsWith('resources') &&
        !lowerLine.startsWith('http')) {
      const colonIndex = line.indexOf(':');
      const code = line.substring(0, colonIndex).trim();
      const description = line.substring(colonIndex + 1).trim();

      // Check if this looks like an incident type code (alphanumeric, short)
      if (code.length <= 10 && /^[A-Z0-9]+$/i.test(code)) {
        result.incident_type_code = code;
        result.incident_type = description || code;
        continue;
      }
    }

    // Parse Google Maps URL
    if (lowerLine.includes('google.com/maps') || lowerLine.includes('maps.google') ||
        lowerLine.includes('goo.gl/maps')) {
      result.google_maps_url = line;

      // Try to extract coordinates from Google Maps URL
      const coordMatch = line.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        result.latitude = parseFloat(coordMatch[1]);
        result.longitude = parseFloat(coordMatch[2]);
      }
      continue;
    }

    // Parse Resources: "Resources: Engine 1, Medic 2, Police Unit 5"
    if (lowerLine.startsWith('resources:') || lowerLine.startsWith('resources assigned:')) {
      const resourceText = line.substring(line.indexOf(':') + 1).trim();
      result.resources_assigned = resourceText
        .split(/[,;]/)
        .map(r => r.trim())
        .filter(Boolean);
      continue;
    }

    // Parse labeled sections
    if (lowerLine.startsWith('remarks:')) {
      result.remarks = line.substring(line.indexOf(':') + 1).trim();
      currentSection = 'remarks';
      continue;
    }

    if (lowerLine.startsWith('responding to:')) {
      result.responding_to = line.substring(line.indexOf(':') + 1).trim();
      currentSection = 'responding_to';
      continue;
    }

    if (lowerLine.startsWith('determined:')) {
      result.determined = line.substring(line.indexOf(':') + 1).trim();
      currentSection = 'determined';
      continue;
    }

    if (lowerLine.startsWith('caller statement:') || lowerLine.startsWith('caller:')) {
      result.caller_statement = line.substring(line.indexOf(':') + 1).trim();
      currentSection = 'caller_statement';
      continue;
    }

    // If we're in a multi-line section, append content
    if (currentSection && line) {
      switch (currentSection) {
        case 'remarks':
          result.remarks = (result.remarks || '') + ' ' + line;
          break;
        case 'responding_to':
          result.responding_to = (result.responding_to || '') + ' ' + line;
          break;
        case 'determined':
          result.determined = (result.determined || '') + ' ' + line;
          break;
        case 'caller_statement':
          result.caller_statement = (result.caller_statement || '') + ' ' + line;
          break;
      }
      continue;
    }

    // If we haven't found an address yet and this isn't a known field,
    // it's probably the address
    if (foundIncidentLine && !result.address && !currentSection) {
      // Skip if it looks like a URL
      if (!lowerLine.startsWith('http')) {
        addressLines.push(line);
        // Usually address is 1-2 lines before the Google Maps link
        if (addressLines.length <= 2) {
          result.address = addressLines.join(', ');
        }
      }
    }
  }

  // Validate required fields
  if (!result.incident_id) {
    return null;
  }

  // Set defaults for required fields
  if (!result.incident_type) {
    result.incident_type = 'Unknown';
  }

  if (!result.address) {
    result.address = 'Address not provided';
  }

  return result as CadPayload;
}

// Priority inference based on incident type and code
function inferPriority(
  incidentType: string,
  incidentCode?: string,
  providedPriority?: string
): 'low' | 'medium' | 'high' | 'critical' {
  if (providedPriority && ['low', 'medium', 'high', 'critical'].includes(providedPriority)) {
    return providedPriority as 'low' | 'medium' | 'high' | 'critical';
  }

  const type = incidentType.toLowerCase();
  const code = (incidentCode || '').toUpperCase();

  // Critical priorities - Code 3 or specific incident types
  if (
    code.includes('C3') || code.includes('CODE3') || code.includes('CODE 3') ||
    type.includes('structure fire') ||
    type.includes('working fire') ||
    type.includes('entrapment') ||
    type.includes('cardiac') ||
    type.includes('not breathing') ||
    type.includes('code 3')
  ) {
    return 'critical';
  }

  // High priorities
  if (
    type.includes('fire') ||
    type.includes('mva') ||
    type.includes('accident') ||
    type.includes('rescue') ||
    type.includes('trauma')
  ) {
    return 'high';
  }

  // Medium priorities - Code 2 or medical
  if (
    code.includes('C2') || code.includes('CODE2') || code.includes('CODE 2') ||
    type.includes('medical') ||
    type.includes('med') ||
    type.includes('ems') ||
    type.includes('alarm') ||
    type.includes('code 2')
  ) {
    return 'medium';
  }

  // Code 1 or low priority indicators
  if (
    code.includes('C1') || code.includes('CODE1') || code.includes('CODE 1') ||
    type.includes('standby') ||
    type.includes('code 1')
  ) {
    return 'low';
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
    priority: inferPriority(payload.incident_type, payload.incident_type_code, payload.priority),
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
    // New CAD page fields
    response_area: payload.response_area || null,
    resources_assigned: payload.resources_assigned || [],
    remarks: payload.remarks || null,
    responding_to: payload.responding_to || null,
    determined: payload.determined || null,
    caller_statement: payload.caller_statement || null,
    google_maps_url: payload.google_maps_url || null,
    raw_cad_text: payload.raw_cad_text || null,
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

    // Parse payload - supports both JSON and raw text
    const contentType = req.headers.get('Content-Type') || '';
    let rawPayload: CadPayload;
    let rawText: string | null = null;

    if (contentType.includes('text/plain') || contentType.includes('text/html')) {
      // Raw CAD page text
      rawText = await req.text();
      const parsed = parseCadPageText(rawText);
      if (!parsed) {
        return new Response(
          JSON.stringify({ error: 'Failed to parse CAD page text' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      rawPayload = parsed;
    } else if (contentType.includes('application/json')) {
      const jsonData = await req.json();
      // Check if this is a JSON wrapper around raw text
      if (typeof jsonData === 'object' && jsonData.raw_text) {
        rawText = jsonData.raw_text;
        const parsed = parseCadPageText(rawText);
        if (!parsed) {
          return new Response(
            JSON.stringify({ error: 'Failed to parse CAD page text from raw_text field' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        rawPayload = parsed;
      } else {
        rawPayload = jsonData;
      }
    } else {
      // Try to parse as JSON first, fall back to text
      const bodyText = await req.text();
      try {
        const jsonData = JSON.parse(bodyText);
        if (typeof jsonData === 'object' && jsonData.raw_text) {
          const parsed = parseCadPageText(jsonData.raw_text);
          if (parsed) {
            rawPayload = parsed;
          } else {
            rawPayload = jsonData;
          }
        } else {
          rawPayload = jsonData;
        }
      } catch {
        // Not JSON, try parsing as CAD page text
        const parsed = parseCadPageText(bodyText);
        if (!parsed) {
          return new Response(
            JSON.stringify({ error: 'Invalid payload format' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        rawPayload = parsed;
        rawText = bodyText;
      }
    }

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
        raw_payload: rawText ? { raw_text: rawText, parsed: rawPayload } : rawPayload,
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
