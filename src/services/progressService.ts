import { supabase } from '../lib/supabase';

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  body_part?: string;
  notes?: string;
  created_at: string;
}

export const ProgressService = {
  async saveProgressPhoto(photo: Omit<ProgressPhoto, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('progress_photos')
      .insert([photo])
      .select()
      .single();

    if (error) throw error;
    return data as ProgressPhoto;
  },

  async getProgressPhotos(userId: string) {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ProgressPhoto[];
  },

  async deleteProgressPhoto(id: string) {
    const { error } = await supabase
      .from('progress_photos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateProgressPhoto(id: string, updates: Partial<Pick<ProgressPhoto, 'notes' | 'body_part'>>) {
    const { data, error } = await supabase
      .from('progress_photos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ProgressPhoto;
  }
};
