import React, { createContext, useState, useCallback, useContext } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const AUTO_DISMISS_MS = 4000;

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const timeoutRef = React.useRef(null);

  const show = useCallback((message, type = 'error') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ message, type });
    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, AUTO_DISMISS_MS);
  }, []);

  const showError = useCallback((message) => show(message, 'error'), [show]);
  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ show, showError, hide }}>
      {children}
      {toast && (
        <div className="toast-container">
          <div
            className={`toast toast-${toast.type}`}
            role="alert"
            aria-live="polite"
          >
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
