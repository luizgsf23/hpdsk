
import React, { useState, useEffect } from 'react';
import { EquipmentItem, EquipmentType, EquipmentStatus } from '../types';
import { PlusIcon, ArrowLeftIcon, CalendarDaysIcon } from './icons';
import FeedbackAlert from './FeedbackAlert';
import type { AppFeedback } from '../App';

export interface InventoryItemFormData {
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  location?: string | null;
  serial_number?: string | null;
  patrimony_number?: string | null;
  supplier?: string | null;
  purchase_date?: string | null; 
  warranty_end_date?: string | null; 
  purchase_value?: number | null; 
  assigned_to_user_name?: string | null;
  notes?: string | null;
}

interface InventoryItemFormProps {
  onSubmitItem: (itemData: InventoryItemFormData) => Promise<AppFeedback & { itemId?: string }>;
  onCancel: () => void;
  isLoading: boolean;
  initialItemData?: EquipmentItem | null;
}

const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  onSubmitItem,
  onCancel,
  isLoading,
  initialItemData,
}) => {
  const [formData, setFormData] = useState<InventoryItemFormData>({
    name: '',
    type: EquipmentType.OUTRO,
    status: EquipmentStatus.EM_ESTOQUE,
    location: 'Estoque Principal',
    serial_number: '',
    patrimony_number: '',
    supplier: '',
    purchase_date: '',
    warranty_end_date: '',
    purchase_value: null,
    assigned_to_user_name: '',
    notes: '',
  });
  const [feedback, setFeedback] = useState<AppFeedback | null>(null);

  useEffect(() => {
    if (initialItemData) {
      setFormData({
        name: initialItemData.name,
        type: initialItemData.type,
        status: initialItemData.status,
        location: initialItemData.location || '',
        serial_number: initialItemData.serial_number || '',
        patrimony_number: initialItemData.patrimony_number || '',
        supplier: initialItemData.supplier || '',
        purchase_date: initialItemData.purchase_date ? (typeof initialItemData.purchase_date === 'string' ? initialItemData.purchase_date.split('T')[0] : new Date(initialItemData.purchase_date).toISOString().split('T')[0]) : '',
        warranty_end_date: initialItemData.warranty_end_date ? (typeof initialItemData.warranty_end_date === 'string' ? initialItemData.warranty_end_date.split('T')[0] : new Date(initialItemData.warranty_end_date).toISOString().split('T')[0]) : '',
        purchase_value: initialItemData.purchase_value === undefined ? null : initialItemData.purchase_value,
        assigned_to_user_name: initialItemData.assigned_to_user_name || '',
        notes: initialItemData.notes || '',
      });
    } else {
      setFormData({
        name: '',
        type: EquipmentType.NOTEBOOK, 
        status: EquipmentStatus.EM_ESTOQUE,
        location: 'Estoque Principal',
        serial_number: '',
        patrimony_number: '',
        supplier: '',
        purchase_date: '',
        warranty_end_date: '',
        purchase_value: null,
        assigned_to_user_name: '',
        notes: '',
      });
    }
    setFeedback(null);
  }, [initialItemData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: value === '' ? null : parseFloat(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!formData.name.trim() || !formData.type || !formData.status) {
      setFeedback({ type: 'error', message: "Por favor, preencha os campos obrigatórios (Nome, Tipo, Status)." });
      return;
    }
    const payload = {
        ...formData,
        purchase_value: formData.purchase_value === null || isNaN(Number(formData.purchase_value)) ? null : Number(formData.purchase_value)
    };

    const result = await onSubmitItem(payload);
    if (result.type === 'error' && !result.itemId) {
      setFeedback(result);
    }
  };

  const formTitle = initialItemData ? "Editar Item do Inventário" : "Adicionar Novo Item ao Estoque";

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-3xl mx-auto h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-purple-400">{formTitle}</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-md hover:bg-gray-700" aria-label="Voltar">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
      </div>

      {feedback && <FeedbackAlert type={feedback.type} message={feedback.message} onDismiss={() => setFeedback(null)} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nome do Item <span className="text-red-500">*</span></label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                    placeholder="Ex: Notebook Dell XPS 13" />
            </div>
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">Tipo <span className="text-red-500">*</span></label>
                <select name="type" id="type" value={formData.type} onChange={handleChange} required
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white">
                    {Object.values(EquipmentType).map(val => (<option key={val} value={val}>{val}</option>))}
                </select>
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status <span className="text-red-500">*</span></label>
                <select name="status" id="status" value={formData.status} onChange={handleChange} required
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white">
                    {Object.values(EquipmentStatus).map(val => (<option key={val} value={val}>{val}</option>))}
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">Localização</label>
                <input type="text" name="location" id="location" value={formData.location || ''} onChange={handleChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                    placeholder="Ex: Estoque TI, Setor Financeiro" />
            </div>
            <div>
                <label htmlFor="serial_number" className="block text-sm font-medium text-gray-300 mb-1">Nº de Série</label>
                <input type="text" name="serial_number" id="serial_number" value={formData.serial_number || ''} onChange={handleChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400" />
            </div>
            <div>
                <label htmlFor="patrimony_number" className="block text-sm font-medium text-gray-300 mb-1">Nº de Patrimônio</label>
                <input type="text" name="patrimony_number" id="patrimony_number" value={formData.patrimony_number || ''} onChange={handleChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
                <label htmlFor="supplier" className="block text-sm font-medium text-gray-300 mb-1">Fornecedor</label>
                <input type="text" name="supplier" id="supplier" value={formData.supplier || ''} onChange={handleChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400" />
            </div>
            <div>
                <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-300 mb-1">Data da Compra</label>
                <div className="relative">
                    <input type="date" name="purchase_date" id="purchase_date" value={formData.purchase_date || ''} onChange={handleChange}
                        className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white" />
                    <CalendarDaysIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
            </div>
            <div>
                <label htmlFor="warranty_end_date" className="block text-sm font-medium text-gray-300 mb-1">Fim da Garantia</label>
                <div className="relative">
                    <input type="date" name="warranty_end_date" id="warranty_end_date" value={formData.warranty_end_date || ''} onChange={handleChange}
                        className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white" />
                    <CalendarDaysIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                </div>
            </div>
        </div>
        
         <div className="grid grid-cols-1 md:grid-cols-2 gap-5"> 
            <div>
                <label htmlFor="purchase_value" className="block text-sm font-medium text-gray-300 mb-1">Valor da Compra (R$)</label>
                <input type="number" name="purchase_value" id="purchase_value" value={formData.purchase_value === null || formData.purchase_value === undefined ? '' : formData.purchase_value} onChange={handleChange} step="0.01"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                    placeholder="Ex: 1250.99" />
            </div>
            <div>
                <label htmlFor="assigned_to_user_name" className="block text-sm font-medium text-gray-300 mb-1">Atribuído a (Usuário)</label>
                <input type="text" name="assigned_to_user_name" id="assigned_to_user_name" value={formData.assigned_to_user_name || ''} onChange={handleChange}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                    placeholder="Nome do usuário ou ID" />
            </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Notas Adicionais</label>
          <textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleChange} rows={4}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
            placeholder="Observações, histórico de manutenção, etc." />
        </div>
        
        <div className="flex justify-end pt-3">
          <button type="button" onClick={onCancel} disabled={isLoading}
            className="px-6 py-3 mr-3 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={isLoading}
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <PlusIcon className="w-5 h-5 mr-2" />}
            {initialItemData ? "Salvar Alterações" : "Adicionar Item"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryItemForm;
