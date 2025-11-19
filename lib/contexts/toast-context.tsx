import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View } from 'react-native';
import { Toast, ToastComponent } from '@/components/ui/toast';

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toastData,
      id,
    };

    setToasts(prev => [...prev, newToast]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    toasts,
    toast,
    dismiss,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 9999,
            pointerEvents: 'box-none',
          }}
        >
          {toasts.map((toast, index) => (
            <ToastComponent
              key={toast.id}
              toast={toast}
              onDismiss={dismiss}
              index={index}
            />
          ))}
        </View>
      )}
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

// Convenience hook with the original name for backward compatibility
export const useToast = useToastContext;
