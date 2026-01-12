import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // [UPDATED] Added 'glass' and 'subtle' to the type definition
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export default function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  
  // 1. Base Styles (Layout, Fonts, Transitions)
  const baseStyles = "relative inline-flex items-center justify-center rounded-xl font-bold font-mono tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#020408]";
  
  // 2. Variants (Colors & Borders)
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] border border-indigo-400/50",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 hover:border-slate-500",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 hover:border-red-400",
    ghost: "bg-transparent hover:bg-white/5 text-slate-400 hover:text-white",
    // [NEW] Added glass variant to fix build error
    glass: "bg-white/5 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20 shadow-xl",
    // [NEW] Added subtle variant for low-priority actions
    subtle: "bg-slate-900/50 text-slate-500 border border-white/5 hover:text-slate-300 hover:border-white/10"
  };

  // 3. Sizes (Padding & Text)
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base md:text-lg" 
  };

  // 4. Width Logic
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${widthClass} 
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="opacity-80">Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}