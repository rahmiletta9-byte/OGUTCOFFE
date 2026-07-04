import { supabase } from './supabaseClient';

// Utilitas logging khusus development mode
export const devLog = (moduleName, message, data = null) => {
  if (import.meta.env.DEV) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`%c[${timestamp}] [${moduleName.toUpperCase()}] ${message}`, "color: #b45309; font-weight: bold;", data);
    } else {
      console.log(`%c[${timestamp}] [${moduleName.toUpperCase()}] ${message}`, "color: #b45309; font-weight: bold;");
    }
  }
};

export const logActivity = async (userId, actionType, description) => {
  devLog("activity_log", `Queueing activity log: ${actionType} - ${description}`);
  try {
    const { error } = await supabase.from('activity_logs').insert([
      { user_id: userId, action_type: actionType, description }
    ]);
    if (error) throw error;
    devLog("activity_log", `Activity log recorded in Supabase: ${actionType}`);
  } catch (error) {
    console.error("Gagal mencatat log aktivitas ke Supabase:", error);
  }
};
