import * as React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const baseClass = `btn btn-${variant} btn-${size}`;
  const classes = className ? `${baseClass} ${className}` : baseClass;

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
