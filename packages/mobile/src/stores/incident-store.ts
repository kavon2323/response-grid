/**
 * Incident Store - Manages active incident state
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type {
  Incident,
  IncidentResponse,
  ResponseStatus,
  IncidentResponseWithUser,
} from '@fireresponse/shared';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface IncidentState {
  // Active incident data
  activeIncident: Incident | null;
  myResponse: IncidentResponse | null;
  allResponses: IncidentResponseWithUser[];

  // Recent incidents list
  recentIncidents: Incident[];

  // Subscriptions
  incidentChannel: RealtimeChannel | null;

  // Loading states
  isLoading: boolean;
  isUpdating: boolean;

  // Actions
  loadActiveIncident: (incidentId: string) => Promise<void>;
  loadRecentIncidents: () => Promise<void>;
  updateMyStatus: (status: ResponseStatus, latitude?: number, longitude?: number) => Promise<void>;
  subscribeToIncident: (incidentId: string) => void;
  unsubscribeFromIncident: () => void;
  clearActiveIncident: () => void;
}

export const useIncidentStore = create<IncidentState>((set, get) => ({
  activeIncident: null,
  myResponse: null,
  allResponses: [],
  recentIncidents: [],
  incidentChannel: null,
  isLoading: false,
  isUpdating: false,

  loadActiveIncident: async (incidentId: string) => {
    set({ isLoading: true });
    try {
      // Fetch incident
      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', incidentId)
        .single();

      if (incidentError) throw incidentError;

      // Fetch all responses with user info
      const { data: responses, error: responsesError } = await supabase
        .from('incident_responses')
        .select(`
          *,
          user:users(id, first_name, last_name, role, badge_number)
        `)
        .eq('incident_id', incidentId);

      if (responsesError) throw responsesError;

      // Get my response
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user?.id)
        .single();

      const myResponse = responses?.find(r => r.user_id === profile?.id) || null;

      set({
        activeIncident: incident as Incident,
        allResponses: (responses || []) as IncidentResponseWithUser[],
        myResponse: myResponse as IncidentResponse | null,
      });

      // Subscribe to real-time updates
      get().subscribeToIncident(incidentId);
    } catch (error) {
      console.error('Failed to load incident:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadRecentIncidents: async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('dispatched_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      set({ recentIncidents: (data || []) as Incident[] });
    } catch (error) {
      console.error('Failed to load recent incidents:', error);
    }
  },

  updateMyStatus: async (status: ResponseStatus, latitude?: number, longitude?: number) => {
    const { activeIncident, myResponse } = get();
    if (!activeIncident) return;

    set({ isUpdating: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user?.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Determine destination based on status
      const destination = status === 'responding_scene' || status === 'arrived_scene' || status === 'en_route_scene'
        ? 'scene'
        : status === 'responding_station' || status === 'arrived_station'
          ? 'station'
          : null;

      // Timestamp fields based on status
      const timestamps: Record<string, string> = {};
      const now = new Date().toISOString();

      if (status === 'responding_scene' || status === 'responding_station') {
        timestamps.responded_at = now;
      } else if (status === 'arrived_station') {
        timestamps.arrived_station_at = now;
      } else if (status === 'en_route_scene') {
        timestamps.departed_station_at = now;
      } else if (status === 'arrived_scene') {
        timestamps.arrived_scene_at = now;
      } else if (status === 'cleared') {
        timestamps.cleared_at = now;
      }

      if (myResponse) {
        // Update existing response
        const { error } = await supabase
          .from('incident_responses')
          .update({
            status,
            destination,
            ...timestamps,
          })
          .eq('id', myResponse.id);

        if (error) throw error;
      } else {
        // Create new response
        const { error } = await supabase
          .from('incident_responses')
          .insert({
            incident_id: activeIncident.id,
            user_id: profile.id,
            status,
            destination,
            notified_at: now,
            ...timestamps,
          });

        if (error) throw error;
      }

      // Log status change
      await supabase.from('response_status_log').insert({
        incident_response_id: myResponse?.id,
        user_id: profile.id,
        incident_id: activeIncident.id,
        previous_status: myResponse?.status || null,
        new_status: status,
        latitude,
        longitude,
      });

      // Refresh data
      await get().loadActiveIncident(activeIncident.id);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      set({ isUpdating: false });
    }
  },

  subscribeToIncident: (incidentId: string) => {
    const { incidentChannel } = get();

    // Unsubscribe from existing channel
    if (incidentChannel) {
      supabase.removeChannel(incidentChannel);
    }

    // Create new subscription
    const channel = supabase
      .channel(`incident:${incidentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents',
          filter: `id=eq.${incidentId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            set({ activeIncident: payload.new as Incident });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incident_responses',
          filter: `incident_id=eq.${incidentId}`,
        },
        async () => {
          // Refetch all responses to get updated data with joins
          const { data: responses } = await supabase
            .from('incident_responses')
            .select(`
              *,
              user:users(id, first_name, last_name, role, badge_number)
            `)
            .eq('incident_id', incidentId);

          if (responses) {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase
              .from('users')
              .select('id')
              .eq('auth_id', user?.id)
              .single();

            const myResponse = responses.find(r => r.user_id === profile?.id);

            set({
              allResponses: responses as IncidentResponseWithUser[],
              myResponse: myResponse as IncidentResponse | null,
            });
          }
        }
      )
      .subscribe();

    set({ incidentChannel: channel });
  },

  unsubscribeFromIncident: () => {
    const { incidentChannel } = get();
    if (incidentChannel) {
      supabase.removeChannel(incidentChannel);
      set({ incidentChannel: null });
    }
  },

  clearActiveIncident: () => {
    get().unsubscribeFromIncident();
    set({
      activeIncident: null,
      myResponse: null,
      allResponses: [],
    });
  },
}));
