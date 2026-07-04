import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSessionAndRole = async (session) => {
      if (import.meta.env.DEV) {
        console.log("AuthContext: fetchSessionAndRole initiated for email:", session?.user?.email || "No session");
      }
      
      if (!session?.user) {
        if (isMounted) {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
        setUser(session.user);
      }

      try {
        if (import.meta.env.DEV) {
          console.log("AuthContext: Fetching role from user_roles table for user ID:", session.user.id);
        }
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (isMounted) {
          if (error) {
            console.error("AuthContext: Role fetch error:", error.message);
            setRole(null);
          } else {
            if (import.meta.env.DEV) {
              console.log(`AuthContext: Role loaded successfully. Email: ${session.user.email}, Role: ${data?.role}`);
            }
            setRole(data?.role || null);
          }
        }
      } catch (err) {
        console.error("AuthContext: Exception fetching role:", err);
        if (isMounted) setRole(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // 1. Ambil session saat ini secara eksplisit untuk mencegah race condition
    const getInitialSession = async () => {
      if (import.meta.env.DEV) {
        console.log("AuthContext: Requesting initial session...");
      }
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (import.meta.env.DEV) {
          console.log("AuthContext: Initial session checked. Active user:", session?.user?.email || "None");
        }
        await fetchSessionAndRole(session);
      } catch (err) {
        console.error("Error getting initial session:", err);
        if (isMounted) setLoading(false);
      }
    };

    getInitialSession();

    // 2. Dengarkan perubahan status auth (kecuali INITIAL_SESSION yang sudah ditangani)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (import.meta.env.DEV) {
          console.log(`AuthContext: Auth State Event Triggered [${event}]. Active User:`, session?.user?.email || "None");
        }
        if (event === 'INITIAL_SESSION') return;
        await fetchSessionAndRole(session);
      }
    );

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("AuthContext: Error during signOut:", err);
    } finally {
      setUser(null);
      setRole(null);
      setLoading(false);
    }
  };

  // KUNCI: Block semua rendering (children) selama loading masih true
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
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

