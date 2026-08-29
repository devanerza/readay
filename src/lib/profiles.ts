import { supabase } from './supabase';

export type Profile = {
  user_id: string;
  display_name: string;
  genre_weights: Record<string, number>;
  yearly_goal: number;
  format_preference: string;
};

export type OnboardingData = {
  display_name: string;
  genre_weights: Record<string, number>;
  yearly_goal: number;
  format_preference: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}
