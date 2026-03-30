// components/ui/Button.tsx
'use client';

import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const variants: Record<ButtonVariant, string> = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-blue-200 hover:shadow-md',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
  danger:    'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-red-200 hover:shadow-md',
  success:   'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-emerald-200 hover:shadow-md',
  ghost:     'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300',
};

const sizes: Record<ButtonSize, string> = {
  sm:  'px-3 py-1.5 text-xs rounded-lg',
  md:  'px-5 py-2.5 text-sm rounded-xl',
  lg:  'px-7 py-3.5 text-base rounded-xl',
};

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  );
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
      `}
    >
      {loading && <Spinner />}
      {loading ? 'Cargando...' : children}
    </button>
  );
}