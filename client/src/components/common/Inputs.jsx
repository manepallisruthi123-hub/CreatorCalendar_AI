import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  type = 'button',
  icon: Icon,
  ...props
}) {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/20 focus:ring-brand-500",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-500",
    outline: "border border-brand-500/40 text-brand-300 hover:bg-brand-500/10 focus:ring-brand-500",
    ghost: "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 focus:ring-slate-600",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 focus:ring-rose-500",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 focus:ring-emerald-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : null}
      {children}
    </button>
  );
}

export function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3.5 py-2 bg-slate-800/90 border ${
          error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-700 focus:border-brand-500 focus:ring-brand-500'
        } rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${className}`}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export function Textarea({
  label,
  error,
  helperText,
  rows = 3,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`w-full px-3.5 py-2 bg-slate-800/90 border ${
          error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-700 focus:border-brand-500 focus:ring-brand-500'
        } rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${className}`}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export function Select({
  label,
  error,
  options = [],
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`w-full px-3.5 py-2 bg-slate-800/90 border ${
          error ? 'border-rose-500' : 'border-slate-700 focus:border-brand-500 focus:ring-brand-500'
        } rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-1 transition-all ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-800 text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
    </div>
  );
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) {
  const variants = {
    default: "bg-slate-800 text-slate-300 border border-slate-700",
    brand: "bg-brand-500/15 text-brand-300 border border-brand-500/30",
    success: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    info: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs font-medium rounded",
    md: "px-2.5 py-1 text-xs font-medium rounded-full",
    lg: "px-3 py-1.5 text-sm font-medium rounded-full",
  };

  return (
    <span className={`inline-flex items-center gap-1 ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
