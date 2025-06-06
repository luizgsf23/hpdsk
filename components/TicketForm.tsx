
import React, { useState, useEffect } from 'react';
import { IssueCategory, UrgencyLevel } from '../types'; 
import { PlusIcon, ArrowLeftIcon } from './icons';
import FeedbackAlert from './FeedbackAlert'; 
import type { AppFeedback } from '../App'; 

export interface TicketFormData {
  userName: string; 
  category: IssueCategory;
  urgency: UrgencyLevel;
  description: string;
  department: string;
}

interface TicketFormProps {
  onSubmitTicket: (ticketData: TicketFormData) => Promise<AppFeedback & { ticketId?: string }>;
  onCancel: () => void;
  isLoading: boolean;
}

const TicketForm: React.FC<TicketFormProps> = ({ onSubmitTicket, onCancel, isLoading }) => {
  const [userName, setUserName] = useState('');
  const [category, setCategory] = useState<IssueCategory>(IssueCategory.SOFTWARE);
  const [urgency, setUrgency] = useState<UrgencyLevel>(UrgencyLevel.MEDIUM);
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [feedback, setFeedback] = useState<AppFeedback | null>(null);

  useEffect(() => {
    setUserName('');
    setCategory(IssueCategory.SOFTWARE);
    setUrgency(UrgencyLevel.MEDIUM);
    setDescription('');
    setDepartment('');
    setFeedback(null);
  }, []); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null); 
    if (!userName.trim() || !description.trim() || !department.trim()) {
      setFeedback({ type: 'error', message: "Por favor, preencha todos os campos obrigatórios: Nome, Descrição e Setor." });
      return;
    }
    
    const result = await onSubmitTicket({
      userName,
      category,
      urgency,
      description,
      department,
    });

    if (result.type === 'error' && !result.ticketId) { 
        setFeedback(result);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-2xl mx-auto h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-purple-400">Abrir Novo Ticket de Suporte</h2>
        <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-md hover:bg-gray-700"
            aria-label="Voltar para lista de tickets"
          >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
      </div>

      {feedback && (
        <FeedbackAlert 
            type={feedback.type} 
            message={feedback.message} 
            onDismiss={() => setFeedback(null)}
            className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-1">Seu Nome <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
            placeholder="Seu nome completo"
            required
          />
        </div>
        
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-1">Setor <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
            placeholder="Ex: Financeiro, TI Local, RH"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Categoria do Problema</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white"
            >
              {Object.values(IssueCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-300 mb-1">Nível de Urgência</label>
            <select
              id="urgency"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white"
            >
              {Object.values(UrgencyLevel).map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição Detalhada do Problema <span className="text-red-500">*</span></label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
            placeholder="Descreva o problema que você está enfrentando, incluindo mensagens de erro, passos para reproduzir, etc."
            required
          />
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 mr-3 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading} 
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <PlusIcon className="w-5 h-5 mr-2" /> Enviar Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;