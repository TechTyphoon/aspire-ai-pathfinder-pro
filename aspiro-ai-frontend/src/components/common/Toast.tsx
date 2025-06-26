// src/components/common/Toast.tsx
import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon as CloseIcon } from '@heroicons/react/24/solid'; // Using solid for more impact

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: number;
  message: string;
  type: NotificationType;
  onDismiss: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 5000); // Corresponds to auto-dismiss in context, but good to have fallback
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-400" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600/80 border-green-500';
      case 'error':
        return 'bg-red-600/80 border-red-500';
      case 'info':
        return 'bg-blue-600/80 border-blue-500';
      case 'warning':
        return 'bg-yellow-600/80 border-yellow-500';
      default:
        return 'bg-surface border-gray-600';
    }
  };

  return (
    <div
      className={`max-w-sm w-full bg-opacity-90 backdrop-blur-md text-white shadow-2xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden my-2 border-l-4 ${getBackgroundColor()} animate-fadeIn`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold text-gray-100 capitalize">{type}</p>
            <p className="mt-1 text-sm text-gray-200">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onDismiss(id)}
              className="inline-flex rounded-md text-gray-300 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-dark"
            >
              <span className="sr-only">Close</span>
              <CloseIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
