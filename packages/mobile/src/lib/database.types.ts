/**
 * Supabase Database Types
 * Generated from schema - update with `supabase gen types typescript`
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string;
          name: string;
          code: string;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          timezone: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          timezone?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          timezone?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      incidents: {
        Row: {
          id: string;
          department_id: string;
          cad_source_id: string | null;
          cad_incident_id: string | null;
          incident_type: string;
          incident_type_code: string | null;
          priority: 'low' | 'medium' | 'high' | 'critical';
          status: 'dispatched' | 'acknowledged' | 'units_enroute' | 'on_scene' | 'under_control' | 'cleared' | 'cancelled';
          address: string;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          latitude: number | null;
          longitude: number | null;
          cross_street: string | null;
          location_notes: string | null;
          description: string | null;
          caller_name: string | null;
          caller_phone: string | null;
          dispatch_notes: string | null;
          dispatched_at: string;
          acknowledged_at: string | null;
          first_unit_enroute_at: string | null;
          first_unit_arrived_at: string | null;
          under_control_at: string | null;
          cleared_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['incidents']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['incidents']['Insert']>;
      };
      incident_responses: {
        Row: {
          id: string;
          incident_id: string;
          user_id: string;
          status: 'pending' | 'responding_scene' | 'responding_station' | 'not_responding' | 'standby' | 'en_route_scene' | 'arrived_station' | 'arrived_scene' | 'cleared';
          destination: 'scene' | 'station' | null;
          notified_at: string;
          responded_at: string | null;
          arrived_station_at: string | null;
          departed_station_at: string | null;
          arrived_scene_at: string | null;
          cleared_at: string | null;
          current_eta_minutes: number | null;
          eta_updated_at: string | null;
          apparatus_id: string | null;
          apparatus_assigned_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['incident_responses']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['incident_responses']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          auth_id: string | null;
          department_id: string;
          primary_station_id: string | null;
          email: string;
          phone: string | null;
          first_name: string;
          last_name: string;
          badge_number: string | null;
          role: 'volunteer' | 'lieutenant' | 'captain' | 'chief' | 'admin';
          is_active: boolean;
          push_token: string | null;
          notification_preferences: Json;
          share_location_with_command: boolean;
          share_location_with_responders: boolean;
          created_at: string;
          updated_at: string;
          last_active_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      responder_locations: {
        Row: {
          id: string;
          incident_response_id: string;
          user_id: string;
          incident_id: string;
          latitude: number;
          longitude: number;
          accuracy_meters: number | null;
          heading: number | null;
          speed_mps: number | null;
          eta_minutes: number | null;
          distance_to_destination_meters: number | null;
          recorded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['responder_locations']['Row'], 'id'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['responder_locations']['Insert']>;
      };
      apparatus: {
        Row: {
          id: string;
          department_id: string;
          station_id: string;
          name: string;
          unit_number: string;
          apparatus_type: 'engine' | 'ladder' | 'rescue' | 'tanker' | 'ambulance' | 'brush' | 'utility' | 'command' | 'other';
          status: 'available' | 'dispatched' | 'en_route' | 'on_scene' | 'returning' | 'out_of_service';
          current_incident_id: string | null;
          inferred_latitude: number | null;
          inferred_longitude: number | null;
          inferred_location_user_id: string | null;
          inferred_location_updated_at: string | null;
          seat_capacity: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['apparatus']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['apparatus']['Insert']>;
      };
      stations: {
        Row: {
          id: string;
          department_id: string;
          name: string;
          code: string;
          address: string;
          city: string | null;
          state: string | null;
          zip: string | null;
          latitude: number | null;
          longitude: number | null;
          geofence_radius_meters: number;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stations']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stations']['Insert']>;
      };
    };
    Views: {};
    Functions: {
      get_user_department_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: 'volunteer' | 'lieutenant' | 'captain' | 'chief' | 'admin';
      };
      is_command_level: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: 'volunteer' | 'lieutenant' | 'captain' | 'chief' | 'admin';
      response_status: 'pending' | 'responding_scene' | 'responding_station' | 'not_responding' | 'standby' | 'en_route_scene' | 'arrived_station' | 'arrived_scene' | 'cleared';
      incident_status: 'dispatched' | 'acknowledged' | 'units_enroute' | 'on_scene' | 'under_control' | 'cleared' | 'cancelled';
      incident_priority: 'low' | 'medium' | 'high' | 'critical';
      apparatus_type: 'engine' | 'ladder' | 'rescue' | 'tanker' | 'ambulance' | 'brush' | 'utility' | 'command' | 'other';
      apparatus_status: 'available' | 'dispatched' | 'en_route' | 'on_scene' | 'returning' | 'out_of_service';
    };
  };
}
