
import React from 'react';
import { EquipmentItem, ViewMode, EquipmentStatus } from '../types';
import { BuildingOfficeIcon, InformationCircleIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface InventoryDeployedListProps {
  equipmentItems: EquipmentItem[];
  onNavigate: (viewMode: ViewMode) => void;
  isLoading: boolean;
}

const InventoryDeployedList: React.FC<InventoryDeployedListProps> = ({ equipmentItems, onNavigate, isLoading }) => {
  // Placeholder for filtering logic
  const deployedItems = equipmentItems.filter(
    item => item.status === EquipmentStatus.EM_USO || item.status === EquipmentStatus.EMPRESTADO || item.status === EquipmentStatus.EM_MANUTENCAO
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-900 rounded-lg shadow-xl h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-700">
        <h2 className="text-2xl sm:text-3xl font-semibold text-purple-400 flex items-center">
          <BuildingOfficeIcon className="w-8 h-8 mr-3 text-purple-400" />
          Equipamentos por Setor/Usuário
        </h2>
        {/* Button to "Assign Item" or filter could go here */}
      </div>

       {isLoading && deployedItems.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-gray-400">
          <LoadingSpinner size="w-12 h-12" />
          <p className="ml-3">Carregando itens implantados...</p>
        </div>
      ) : deployedItems.length === 0 ? (
        <div className="text-center text-gray-400 py-10 flex-grow flex flex-col items-center justify-center bg-gray-800/50 rounded-md">
            <InformationCircleIcon className="w-16 h-16 text-gray-500 mb-6" />
            <p className="text-xl font-semibold text-gray-200 mb-2">Nenhum equipamento implantado/em uso.</p>
            <p className="text-sm">Quando itens forem alocados, aparecerão aqui.</p>
        </div>
      ) : (
         <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Local/Usuário</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nº Patrimônio</th>
                 <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {deployedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-300 truncate max-w-xs" title={item.name}>{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === EquipmentStatus.EM_USO ? 'bg-teal-800 text-teal-200' :
                        item.status === EquipmentStatus.EMPRESTADO ? 'bg-blue-800 text-blue-200' :
                        item.status === EquipmentStatus.EM_MANUTENCAO ? 'bg-orange-800 text-orange-200' :
                        'bg-gray-700 text-gray-300'
                    }`}>
                        {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs" title={item.location || item.assigned_to_user_name || ''}>
                    {item.location || item.assigned_to_user_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.patrimony_number || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                     <button
                      onClick={() => alert(`Visualizar detalhes do item ${item.id}`)} // Placeholder
                      className="text-purple-400 hover:text-purple-300 p-1 rounded-md hover:bg-gray-700 transition-colors"
                      title="Ver Detalhes"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-auto pt-6 text-center">
        <p className="text-sm text-gray-500">Esta seção listará equipamentos em uso, manutenção ou emprestados. Funcionalidades completas em desenvolvimento.</p>
        <button onClick={() => onNavigate('inventoryDashboard')} className="mt-2 text-sm text-purple-400 hover:text-purple-300">
          &larr; Voltar ao Painel de Inventário
        </button>
      </div>
    </div>
  );
};

export default InventoryDeployedList;
