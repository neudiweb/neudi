import * as React from 'react';

export interface ModalProps {
  children: React.ReactNode;
  /**
   * Full-screen shell classes, e.g. "fixed inset-0 z-50 flex items-center justify-center px-4".
   * When omitted, renders bare fragment (sibling backdrop + panel) — used for bottom sheets
   * where the backdrop is a separate fixed layer.
   */
  shellClassName?: string;
  /** Backdrop layer classes. Omit to render no backdrop (e.g. shell is the backdrop). */
  backdropClassName?: string;
  /** Inline style for the backdrop layer */
  backdropStyle?: React.CSSProperties;
  /** Panel classes */
  panelClassName?: string;
  /** Inline style for the panel */
  panelStyle?: React.CSSProperties;
  /** Fired when the backdrop is clicked. Omit to make the backdrop inert. */
  onBackdropClick?: () => void;
  /** data-testid on the outer shell (when shellClassName is provided) */
  testId?: string;
  /** data-testid on the backdrop layer */
  backdropTestId?: string;
  /** role attribute on the outer shell (optional) */
  role?: string;
}

export function Modal({
  children,
  shellClassName,
  backdropClassName,
  backdropStyle,
  panelClassName,
  panelStyle,
  onBackdropClick,
  testId,
  backdropTestId,
  role,
}: ModalProps) {
  const backdrop = backdropClassName ? (
    <div
      className={backdropClassName}
      style={backdropStyle}
      onClick={onBackdropClick}
      data-testid={backdropTestId}
    />
  ) : null;
  const panel = (
    <div className={panelClassName} style={panelStyle}>
      {children}
    </div>
  );
  if (shellClassName) {
    return (
      <div className={shellClassName} data-testid={testId} role={role}>
        {backdrop}
        {panel}
      </div>
    );
  }
  return (
    <>
      {backdrop}
      {panel}
    </>
  );
}
