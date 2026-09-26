import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Inputs';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useToast } from '../components/common/Toast';

export function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      // Try login first
      await login('demo@creatorcalendar.ai', 'demo123456');
      toast.success('Logged in with Demo Account!');
      navigate('/dashboard');
    } catch (err) {
      // If demo user doesn't exist yet, register it automatically!
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-brand-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            CreatorCalendar <span className="text-xs uppercase font-extrabold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">AI</span>
          </span>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-100">Sign in to your workspace</h2>
        <p className="mt-1.5 text-xs text-slate-400">
          Or{' '}
          <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full" size="md" loading={loading}>
                Sign In
              </Button>
            </div>
          </form>

          {/* Quick Demo Button */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 mb-3">Testing or evaluating CreatorCalendar AI?</p>
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
    </div>
  );
}

export default Login;
