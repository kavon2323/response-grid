/**
 * Push Notification Edge Function
 *
 * Sends push notifications via Expo Push Notification Service
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface PushRequest {
  incident_id: string;
  tokens: string[];
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: string;
  priority: 'default' | 'normal' | 'high';
  channelId?: string;
  badge?: number;
}

interface ExpoPushTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

// Map our priority to Expo priority
function mapPriority(priority: string): 'default' | 'normal' | 'high' {
  switch (priority) {
    case 'critical':
    case 'high':
      return 'high';
    case 'medium':
      return 'normal';
    default:
      return 'default';
  }
}

// Batch array into chunks
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushRequest = await req.json();

    if (!payload.tokens || payload.tokens.length === 0) {
      return new Response(JSON.stringify({ error: 'No tokens provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build push messages
    const messages: ExpoPushMessage[] = payload.tokens
      .filter((token) => token.startsWith('ExponentPushToken'))
      .map((token) => ({
        to: token,
        title: payload.title,
        body: payload.body,
        data: {
          incident_id: payload.incident_id,
          type: 'incident_alert',
        },
        sound: 'alert.wav',
        priority: mapPriority(payload.priority),
        channelId: 'incident-alerts',
        badge: 1,
      }));

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid tokens' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send in batches of 100 (Expo limit)
    const batches = chunkArray(messages, 100);
    const allTickets: ExpoPushTicket[] = [];

    for (const batch of batches) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(batch),
      });

      const result = await response.json();
      allTickets.push(...(result.data || []));
    }

    // Log notification results
    const notificationLogs = messages.map((msg, index) => {
      const ticket = allTickets[index];
      return {
        user_id: null, // Would need to map token back to user
        incident_id: payload.incident_id,
        notification_type: 'incident_alert',
        title: msg.title,
        body: msg.body,
        data: msg.data,
        expo_ticket_id: ticket?.id || null,
        delivered: ticket?.status === 'ok',
        delivery_error: ticket?.message || ticket?.details?.error || null,
      };
    });

    // Batch insert logs (skip user_id for now)
    // In production, maintain a token -> user mapping
    console.log(`Sent ${allTickets.length} notifications for incident ${payload.incident_id}`);

    const successCount = allTickets.filter((t) => t.status === 'ok').length;
    const failureCount = allTickets.filter((t) => t.status === 'error').length;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        tickets: allTickets.map((t) => ({
          id: t.id,
          status: t.status,
        })),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notifications' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
