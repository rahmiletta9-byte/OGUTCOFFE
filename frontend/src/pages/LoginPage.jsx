import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Coffee, 
  Mail, 
  LockKeyhole, 
  Loader2, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [activeQuickFill, setActiveQuickFill] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  
  const navigate = useNavigate();
  const { user, role, login } = useAuth();

  // Redirect otomatis jika user yang sudah login mengakses /login
  useEffect(() => {
    if (user && role) {
      if (role === 'admin') navigate('/dashboard', { replace: true });
      else if (role === 'kasir') navigate('/pos', { replace: true });
      else if (role === 'manajemen_bahan') navigate('/inventory', { replace: true });
    }
  }, [user, role, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    
    try {
      const data = await login(email, password);
      const userRole = data.role;
      if (userRole === 'admin') navigate('/dashboard', { replace: true });
      else if (userRole === 'kasir') navigate('/pos', { replace: true });
      else if (userRole === 'manajemen_bahan') navigate('/inventory', { replace: true });
      else navigate('/', { replace: true });
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsResetting(true);
    setResetMessage('');
    setResetStatus('');

    try {
      const response = await apiClient.post('/api/auth/reset-password', { email: resetEmail });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengirim email reset password.");
      }

      setResetStatus('success');
      setResetMessage(data.message || "Email reset password telah dikirim.");
    } catch (err) {
      setResetStatus('error');
      setResetMessage(err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleQuickFill = (targetRole, emailAddr, passValue) => {
    setEmail(emailAddr);
    setPassword(passValue);
    setActiveQuickFill(targetRole);
    setErrorMsg('');
    setTimeout(() => {
      setActiveQuickFill(null);
    }, 800);
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-[#0d0c0b] p-4 overflow-hidden font-sans text-stone-200 selection:bg-amber-700/40">
      
      {/* Dynamic Keyframe Animations for Subtle Hover Elements */}
      <style>{`
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float-gentle 6s infinite ease-in-out;
        }
        .professional-shadow {
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(139, 92, 26, 0.03);
        }
      `}</style>

      {/* Subtle Background Glow behind the card */}
      <div className="absolute w-[450px] h-[450px] bg-amber-950/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Main Elegant Card Container */}
      <div className="professional-shadow w-full max-w-[420px] rounded-2xl bg-[#141211] border border-stone-800/80 p-8 md:p-9 relative z-10">
        
        {/* Logo and Branding Header */}
        <div className="text-center pb-6 space-y-2">
          <div className="mx-auto w-fit flex items-center justify-center bg-amber-950/40 border border-amber-800/30 p-3.5 rounded-2xl text-amber-500 mb-2.5 animate-float">
            <Coffee size={28} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-100 leading-none">
            <span>OGUT</span>{' '}
            <span className="text-amber-500">COFFEE</span>
          </h2>
          <p className="text-stone-500 text-[10px] tracking-[0.2em] font-semibold uppercase">
            Point of Sales & Inventory
          </p>
        </div>

        {/* Inputs & Actions Form */}
        <div className="space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-300 text-xs rounded-xl flex items-center gap-2.5">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-0.5">
                Alamat Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-500 group-focus-within:text-amber-500 transition-colors duration-200">
                  <Mail size={16} className="opacity-80" />
                </div>
                <Input 
                  type="email" 
                  value={email}
                  placeholder="name@ogutcoffee.com" 
                  required 
                  className="bg-stone-900/50 border-stone-800/90 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-stone-100 rounded-xl h-11 pl-11 pr-4 text-xs transition-all placeholder:text-stone-600" 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <button 
                  type="button"
                  onClick={() => {
                    setShowResetModal(true);
                  }}
                  className="text-[9px] font-semibold text-amber-500/80 hover:text-amber-400 uppercase tracking-wider transition-colors"
                >
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-500 group-focus-within:text-amber-500 transition-colors duration-200">
                  <LockKeyhole size={16} className="opacity-80" />
                </div>
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  placeholder="••••••••" 
                  required 
                  className="bg-stone-900/50 border-stone-800/90 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-stone-100 rounded-xl h-11 pl-11 pr-11 text-xs transition-all placeholder:text-stone-600" 
                  onChange={e => setPassword(e.target.value)} 
                />
                
                {/* Password Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={15} className="opacity-80" />
                  ) : (
                    <Eye size={15} className="opacity-80" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full h-11 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2 shadow-[0_4px_12px_rgba(217,119,6,0.1)] hover:shadow-[0_4px_16px_rgba(217,119,6,0.2)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin text-stone-950" />
                  <span>MEMPROSES...</span>
                </>
              ) : (
                <span>MASUK SISTEM</span>
              )}
            </Button>
          </form>

          {/* Quick-Access Test Accounts (Frictionless Demo Panel) */}
          <div className="border-t border-stone-900/80 pt-4 mt-2">
            <button 
              type="button"
              onClick={() => setShowQuickAccess(!showQuickAccess)}
              className="w-full flex items-center justify-between text-stone-500 hover:text-stone-400 py-1 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <HelpCircle size={13} className="text-amber-500/40" />
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  Akses Demo Cepat
                </span>
              </div>
              {showQuickAccess ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showQuickAccess && (
              <div className="mt-2.5 p-3 rounded-xl bg-stone-900/30 border border-stone-900/60 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="grid grid-cols-3 gap-1.5 text-[9px] font-bold tracking-wider uppercase">
                  {/* Admin Button */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin', 'admin@ogut.com', 'admin123')}
                    className={`py-2 px-1 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      activeQuickFill === 'admin'
                        ? 'bg-amber-600/10 border-amber-500/60 text-amber-400'
                        : 'bg-stone-900/50 border-stone-800/40 text-stone-400 hover:border-stone-700/60 hover:text-stone-300'
                    }`}
                  >
                    {activeQuickFill === 'admin' ? (
                      <CheckCircle size={10} className="text-amber-400" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                    )}
                    <span>ADMIN</span>
                  </button>

                  {/* Kasir Button */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('kasir', 'kasir@ogut.com', 'kasir123')}
                    className={`py-2 px-1 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      activeQuickFill === 'kasir'
                        ? 'bg-amber-600/10 border-amber-500/60 text-amber-400'
                        : 'bg-stone-900/50 border-stone-800/40 text-stone-400 hover:border-stone-700/60 hover:text-stone-300'
                    }`}
                  >
                    {activeQuickFill === 'kasir' ? (
                      <CheckCircle size={10} className="text-amber-400" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                    )}
                    <span>KASIR</span>
                  </button>

                  {/* Bahan Button */}
                  <button
                    type="button"
                    onClick={() => handleQuickFill('manajemen_bahan', 'bahan@ogut.com', 'bahan123')}
                    className={`py-2 px-1 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                      activeQuickFill === 'manajemen_bahan'
                        ? 'bg-amber-600/10 border-amber-500/60 text-amber-400'
                        : 'bg-stone-900/50 border-stone-800/40 text-stone-400 hover:border-stone-700/60 hover:text-stone-300'
                    }`}
                  >
                    {activeQuickFill === 'manajemen_bahan' ? (
                      <CheckCircle size={10} className="text-amber-400" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                    )}
                    <span>STOK</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secure Encryption Footer */}
        <div className="flex justify-center items-center gap-1.5 mt-5">
          <ShieldCheck size={13} className="text-amber-500/60" />
          <p className="text-[8px] text-stone-500 uppercase tracking-widest font-semibold leading-none">
            Authorized POS Session
          </p>
        </div>
      </div>

      {/* Modal Reset Password */}
      {showResetModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[400px] rounded-2xl bg-[#141211] border border-stone-800 p-8 space-y-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-stone-100 uppercase tracking-wider">Reset Kata Sandi</h3>
              <p className="text-stone-500 text-[10px] leading-relaxed uppercase tracking-wider">
                Masukkan email terdaftar untuk menerima link reset
              </p>
            </div>

            {resetStatus === 'success' ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-950/20 border border-amber-900/30 text-amber-300 text-xs rounded-xl flex items-start gap-2.5">
                  <CheckCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p>{resetMessage}</p>
                </div>
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowResetModal(false);
                    setResetStatus('');
                    setResetEmail('');
                  }}
                  className="w-full h-11 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl"
                >
                  Kembali ke Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetStatus === 'error' && (
                  <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-300 text-xs rounded-xl flex items-center gap-2.5">
                    <AlertCircle size={16} className="text-red-400 shrink-0" />
                    <span>{resetMessage}</span>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-0.5">
                    Alamat Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-500 group-focus-within:text-amber-500 transition-colors duration-200">
                      <Mail size={16} className="opacity-80" />
                    </div>
                    <Input 
                      type="email" 
                      value={resetEmail}
                      placeholder="name@ogutcoffee.com" 
                      required 
                      className="bg-stone-900/50 border-stone-800/90 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-stone-100 rounded-xl h-11 pl-11 pr-4 text-xs transition-all placeholder:text-stone-600" 
                      onChange={e => setResetEmail(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setResetStatus('');
                      setResetEmail('');
                    }}
                    className="flex-1 h-11 bg-transparent hover:bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200"
                  >
                    Batal
                  </button>
                  <Button 
                    type="submit" 
                    disabled={isResetting} 
                    className="flex-1 h-11 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 size={15} className="animate-spin text-stone-950" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <span>Kirim Link</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
