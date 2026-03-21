/**
 * Auth Store - Manages authentication state
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { User, UserRole } from '@fireresponse/shared';

interface AuthState {
  // Auth state
  session: Session | null;
  supabaseUser: SupabaseUser | null;
  profile: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Derived state
  isAuthenticated: boolean;
  isCommandLevel: boolean;

  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updatePushToken: (token: string) => Promise<void>;
}

const COMMAND_ROLES: UserRole[] = ['lieutenant', 'captain', 'chief', 'admin'];

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  supabaseUser: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  isAuthenticated: false,
  isCommandLevel: false,

  initialize: async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();

        set({
          session,
          supabaseUser: session.user,
          profile: profile as User | null,
          isAuthenticated: true,
          isCommandLevel: profile ? COMMAND_ROLES.includes(profile.role) : false,
        });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          set({
            session,
            supabaseUser: session.user,
            profile: profile as User | null,
            isAuthenticated: true,
            isCommandLevel: profile ? COMMAND_ROLES.includes(profile.role) : false,
          });
        } else if (event === 'SIGNED_OUT') {
          set({
            session: null,
            supabaseUser: null,
            profile: null,
            isAuthenticated: false,
            isCommandLevel: false,
          });
        }
      });
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Profile will be set by auth state change listener
      return { error: null };
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
    } finally {
      set({ isLoading: false });
    }
  },

  refreshProfile: async () => {
    const { supabaseUser } = get();
    if (!supabaseUser) return;

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', supabaseUser.id)
      .single();

    if (profile) {
      set({
        profile: profile as User,
        isCommandLevel: COMMAND_ROLES.includes(profile.role),
      });
    }
  },

  updatePushToken: async (token: string) => {
    const { profile } = get();
    if (!profile) return;

    await supabase
      .from('users')
      .update({ push_token: token })
      .eq('id', profile.id);

    set({
      profile: { ...profile, push_token: token },
    });
  },
}));
