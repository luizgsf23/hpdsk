
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority, TaskClassification } from '../types';
import { PlusIcon, ArrowLeftIcon, CalendarDaysIcon } from './icons'; 
import FeedbackAlert from './FeedbackAlert';
import type { AppFeedback } from '../App';

export interface TaskFormData {
  name: string;
  subject: string;
  description: string;
  status: TaskStatus;
  department: string;
  startDate: string; 
  dueDate: string;   
  priority: TaskPriority;
  classification: TaskClassification;
}

interface TaskFormProps {
  onSubmitTask: (taskData: TaskFormData) => Promise<AppFeedback & { taskId?: string }>;
  onCancel: () => void;
  isLoading: boolean;
  initialTaskData?: Task | null; 
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmitTask, onCancel, isLoading, initialTaskData }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    subject: '',
    description: '',
    status: TaskStatus.ABERTO,
    department: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    priority: TaskPriority.MEDIA,
    classification: TaskClassification.QUESTAO,
  });
  const [feedback, setFeedback] = useState<AppFeedback | null>(null);

  useEffect(() => {
    if (initialTaskData) {
      setFormData({
        name: initialTaskData.name,
        subject: initialTaskData.subject,
        description: initialTaskData.description,
        status: initialTaskData.status,
        department: initialTaskData.department,
        startDate: typeof initialTaskData.startDate === 'string' ? initialTaskData.startDate.split('T')[0] : new Date(initialTaskData.startDate).toISOString().split('T')[0],
        dueDate: typeof initialTaskData.dueDate === 'string' ? initialTaskData.dueDate.split('T')[0] : new Date(initialTaskData.dueDate).toISOString().split('T')[0],
        priority: initialTaskData.priority,
        classification: initialTaskData.classification,
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        description: '',
        status: TaskStatus.ABERTO,
        department: '',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: TaskPriority.MEDIA,
        classification: TaskClassification.QUESTAO,
      });
    }
    setFeedback(null);
  }, [initialTaskData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!formData.name.trim() || !formData.subject.trim() || !formData.department.trim() || !formData.description.trim()) {
      setFeedback({ type: 'error', message: "Por favor, preencha todos os campos obrigatórios (Nome, Assunto, Setor, Descrição)." });
      return;
    }
    const result = await onSubmitTask(formData);

    if (result.type === 'error' && !result.taskId) {
      setFeedback(result);
    }
  };

  const formTitle = initialTaskData ? "Editar Tarefa" : "Criar Nova Tarefa";

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-xl max-w-3xl mx-auto h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-purple-400">{formTitle}</h2>
        <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-md hover:bg-gray-700"
            aria-label="Voltar para lista de tarefas"
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nome da Tarefa</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
            placeholder="Ex: Configurar nova impressora" />
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">Assunto</label>
          <input type="text" name="subject" id="subject" value={formData.subject} onChange={handleChange} required
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
            placeholder="Ex: Instalação de equipamento" />
        </div>

        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-1">Setor Responsável / Sala</label>
          <input type="text" name="department" id="department" value={formData.department} onChange={handleChange} required
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
            placeholder="Ex: TI Local, Sala de Reuniões A" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">Data de Início</label>
            <div className="relative">
                <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required
                    className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white" />
                <CalendarDaysIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-1">Data de Vencimento</label>
             <div className="relative">
                <input type="date" name="dueDate" id="dueDate" value={formData.dueDate} onChange={handleChange} required
                    className="w-full p-3 pl-10 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white" />
                <CalendarDaysIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select name="status" id="status" value={formData.status} onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white">
                {Object.values(TaskStatus).map(sVal => (<option key={sVal} value={sVal}>{sVal}</option>))}
                </select>
            </div>
            <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-1">Prioridade</label>
                <select name="priority" id="priority" value={formData.priority} onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white">
                {Object.values(TaskPriority).map(pVal => (<option key={pVal} value={pVal}>{pVal}</option>))}
                </select>
            </div>
        </div>

        <div>
          <label htmlFor="classification" className="block text-sm font-medium text-gray-300 mb-1">Classificação do Problema/Tarefa</label>
          <select name="classification" id="classification" value={formData.classification} onChange={handleChange}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white">
            {Object.values(TaskClassification).map(cVal => (<option key={cVal} value={cVal}>{cVal}</option>))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descrição Detalhada</label>
          <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={5} required
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
            placeholder="Detalhes da tarefa, passos necessários, informações relevantes, etc." />
        </div>
        
        <div className="flex justify-end pt-3">
          <button type="button" onClick={onCancel} disabled={isLoading}
            className="px-6 py-3 mr-3 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={isLoading}
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <PlusIcon className="w-5 h-5 mr-2" /> {initialTaskData ? "Salvar Alterações" : "Criar Tarefa"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
