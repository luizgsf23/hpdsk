
import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon, InformationCircleIcon } from './icons';

interface FeedbackAlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const FeedbackAlert: React.FC<FeedbackAlertProps> = ({ type, message, onDismiss, className = '' }) => {
  let IconComponent;
  let bgColor, borderColor, textColor, iconColor, hoverBgColor, ringFocusColor, ringOffsetColor;

  switch (type) {
    case 'success':
      IconComponent = CheckCircleIcon;
      bgColor = 'bg-purple-900'; // Dark purple bg
      borderColor = 'border-purple-700'; // Darker purple border
      textColor = 'text-purple-200'; // Light purple text
      iconColor = 'text-purple-400'; // Brighter purple icon
      hoverBgColor = 'hover:bg-purple-800'; // Slightly lighter dark purple hover
      ringFocusColor = 'focus:ring-purple-500';
      ringOffsetColor = 'focus:ring-offset-purple-900';
      break;
    case 'error': // Kept semantic red, adjusted for dark theme
      IconComponent = ExclamationTriangleIcon;
      bgColor = 'bg-red-900'; 
      borderColor = 'border-red-700'; 
      textColor = 'text-red-200'; 
      iconColor = 'text-red-400'; 
      hoverBgColor = 'hover:bg-red-800';
      ringFocusColor = 'focus:ring-red-500';
      ringOffsetColor = 'focus:ring-offset-red-900';
      break;
    case 'info':
      IconComponent = InformationCircleIcon;
      bgColor = 'bg-indigo-900'; // Dark indigo bg for info
      borderColor = 'border-indigo-700';
      textColor = 'text-indigo-200';
      iconColor = 'text-indigo-400';
      hoverBgColor = 'hover:bg-indigo-800';
      ringFocusColor = 'focus:ring-indigo-500';
      ringOffsetColor = 'focus:ring-offset-indigo-900';
      break;
    case 'warning': // Kept semantic yellow, adjusted for dark theme
      IconComponent = ExclamationTriangleIcon;
      bgColor = 'bg-yellow-800'; // Darker yellow bg, less intense text
      borderColor = 'border-yellow-700';
      textColor = 'text-yellow-200'; 
      iconColor = 'text-yellow-400';
      hoverBgColor = 'hover:bg-yellow-700';
      ringFocusColor = 'focus:ring-yellow-500';
      ringOffsetColor = 'focus:ring-offset-yellow-800';
      break;
    default:
      IconComponent = InformationCircleIcon;
      bgColor = 'bg-gray-700'; 
      borderColor = 'border-gray-600'; 
      textColor = 'text-gray-200'; 
      iconColor = 'text-gray-400'; 
      hoverBgColor = 'hover:bg-gray-600';
      ringFocusColor = 'focus:ring-gray-500';
      ringOffsetColor = 'focus:ring-offset-gray-700';
      break;
  }

  return (
    <div className={`p-4 rounded-md border ${bgColor} ${borderColor} flex items-start shadow-md print:hidden ${className}`} role="alert">
      <div className={`flex-shrink-0 ${iconColor}`}>
        <IconComponent className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className={`ml-3 flex-grow ${textColor}`}>
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onDismiss && (
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={onDismiss}
              className={`inline-flex rounded-md p-1.5 ${textColor} ${hoverBgColor} focus:outline-none focus:ring-2 ${ringOffsetColor} ${ringFocusColor}`}
              aria-label="Dispensar notificação"
            >
              <span className="sr-only">Dispensar</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackAlert;
