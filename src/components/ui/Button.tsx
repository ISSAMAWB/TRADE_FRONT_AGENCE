import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
  disabled = false,
}: ButtonProps) {
  const baseClasses = "inline-flex items-center gap-2 rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-orange-500 text-white hover:bg-orange-600 shadow-sm",
    secondary: "bg-white border border-gray-300 text-gray-900 hover:bg-gray-100",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}
