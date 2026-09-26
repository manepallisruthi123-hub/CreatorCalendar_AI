import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Inputs';
import { GoogleButton } from '../components/common/GoogleButton';
import { Sparkles, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { useToast } from '../components/common/Toast';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthNotice, setOauthNotice] = useState(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Inspect URL parameters for OAuth errors / notices
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errParam = params.get('error');
    const msgParam = params.get('message');

    if (errParam) {
      if (errParam === 'google_not_configured') {
        setOauthNotice({
          type: 'warning',
          title: 'Google OAuth Setup Required',
          message: msgParam || 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env, or sign in directly with email below.'
        });
      } else {
        setOauthNotice({
          type: 'error',
          title: 'Authentication Error',
          message: msgParam || 'Sign-in with Google was not completed. Please try again or use email.'
        });
      }
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail('demo@creatorcalendar.ai');
    setPassword('demo123456');
    setLoading(true);
    setError('');
    try {
      await login('demo@creatorcalendar.ai', 'demo123456');
      toast.success('Logged in with Demo Account!');
      navigate('/dashboard');
    } catch (err) {
      try {
        await register('Demo Creator', 'demo@creatorcalendar.ai', 'demo123456');
        toast.success('Demo account created and signed in!');
        navigate('/dashboard');
      } catch (regErr) {
        setError(regErr.message || 'Could not auto-create demo account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            CreatorCalendar <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">AI</span>
          </span>
        </Link>
        <h1 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">Welcome back</h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
          Sign in to continue to your content strategy.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl backdrop-blur-sm">
          {/* OAuth Notice Alert */}
          {oauthNotice && (
            <div className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              oauthNotice.type === 'warning'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{oauthNotice.title}</p>
                <p className="mt-0.5 text-slate-300 leading-relaxed text-[11px]">{oauthNotice.message}</p>
              </div>
            </div>
          )}

          {/* Form Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full font-semibold" size="md" loading={loading}>
                Sign In
              </Button>
            </div>
          </form>

          {/* Divider: OR */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-400 tracking-wider">OR</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <div className="space-y-3">
            <GoogleButton disabled={loading} text="Continue with Google" />
          </div>

          {/* Don't have an account? Create account */}
          <div className="mt-6 text-center text-xs text-slate-400">
            <span>Don't have an account? </span>
            <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
              Create account
            </Link>
          </div>

          {/* 1-Click Demo Login Button */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 mb-2.5">Testing or evaluating CreatorCalendar AI?</p>
            <Button
              type="button"
              variant="secondary"
              className="w-full text-xs"
              onClick={handleQuickDemo}
              icon={Sparkles}
              disabled={loading}
            >
              1-Click Demo Login
            </Button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mb-4">
              <Info className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Reset Password</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              To reset your password in local development mode, you can either sign in with our instant 1-Click Demo account or create a new account with your email.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setForgotModalOpen(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
