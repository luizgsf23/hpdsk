
import React from 'react';
import { EquipmentItem, ViewMode, EquipmentStatus } from '../types';
import { CubeTransparentIcon, PlusIcon, PencilSquareIcon, InformationCircleIcon } from './icons';
import LoadingSpinner from './LoadingSpinner'; // Assuming LoadingSpinner exists

interface InventoryStockListProps {
  equipmentItems: EquipmentItem[];
  onNavigate: (viewMode: ViewMode) => void;
  onEditItem: (itemId: string) => void;
  onAddItem: () => void;
  isLoading: boolean;
}

const InventoryStockList: React.FC<InventoryStockListProps> = ({ equipmentItems, onNavigate, onEditItem, onAddItem, isLoading }) => {
  // Placeholder for more advanced filtering and sorting
  const stockItems = equipmentItems.filter(
    item => item.status === EquipmentStatus.EM_ESTOQUE || item.status === EquipmentStatus.PEDIDO
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-900 rounded-lg shadow-xl h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-700">
        <h2 className="text-2xl sm:text-3xl font-semibold text-purple-400 flex items-center mb-3 sm:mb-0">
          <CubeTransparentIcon className="w-8 h-8 mr-3 text-purple-400" />
          Gerenciar Estoque
        </h2>
        <button
          onClick={onAddItem}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-md flex items-center justify-center transition-colors text-sm shadow-md hover:shadow-lg"
        >
          <PlusIcon className="w-5 h-5 mr-2" /> Adicionar Novo Item
        </button>
      </div>

      {isLoading && stockItems.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-gray-400">
          <LoadingSpinner size="w-12 h-12" />
          <p className="ml-3">Carregando itens do estoque...</p>
        </div>
      ) : stockItems.length === 0 ? (
        <div className="text-center text-gray-400 py-10 flex-grow flex flex-col items-center justify-center bg-gray-800/50 rounded-md">
            <InformationCircleIcon className="w-16 h-16 text-gray-500 mb-6" />
            <p className="text-xl font-semibold text-gray-200 mb-2">Nenhum item em estoque.</p>
            <p className="text-sm">Clique em "Adicionar Novo Item" para começar.</p>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Localização</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nº Série</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Patrimônio</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {stockItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-300 truncate max-w-xs" title={item.name}>{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === EquipmentStatus.EM_ESTOQUE ? 'bg-indigo-800 text-indigo-200' :
                        item.status === EquipmentStatus.PEDIDO ? 'bg-yellow-800 text-yellow-200' :
                        'bg-gray-700 text-gray-300'
                    }`}>
                        {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs" title={item.location || ''}>{item.location || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.serial_number || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.patrimony_number || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => onEditItem(item.id)}
                      className="text-purple-400 hover:text-purple-300 p-1 rounded-md hover:bg-gray-700 transition-colors"
                      title="Editar Item"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    {/* Add more actions here like "Allocate", "View Details" */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-auto pt-6 text-center">
        <p className="text-sm text-gray-500">Funcionalidades avançadas como filtros detalhados, paginação e mais ações serão implementadas.</p>
      </div>
    </div>
  );
};

export default InventoryStockList;
