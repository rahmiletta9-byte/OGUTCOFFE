import { supabase } from './supabaseClient';

export const logActivity = async (userId, actionType, description) => {
  try {
    await supabase.from('activity_logs').insert([
      { user_id: userId, action_type: actionType, description }
    ]);
  } catch (error) {
    console.error("Gagal mencatat log aktivitas:", error);
  }
};
