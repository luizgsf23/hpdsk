
import React from 'react';
import { Contract } from '../types';
import { PencilSquareIcon, CalendarDaysIcon, ExclamationTriangleIcon } from './icons';

interface ContractItemProps {
  contract: Contract;
  onEditContract: (contractId: string) => void;
}

const ContractItemInner: React.FC<ContractItemProps> = ({ contract, onEditContract }) => {
  const formatDate = (dateInput: Date | string | undefined | null) => {
    if (!dateInput) return 'N/A';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isExpiringSoon = () => {
    const expiryDate = new Date(contract.renewalOrExpiryDate);
    const notificationDate = new Date(expiryDate);
    notificationDate.setDate(expiryDate.getDate() - contract.expiryNotificationDays);
    const today = new Date();
    today.setHours(0,0,0,0); 
    return today >= notificationDate && today <= expiryDate;
  };
  
  const isExpired = new Date(contract.renewalOrExpiryDate) < new Date(new Date().setHours(0,0,0,0)); // Compare against start of today

  let cardBorderColor = 'border-gray-700 hover:border-gray-600';
  if (isExpired) {
    cardBorderColor = 'border-red-700 hover:border-red-600 opacity-70';
  } else if (isExpiringSoon()) {
    cardBorderColor = 'border-yellow-600 hover:border-yellow-500';
  }

  return (
    <li
      className={`block p-4 mb-3 rounded-lg shadow-lg transition-all duration-200 ease-in-out bg-gray-800 border ${cardBorderColor} focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900`}
      aria-label={`Contrato: ${contract.companyName} - ${contract.contractNumber}`}
    >
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex-grow min-w-0">
          <h3 className="text-base font-semibold text-purple-300 group-hover:text-purple-200 transition-colors pr-2 truncate" title={contract.companyName}>
            {contract.companyName}
          </h3>
          <p className="text-xs text-gray-400 truncate" title={contract.contractNumber}>
            Nº Contrato: {contract.contractNumber}
          </p>
        </div>
        <div className="flex-shrink-0 ml-2 flex items-center space-x-2">
          {isExpiringSoon() && !isExpired && (
            <span title="Vencendo em breve!">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
            </span>
          )}
          {isExpired && (
            <span title="Contrato Vencido!">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            </span>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onEditContract(contract.id);}} 
            className="p-1.5 rounded-md text-gray-400 hover:text-purple-400 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
            aria-label={`Editar contrato ${contract.contractNumber}`}
            title="Editar Contrato"
          >
            <PencilSquareIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="mb-2">
        <p className="text-sm text-gray-200 font-medium truncate" title={contract.productOrServiceName}>
          Serviço/Produto: {contract.productOrServiceName}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-xs mb-3.5">
        <div>
          <p className="text-gray-400">Início:</p>
          <p className="text-gray-300 flex items-center">
            <CalendarDaysIcon className="w-3.5 h-3.5 mr-1 text-gray-500"/> {formatDate(contract.startDate)}
          </p>
        </div>
        <div>
          <p className={`text-gray-400 ${isExpiringSoon() || isExpired ? 'font-semibold' : ''}`}>Renovação/Venc.:</p>
          <p className={`text-gray-300 flex items-center ${isExpiringSoon() && !isExpired ? 'text-yellow-300' : ''} ${isExpired ? 'text-red-300 line-through' : ''}`}>
            <CalendarDaysIcon className="w-3.5 h-3.5 mr-1 text-gray-500"/> {formatDate(contract.renewalOrExpiryDate)}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Valor:</p>
          <p className="text-gray-300">R$ {contract.contractValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <span className="text-xs text-gray-500">ID: {contract.id.substring(0,8)}...</span>
        {contract.endDate && new Date(contract.endDate) < new Date(new Date().setHours(0,0,0,0)) && ( // check if end date has passed
            <span className="text-xs text-red-400 font-semibold">TERMINADO em {formatDate(contract.endDate)}</span>
        )}
      </div>
    </li>
  );
};

const ContractItem = React.memo(ContractItemInner);
export default ContractItem;