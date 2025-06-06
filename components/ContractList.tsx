
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Contract } from '../types';
import ContractItem from './ContractItem';
import { DocumentDuplicateIcon, PlusIcon, InformationCircleIcon, MagnifyingGlassIcon, ChevronDownIcon, FilterIcon, XMarkIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface ContractListProps {
  contracts: Contract[];
  isLoading: boolean;
  onNewContract: () => void;
  onEditContract: (contractId: string) => void;
}

type SortContractsBy = 'companyNameAsc' | 'expiryDateAsc' | 'startDateDesc' | 'valueDesc';

const ContractList: React.FC<ContractListProps> = ({ contracts, isLoading, onNewContract, onEditContract }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortContractsBy>('expiryDateAsc');
  // Future: Add status filter (e.g., Active, Expiring Soon, Expired)
  // const [statusFilter, setStatusFilter] = useState<string>('all'); 

  const filteredAndSortedContracts = useMemo(() => {
    let processedContracts = [...contracts];

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedContracts = processedContracts.filter(contract =>
        contract.companyName.toLowerCase().includes(lowerSearchTerm) ||
        contract.contractNumber.toLowerCase().includes(lowerSearchTerm) ||
        contract.productOrServiceName.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Sorting
    switch (sortBy) {
      case 'companyNameAsc':
        processedContracts.sort((a, b) => a.companyName.localeCompare(b.companyName));
        break;
      case 'expiryDateAsc':
        processedContracts.sort((a, b) => new Date(a.renewalOrExpiryDate).getTime() - new Date(b.renewalOrExpiryDate).getTime());
        break;
      case 'startDateDesc':
        processedContracts.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        break;
      case 'valueDesc':
        processedContracts.sort((a,b) => b.contractValue - a.contractValue);
        break;
      default:
        processedContracts.sort((a, b) => new Date(a.renewalOrExpiryDate).getTime() - new Date(b.renewalOrExpiryDate).getTime());
    }
    return processedContracts;
  }, [contracts, searchTerm, sortBy]);


  return (
    <div className="p-3 sm:p-4 md:p-6 bg-gray-900 rounded-lg shadow-xl h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-3 border-b border-gray-700">
        <h2 className="text-xl sm:text-2xl font-bold text-purple-400 mb-3 sm:mb-0 flex items-center">
            <DocumentDuplicateIcon className="w-6 h-6 sm:w-7 sm:h-7 mr-2 sm:mr-2.5"/>
            Contratos
        </h2>
        <button
          onClick={onNewContract}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-3 sm:py-2.5 sm:px-4 rounded-md flex items-center justify-center transition-all duration-150 ease-in-out shadow-md hover:shadow-lg active:bg-purple-700 text-xs sm:text-sm"
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" /> Adicionar Contrato
        </button>
      </div>
      
      {/* Controls: Search and Sort */}
      <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar por empresa, nº contrato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 pl-10 text-sm bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-colors"
            aria-label="Pesquisar contratos"
          />
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortContractsBy)}
              className="w-full p-2.5 pr-8 text-sm bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white appearance-none transition-colors"
              aria-label="Ordenar contratos por"
            >
              <option value="expiryDateAsc">Vencimento (Próximos)</option>
              <option value="companyNameAsc">Empresa (A-Z)</option>
              <option value="startDateDesc">Início (Recentes)</option>
              <option value="valueDesc">Valor (Maior)</option>
            </select>
            <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
       <div className="text-xs text-gray-400 mb-2 px-1">
        Exibindo {filteredAndSortedContracts.length} de {contracts.length} contratos.
      </div>


      {isLoading && contracts.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-gray-400">
          <LoadingSpinner size="w-10 h-10 sm:w-12 sm:h-12" />
          <p className="ml-2 sm:ml-3">Carregando contratos...</p>
        </div>
      ) : filteredAndSortedContracts.length === 0 ? (
        <div className="text-center text-gray-400 py-10 flex-grow flex flex-col items-center justify-center bg-gray-800/50 rounded-md">
          <InformationCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mb-4 sm:mb-6" />
          { (searchTerm) ? (
            <>
              <p className="text-lg sm:text-xl font-semibold text-gray-200 mb-2">Nenhum contrato encontrado</p>
              <p className="text-xs sm:text-sm mb-3 sm:mb-4">Tente ajustar sua busca.</p>
              <button 
                onClick={() => { setSearchTerm(''); }}
                className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 p-1.5 sm:p-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Limpar busca
              </button>
            </>
          ) : (
            <>
              <p className="text-lg sm:text-xl font-semibold text-gray-200 mb-2">Nenhum contrato registrado.</p>
              <p className="text-xs sm:text-sm">Clique em "Adicionar Contrato" para começar.</p>
            </>
          )}
        </div>
      ) : (
        <ul className="overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1">
          {filteredAndSortedContracts.map(contract => (
            <ContractItem
              key={contract.id}
              contract={contract}
              onEditContract={onEditContract}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContractList;
