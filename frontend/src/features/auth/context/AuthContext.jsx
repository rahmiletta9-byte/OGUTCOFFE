import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { setSupabaseSession, clearSupabaseSession } from '@/lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [warningTimeLeft, setWarningTimeLeft] = useState(300);

  // Inisialisasi Auth saat Mount (Cek Token dari localStorage dan Validasi via Flask /api/auth/me)
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem('pos_token');
      const refreshToken = localStorage.getItem('pos_refresh_token');

      if (!token) {
        if (isMounted) {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
        return;
      }

      try {
        if (import.meta.env.DEV) {
          console.log("AuthContext: Memvalidasi token sesi ke backend Flask...");
        }

        const res = await apiClient.get('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUser(data.user);
            setRole(data.role);
            if (import.meta.env.DEV) {
              console.log(`AuthContext: Sesi aktif ditemukan. User: ${data.user?.email}, Role: ${data.role}`);
            }
          }
          // Sinkronisasikan token ke Supabase client untuk query data langsung (RPC, tabel)
          await setSupabaseSession(token, refreshToken);
        } else {
          // Token tidak valid / expired
          if (import.meta.env.DEV) {
            console.warn("AuthContext: Token tidak valid atau kedaluwarsa. Membersihkan sesi.");
          }
          localStorage.removeItem('pos_token');
          localStorage.removeItem('pos_refresh_token');
          localStorage.removeItem('pos_last_activity');
          if (isMounted) {
            setUser(null);
            setRole(null);
          }
        }
      } catch (err) {
        console.error("AuthContext: Gagal menghubungi server autentikasi:", err);
        // Jangan hapus token jika hanya masalah network sementara
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fungsi Login via Flask Backend
  const login = async (email, password) => {
    const res = await apiClient.post('/api/auth/login', { email, password });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Autentikasi gagal. Silakan coba lagi.');
    }

    // Simpan token ke localStorage
    localStorage.setItem('pos_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('pos_refresh_token', data.refresh_token);
    }
    localStorage.setItem('pos_last_activity', Date.now().toString());

    // Update state
    setUser(data.user);
    setRole(data.role);

    // Sinkronisasi session ke Supabase client
    await setSupabaseSession(data.access_token, data.refresh_token);

    return data;
  };

  // Fungsi Logout Terpusat
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiClient.post('/api/auth/logout', {}).catch(() => {});
      await clearSupabaseSession().catch(() => {});
    } catch (err) {
      console.error("AuthContext: Kesalahan saat logout:", err);
    } finally {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_refresh_token');
      localStorage.removeItem('pos_last_activity');
      setUser(null);
      setRole(null);
      setShowTimeoutWarning(false);
      setLoading(false);
    }
  }, []);

  // Idle Session Timeout Logic backed by localStorage (30 Menit Timeout, 25 Menit Warning)
  useEffect(() => {
    if (!user) {
      setShowTimeoutWarning(false);
      localStorage.removeItem('pos_last_activity');
      return;
    }

    const SESSION_TIMEOUT_MS = 30 * 60 * 1000;    // 30 menit
    const WARNING_THRESHOLD_MS = 25 * 60 * 1000;  // 25 menit (mulai warning)

    if (!localStorage.getItem('pos_last_activity')) {
      localStorage.setItem('pos_last_activity', Date.now().toString());
    }

    const updateActivity = () => {
      const elapsed = Date.now() - parseInt(localStorage.getItem('pos_last_activity') || '0', 10);
      if (elapsed < WARNING_THRESHOLD_MS) {
        localStorage.setItem('pos_last_activity', Date.now().toString());
        setShowTimeoutWarning(false);
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, updateActivity));

    const checkInterval = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('pos_last_activity') || '0', 10);
      if (!lastActivity) return;

      const elapsed = Date.now() - lastActivity;

      if (elapsed >= SESSION_TIMEOUT_MS) {
        clearInterval(checkInterval);
        localStorage.removeItem('pos_last_activity');
        setShowTimeoutWarning(false);
        logout();
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        const remainingSeconds = Math.max(0, Math.floor((SESSION_TIMEOUT_MS - elapsed) / 1000));
        setWarningTimeLeft(remainingSeconds);
        setShowTimeoutWarning(true);
      } else {
        setShowTimeoutWarning(false);
      }
    }, 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(checkInterval);
    };
  }, [user, logout]);

  const keepSessionAlive = () => {
    localStorage.setItem('pos_last_activity', Date.now().toString());
    setShowTimeoutWarning(false);
    setWarningTimeLeft(300);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
            Memuat Sistem...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, setUser, setRole, keepSessionAlive }}>
      {children}
      
      {/* Modal Warning Timeout */}
      {showTimeoutWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-2xl bg-[#141211] border border-stone-800 p-8 text-center space-y-6 shadow-2xl relative">
            <div className="mx-auto w-fit flex items-center justify-center bg-amber-950/40 border border-amber-800/30 p-4 rounded-full text-amber-500 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-alert"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-stone-100 uppercase tracking-wider">Sesi Hampir Berakhir</h3>
              <p className="text-stone-400 text-xs leading-relaxed">
                Sesi Anda akan berakhir dalam <span className="text-amber-500 font-bold font-mono text-sm">{formatTime(warningTimeLeft)}</span> karena tidak ada aktivitas.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={keepSessionAlive}
                className="w-full h-11 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200"
              >
                Tetap Masuk
              </button>
              <button
                type="button"
                onClick={logout}
                className="w-full h-11 bg-transparent hover:bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200"
              >
                Logout Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


