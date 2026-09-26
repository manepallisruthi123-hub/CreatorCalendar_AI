import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Inputs';
import { GoogleButton } from '../components/common/GoogleButton';
import { Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { useToast } from '../components/common/Toast';

export function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both passwords.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, confirmPassword);
      toast.success('Account created successfully! Welcome to CreatorCalendar AI.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
        <h1 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">Create your account</h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
          Get started with AI-driven content strategy for your brand.
        </p>
      </div>

      {/* Register Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl backdrop-blur-sm">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              type="text"
              placeholder="Your name or channel name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full font-semibold" size="md" loading={loading}>
                Create Account
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

          {/* Already have an account? Sign in */}
          <div className="mt-6 text-center text-xs text-slate-400">
            <span>Already have an account? </span>
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
              Sign in
            </Link>
          </div>

          {/* Security badge footer */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected with bcrypt hashing & secure session tokens</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
