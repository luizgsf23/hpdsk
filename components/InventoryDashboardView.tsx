
import React from 'react';
import { EquipmentItem, EquipmentStatus, ViewMode } from '../types'; 
import StatCard from './StatCard';
import { ArchiveBoxIcon, CubeTransparentIcon, BuildingOfficeIcon, ComputerDesktopIcon, WrenchScrewdriverIcon, CubeIcon, PlusIcon } from './icons'; 

interface InventoryDashboardViewProps {
  equipmentItems: EquipmentItem[];
  // equipmentOrders prop removed
  onNavigate: (viewMode: ViewMode) => void;
}

const InventoryDashboardView: React.FC<InventoryDashboardViewProps> = ({
  equipmentItems,
  // equipmentOrders destructuring removed
  onNavigate,
}) => {
  const totalItems = equipmentItems.length;
  const itemsInStock = equipmentItems.filter(item => item.status === EquipmentStatus.EM_ESTOQUE).length;
  const itemsInUse = equipmentItems.filter(item => item.status === EquipmentStatus.EM_USO).length;
  const itemsInMaintenance = equipmentItems.filter(item => item.status === EquipmentStatus.EM_MANUTENCAO).length;

  const NavCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; bgColorClass?: string; iconColorClass?: string }> = ({ title, description, icon, onClick, bgColorClass = 'bg-gray-700', iconColorClass = 'text-purple-400' }) => (
    <button
        onClick={onClick}
        className={`${bgColorClass} p-6 rounded-xl shadow-lg hover:shadow-xl focus:shadow-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-left w-full h-full flex flex-col justify-between`}
    >
        <div>
            <div className={`p-3 rounded-full inline-block ${iconColorClass} bg-gray-800 mb-3`}>
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-gray-300">{description}</p>
        </div>
        <span className="mt-4 text-xs text-purple-400 font-medium self-start hover:underline">Acessar seção &rarr;</span>
    </button>
  );


  return (
    <div className="space-y-6 sm:space-y-8 pb-8 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
      <div className="flex justify-between items-center mb-6 pt-2">
        <h2 className="text-3xl font-semibold text-purple-400 flex items-center">
          <ArchiveBoxIcon className="w-8 h-8 mr-3 text-purple-400" />
          Painel de Inventário
        </h2>
        <button 
            onClick={() => onNavigate('inventoryItemForm')} 
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors flex items-center text-sm font-semibold shadow-md hover:shadow-lg"
            title="Adicionar novo item ao estoque"
        >
            <PlusIcon className="w-5 h-5 mr-2" /> Adicionar Item
        </button>
      </div>

      {/* Equipment Statistics */}
      <section>
        <h3 className="text-xl font-semibold text-purple-300 mb-4">Visão Geral do Inventário</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Total de Itens" value={totalItems} icon={<CubeIcon className="w-7 h-7" />} iconColorClass="text-purple-400" />
          <StatCard title="Em Estoque" value={itemsInStock} icon={<CubeTransparentIcon className="w-7 h-7" />} iconColorClass="text-indigo-400" />
          <StatCard title="Em Uso" value={itemsInUse} icon={<ComputerDesktopIcon className="w-7 h-7" />} iconColorClass="text-teal-400" />
          <StatCard title="Em Manutenção" value={itemsInMaintenance} icon={<WrenchScrewdriverIcon className="w-7 h-7" />} iconColorClass="text-orange-400" />
        </div>
      </section>

      {/* Navigation to Sub-modules */}
      <section className="mt-10">
        <h3 className="text-xl font-semibold text-purple-300 mb-4">Ações Rápidas e Gerenciamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
          <NavCard 
            title="Gerenciar Estoque"
            description="Adicione, visualize e gerencie itens de equipamentos em estoque."
            icon={<CubeTransparentIcon className="w-8 h-8" />}
            onClick={() => onNavigate('inventoryStockList')}
            bgColorClass="bg-gray-700 hover:bg-gray-600"
            iconColorClass="text-indigo-400"
          />
          <NavCard 
            title="Equipamentos por Setor"
            description="Visualize equipamentos alocados para cada setor ou usuário."
            icon={<BuildingOfficeIcon className="w-8 h-8" />}
            onClick={() => onNavigate('inventoryDeployedList')}
            bgColorClass="bg-gray-700 hover:bg-gray-600"
            iconColorClass="text-teal-400"
          />
        </div>
      </section>

      {equipmentItems.length === 0 && ( 
        <div className="bg-gray-800 p-10 rounded-xl shadow-lg text-center text-gray-300 mt-8">
          <ArchiveBoxIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-xl text-gray-100 mb-2">Nenhum item no inventário.</h3>
          <p>Comece adicionando itens ao estoque.</p>
           <div className="mt-4">
            <button 
                onClick={() => onNavigate('inventoryItemForm')} 
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
                Adicionar Item ao Estoque
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboardView;
