import { supabase } from './supabase';

export type ScheduleBlock = {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  label: string;
  created_at: string;
};

export async function getScheduleBlocks(userId: string): Promise<ScheduleBlock[]> {
  const { data } = await supabase
    .from('schedule_blocks')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  return data ?? [];
}

export async function getUpcomingBlock(userId: string): Promise<ScheduleBlock | null> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const time = now.toTimeString().slice(0, 5);

  const { data } = await supabase
    .from('schedule_blocks')
    .select('*')
    .eq('user_id', userId)
    .gte('day_of_week', dayOfWeek)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function createScheduleBlock(block: {
  user_id: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  label?: string;
}) {
  const endMinutes = (parseInt(block.start_time.split(':')[0], 10) * 60 + parseInt(block.start_time.split(':')[1], 10) + block.duration_minutes);
  const endHour = Math.floor(endMinutes / 60) % 24;
  const endMin = endMinutes % 60;
  const end_time = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

  const { error } = await supabase.from('schedule_blocks').insert({
    user_id: block.user_id,
    day_of_week: block.day_of_week,
    start_time: block.start_time,
    end_time,
    label: block.label ?? 'Reading Session',
  });
  if (error) throw error;
}

export async function updateScheduleBlock(id: string, updates: Partial<{
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  label: string;
}>) {
  const payload: any = { ...updates };
  if (updates.start_time && updates.duration_minutes) {
    const endMinutes = (parseInt(updates.start_time.split(':')[0], 10) * 60 + parseInt(updates.start_time.split(':')[1], 10) + updates.duration_minutes);
    const endHour = Math.floor(endMinutes / 60) % 24;
    const endMin = endMinutes % 60;
    payload.end_time = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  }
  delete payload.duration_minutes;
  const { error } = await supabase.from('schedule_blocks').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteScheduleBlock(id: string) {
  const { error } = await supabase.from('schedule_blocks').delete().eq('id', id);
  if (error) throw error;
}
