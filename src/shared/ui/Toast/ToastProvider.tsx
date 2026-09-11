import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { View, StyleSheet } from 'react-native';

import { Toast } from './Toast';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export type ShowToastOptions = {
  message: string;
  /** Visual variant. @default 'info' */
  variant?: ToastVariant;
  /** Auto-dismiss delay in ms. @default 3000 */
  duration?: number;
};

export type ToastContextValue = {
  show: (options: ShowToastOptions) => void;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return value;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

type ToastState = {
  key: number;
  message: string;
  variant: ToastVariant;
  duration: number;
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const keyRef = useRef(0);

  const show = useCallback((options: ShowToastOptions) => {
    keyRef.current += 1;
    setToast({
      key: keyRef.current,
      message: options.message,
      variant: options.variant ?? 'info',
      duration: options.duration ?? 3000,
    });
  }, []);

  const dismiss = useCallback(() => {
    setToast(null);
  }, []);

  const contextValue = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={contextValue}>
      <View style={styles.root}>
        {children}
        {toast && (
          <Toast
            key={toast.key}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onDismiss={dismiss}
          />
        )}
      </View>
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
