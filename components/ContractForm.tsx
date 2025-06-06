
import React, { useState, useEffect } from 'react';
import { Contract } from '../types';
import { PlusIcon, ArrowLeftIcon, CalendarDaysIcon } from './icons';
import FeedbackAlert from './FeedbackAlert';
import type { AppFeedback } from '../App';

export interface ContractFormData {
  companyName: string;
  contractNumber: string;
  productOrServiceName: string;
  contractValue: number | null; 
  startDate: string; 
  renewalOrExpiryDate: string; 
  endDate?: string | null; 
  description?: string | null;
  expiryNotificationDays: number | null; 
}

interface ContractFormProps {
  onSubmitContract: (contractData: ContractFormData) => Promise<AppFeedback & { contractId?: string }>;
  onCancel: () => void;
  isLoading: boolean;
  initialContractData?: Contract | null;
}

const ContractForm: React.FC<ContractFormProps> = ({
  onSubmitContract,
  onCancel,
  isLoading,
  initialContractData,
}) => {
  const getDefaultFormData = (): ContractFormData => ({
    companyName: '',
    contractNumber: '',
    productOrServiceName: '',
    contractValue: null,
    startDate: new Date().toISOString().split('T')[0],
    renewalOrExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    endDate: '',
    description: '',
    expiryNotificationDays: 30,
  });

  const [formData, setFormData] = useState<ContractFormData>(getDefaultFormData());
  const [feedback, setFeedback] = useState<AppFeedback | null>(null);

  useEffect(() => {
    if (initialContractData) {
      setFormData({
        companyName: initialContractData.companyName,
        contractNumber: initialContractData.contractNumber,
        productOrServiceName: initialContractData.productOrServiceName,
        contractValue: initialContractData.contractValue,
        startDate: typeof initialContractData.startDate === 'string' ? initialContractData.startDate.split('T')[0] : new Date(initialContractData.startDate).toISOString().split('T')[0],
        renewalOrExpiryDate: typeof initialContractData.renewalOrExpiryDate === 'string' ? initialContractData.renewalOrExpiryDate.split('T')[0] : new Date(initialContractData.renewalOrExpiryDate).toISOString().split('T')[0],
        endDate: initialContractData.endDate ? (typeof initialContractData.endDate === 'string' ? initialContractData.endDate.split('T')[0] : new Date(initialContractData.endDate).toISOString().split('T')[0]) : '',
        description: initialContractData.description || '',
        expiryNotificationDays: initialContractData.expiryNotificationDays,
      });
    } else {
      setFormData(getDefaultFormData());
    }
    setFeedback(null);
  }, [initialContractData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (!formData.companyName.trim() || !formData.contractNumber.trim() || !formData.productOrServiceName.trim() || formData.contractValue === null || formData.expiryNotificationDays === null) {
      setFeedback({ type: 'error', message: "Por favor, preencha todos os campos obrigatórios (Nome da Empresa, Nº Contrato, Produto/Serviço, Valor, Dias de Notificação)." });
      return;
    }
    if (formData.contractValue < 0 || formData.expiryNotificationDays < 0) {
        setFeedback({ type: 'error', message: "Valor do contrato e dias de notificação não podem ser negativos." });
        return;
    }
    const result = await onSubmitContract(formData);
    if (result.type === 'error' && !result.contractId) {
      setFeedback(result);
    }
  };

  const formTitle = initialContractData ? "Editar Contrato" : "Adicionar Novo Contrato";

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-1">Nome da Empresa <span className="text-red-500">*</span></label>
            <input type="text" name="companyName" id="companyName" value={formData.companyName} onChange={handleChange} required
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400" />
          </div>
          <div>
            <label htmlFor="contractNumber" className="block text-sm font-medium text-gray-300 mb-1">Número do Contrato <span className="text-red-500">*</span></label>
            <input type="text" name="contractNumber" id="contractNumber" value={formData.contractNumber} onChange={handleChange} required
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400" />
          </div>
        </div>

        <div>
          <label htmlFor="productOrServiceName" className="block text-sm font-medium text-gray-300 mb-1">Nome do Produto / Serviço <span className="text-red-500">*</span></label>
          <input type="text" name="productOrServiceName" id="productOrServiceName" value={formData.productOrServiceName} onChange={handleChange} required
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
                <label htmlFor="contractValue" className="block text-sm font-medium text-gray-300 mb-1">Valor do Contrato (R$) <span className="text-red-500">*</span></label>
                <input type="number" name="contractValue" id="contractValue" value={formData.contractValue === null ? '' : formData.contractValue} onChange={handleChange} required step="0.01"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400" />
            </div>
            <div>
                <label htmlFor="expiryNotificationDays" className="block text-sm font-medium text-gray-300 mb-1">Notificar Vencimento (dias antes) <span className="text-red-500">*</span></label>
                <input type="number" name="expiryNotificationDays" id="expiryNotificationDays" value={formData.expiryNotificationDays === null ? '' : formData.expiryNotificationDays} onChange={handleChange} required step="1"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">Data de Início <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required
                className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white" />
              <CalendarDaysIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label htmlFor="renewalOrExpiryDate" className="block text-sm font-medium text-gray-300 mb-1">Data de Renovação/Venc. <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type="date" name="renewalOrExpiryDate" id="renewalOrExpiryDate" value={formData.renewalOrExpiryDate} onChange={handleChange} required
                className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white" />
              <CalendarDaysIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">Data de Término (Opcional)</label>
            <div className="relative">
              <input type="date" name="endDate" id="endDate" value={formData.endDate || ''} onChange={handleChange}
                className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white" />
              <CalendarDaysIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição / Observações</label>
          <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={4}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
            placeholder="Detalhes do contrato, termos importantes, SLAs, etc." />
        </div>
        
        <div className="flex justify-end pt-3">
          <button type="button" onClick={onCancel} disabled={isLoading}
            className="px-6 py-3 mr-3 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={isLoading}
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <PlusIcon className="w-5 h-5 mr-2" />}
            {initialContractData ? "Salvar Alterações" : "Adicionar Contrato"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContractForm;
