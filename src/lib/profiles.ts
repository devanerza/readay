import { supabase } from './supabase';

export type Profile = {
  user_id: string;
  display_name: string;
  genre_weights: Record<string, number>;
  preferred_session_minutes: number;
  yearly_goal: number;
  format_preference: string;
};

export type OnboardingData = {
  display_name: string;
  genre_weights: Record<string, number>;
  preferred_session_minutes: number;
  yearly_goal: number;
  format_preference: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}

export async function createProfile(userId: string, data: OnboardingData) {
  const { error } = await supabase.from('profiles').insert({
    user_id: userId,
    ...data,
  });
  if (error) throw error;
}

export async function updateProfile(userId: string, data: Partial<OnboardingData>) {
  const { error } = await supabase.from('profiles').update(data).eq('user_id', userId);
  if (error) throw error;
}
