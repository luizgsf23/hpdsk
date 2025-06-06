
import React from 'react';
import { Ticket, UrgencyLevel, TicketStatus } from '../types';
import { 
    BoltIcon, ExclamationTriangleIcon, Bars3BottomLeftIcon, EllipsisHorizontalIcon, 
    ArrowPathIcon, CheckCircleIcon, ClockIcon, XMarkIcon, UserCircleIcon, SparklesIcon
} from './icons';

interface TicketItemProps {
  ticket: Ticket;
  onSelectTicket: (ticketId: string) => void;
  isSelected: boolean;
}

const UrgencyIndicator: React.FC<{ urgency: UrgencyLevel, className?: string }> = ({ urgency, className = "w-5 h-5" }) => {
  switch (urgency) {
    case UrgencyLevel.CRITICAL: return <BoltIcon className={`${className} text-red-500`} />;
    case UrgencyLevel.HIGH: return <ExclamationTriangleIcon className={`${className} text-orange-500`} />;
    case UrgencyLevel.MEDIUM: return <Bars3BottomLeftIcon className={`${className} text-yellow-500`} />; 
    case UrgencyLevel.LOW: return <EllipsisHorizontalIcon className={`${className} text-purple-400`} />; 
    default: return <EllipsisHorizontalIcon className={`${className} text-gray-400`} />;
  }
};

const StatusDisplay: React.FC<{ status: TicketStatus, className?: string }> = ({ status, className }) => {
  let icon: JSX.Element = <ArrowPathIcon className="w-3.5 h-3.5 mr-1.5" />;
  let bgColor = 'bg-gray-700'; 
  let textColor = 'text-gray-200'; 
  let ringColor = 'ring-gray-500'; 

  switch (status) {
    case TicketStatus.OPEN:
      icon = <ArrowPathIcon className="w-3.5 h-3.5 mr-1.5 text-purple-300" />;
      bgColor = 'bg-purple-800'; 
      textColor = 'text-purple-200'; 
      ringColor = 'ring-purple-600';
      break;
    case TicketStatus.PENDING_AI:
      icon = <SparklesIcon className="w-3.5 h-3.5 mr-1.5 text-purple-300" />; 
      bgColor = 'bg-purple-900'; 
      textColor = 'text-purple-200'; 
      ringColor = 'ring-purple-700';
      break;
    case TicketStatus.PENDING_USER:
      icon = <UserCircleIcon className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />; 
      bgColor = 'bg-yellow-700'; 
      textColor = 'text-yellow-100'; 
      ringColor = 'ring-yellow-500';
      break;
    case TicketStatus.RESOLVED:
      icon = <CheckCircleIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-300" />; 
      bgColor = 'bg-indigo-800'; 
      textColor = 'text-indigo-200'; 
      ringColor = 'ring-indigo-600';
      break;
    case TicketStatus.CANCELLED: 
      icon = <XMarkIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400" />;
      bgColor = 'bg-gray-700'; 
      textColor = 'text-gray-300'; 
      ringColor = 'ring-gray-500';
      break;
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${bgColor} ${textColor} ring-1 ring-inset ${ringColor} ${className}`}>
      {icon}
      {status}
    </span>
  );
};


const TicketItemInner: React.FC<TicketItemProps> = ({ ticket, onSelectTicket, isSelected }) => {
  const title = `${ticket.category}: ${ticket.description.substring(0, 40)}${ticket.description.length > 40 ? "..." : ""}`;
  
  const formatDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  return (
    <li
      onClick={() => onSelectTicket(ticket.id)}
      className={`
        block p-4 mb-3 rounded-lg shadow-lg cursor-pointer transition-all duration-200 ease-in-out 
        focus-visible:outline-purple-500 focus-visible:outline-2 focus-visible:outline-offset-2
        ${isSelected 
          ? 'bg-purple-600/90 border-2 border-purple-500 shadow-purple-700/40' 
          : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-600'
        }
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectTicket(ticket.id); }}
      aria-current={isSelected ? "true" : "false"}
      aria-label={`Selecionar ticket: ${title}, status ${ticket.status}`}
    >
      <div className="flex justify-between items-start mb-2.5">
        <h3 className={`text-base font-semibold ${isSelected ? 'text-white' : 'text-purple-300'} group-hover:text-purple-200 transition-colors pr-2 truncate`} title={title}>
          {title}
        </h3>
        <div className="flex-shrink-0 ml-2">
          <UrgencyIndicator urgency={ticket.urgency} className="w-5 h-5" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-3 text-xs mb-3">
        <div>
            <p className={` ${isSelected ? 'text-purple-100' : 'text-gray-400'}`}>Solicitante:</p>
            <p className={`${isSelected ? 'text-white' : 'text-gray-200'} font-medium truncate`} title={ticket.user_name}>{ticket.user_name}</p>
        </div>
        <div>
            <p className={` ${isSelected ? 'text-purple-100' : 'text-gray-400'}`}>Setor:</p>
            <p className={`${isSelected ? 'text-white' : 'text-gray-200'} font-medium truncate`} title={ticket.department}>{ticket.department}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 text-xs mb-3.5">
         <div>
            <p className={isSelected ? 'text-purple-100' : 'text-gray-400'}>Criado em:</p>
            <p className={isSelected ? 'text-purple-50' : 'text-gray-300'}>{formatDate(ticket.created_at)}</p>
        </div>
        <div>
            <p className={isSelected ? 'text-purple-100' : 'text-gray-400'}>Atualizado:</p>
            <p className={isSelected ? 'text-purple-50' : 'text-gray-300'}>{formatDate(ticket.updated_at)}</p>
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <StatusDisplay status={ticket.status} />
        <span className={`text-xs ${isSelected ? 'text-purple-100' : 'text-gray-400'}`}>ID: {ticket.id.substring(0,8)}...</span>
      </div>
    </li>
  );
};

const TicketItem = React.memo(TicketItemInner);
export default TicketItem;