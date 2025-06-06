
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import TaskItem from './TaskItem';
import { PlusIcon, MagnifyingGlassIcon, ChevronDownIcon, FilterIcon, XMarkIcon, InformationCircleIcon } from './icons';

interface TaskListProps {
  tasks: Task[];
  onNewTask: () => void;
  onEditTask: (taskId: string) => void;
  isLoading: boolean;
  // onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>; // Prop removed as it's unused and handled by TaskForm
}

type SortTasksBy = 'dueDateAsc' | 'createdAtDesc' | 'priorityDesc' | 'nameAsc';

const priorityOrder: Record<TaskPriority, number> = {
  [TaskPriority.ALTA]: 3,
  [TaskPriority.MEDIA]: 2,
  [TaskPriority.BAIXA]: 1,
};

const TaskList: React.FC<TaskListProps> = ({ tasks, onNewTask, onEditTask, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortTasksBy>('createdAtDesc');
  const [statusFilters, setStatusFilters] = useState<TaskStatus[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<TaskPriority[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node) &&
        filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusFilterChange = (status: TaskStatus) => {
    setStatusFilters(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const handlePriorityFilterChange = (priority: TaskPriority) => {
    setPriorityFilters(prev => prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]);
  };

  const filteredAndSortedTasks = useMemo(() => {
    let processedTasks = [...tasks];

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedTasks = processedTasks.filter(task =>
        task.id.toLowerCase().includes(lowerSearchTerm) ||
        task.name.toLowerCase().includes(lowerSearchTerm) ||
        task.subject.toLowerCase().includes(lowerSearchTerm) ||
        task.description.toLowerCase().includes(lowerSearchTerm) ||
        task.department.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (statusFilters.length > 0) {
      processedTasks = processedTasks.filter(task => statusFilters.includes(task.status));
    }
    if (priorityFilters.length > 0) {
      processedTasks = processedTasks.filter(task => priorityFilters.includes(task.priority));
    }

    switch (sortBy) {
      case 'createdAtDesc':
        processedTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'dueDateAsc':
        processedTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        break;
      case 'priorityDesc':
        processedTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        break;
      case 'nameAsc':
        processedTasks.sort((a,b) => a.name.localeCompare(b.name));
        break;
    }
    return processedTasks;
  }, [tasks, searchTerm, sortBy, statusFilters, priorityFilters]);

  const activeFilterCount = statusFilters.length + priorityFilters.length;

  return (
    <div className="p-3 sm:p-4 bg-gray-900 rounded-lg h-full flex flex-col shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-3 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-purple-400 mb-2 sm:mb-0">Minhas Tarefas</h2>
        <button
          onClick={onNewTask}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 px-4 rounded-md flex items-center justify-center transition-all duration-150 ease-in-out shadow-md hover:shadow-lg active:bg-purple-700 text-sm"
        >
          <PlusIcon className="w-5 h-5 mr-2" /> Nova Tarefa
        </button>
      </div>

      <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Pesquisar por nome, assunto, setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2.5 pl-10 text-sm bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 transition-colors"
            aria-label="Pesquisar tarefas"
          />
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortTasksBy)}
              className="w-full p-2.5 pr-8 text-sm bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white appearance-none transition-colors"
              aria-label="Ordenar tarefas por"
            >
              <option value="createdAtDesc">Criação (Recentes)</option>
              <option value="dueDateAsc">Vencimento (Próximas)</option>
              <option value="priorityDesc">Prioridade (Altas)</option>
              <option value="nameAsc">Nome (A-Z)</option>
            </select>
            <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <button
              ref={filterButtonRef}
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className={`w-full flex items-center justify-between p-2.5 text-sm bg-gray-800 border border-gray-600 rounded-md text-white hover:border-gray-500 transition-colors ${activeFilterCount > 0 ? 'ring-2 ring-purple-500' : ''}`}
              aria-haspopup="true"
              aria-expanded={isFilterDropdownOpen}
            >
              <FilterIcon className={`w-4 h-4 mr-2 ${activeFilterCount > 0 ? 'text-purple-400' : 'text-gray-400'}`} />
              Filtros {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isFilterDropdownOpen && (
              <div ref={filterDropdownRef} className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-md shadow-xl z-20 p-3">
                <p className="text-xs text-gray-400 px-2 pb-1.5 font-medium">Filtrar por Status:</p>
                <div className="grid grid-cols-2 gap-1 mb-2">
                    {Object.values(TaskStatus).map(status => (
                    <label key={status} className="flex items-center px-2 py-1 rounded-md hover:bg-gray-700 cursor-pointer">
                        <input
                        type="checkbox"
                        checked={statusFilters.includes(status)}
                        onChange={() => handleStatusFilterChange(status)}
                        className="h-3.5 w-3.5 rounded border-gray-500 text-purple-500 focus:ring-purple-500/50 bg-gray-600 checked:bg-purple-500"
                        />
                        <span className="ml-2 text-xs text-gray-200">{status}</span>
                    </label>
                    ))}
                </div>
                <p className="text-xs text-gray-400 px-2 pb-1.5 font-medium border-t border-gray-700 pt-2">Filtrar por Prioridade:</p>
                <div className="space-y-1">
                    {Object.values(TaskPriority).map(priority => (
                        <label key={priority} className="flex items-center px-2 py-1 rounded-md hover:bg-gray-700 cursor-pointer">
                            <input
                            type="checkbox"
                            checked={priorityFilters.includes(priority)}
                            onChange={() => handlePriorityFilterChange(priority)}
                            className="h-3.5 w-3.5 rounded border-gray-500 text-purple-500 focus:ring-purple-500/50 bg-gray-600 checked:bg-purple-500"
                            />
                            <span className="ml-2 text-xs text-gray-200">{priority}</span>
                        </label>
                    ))}
                </div>
                 {(statusFilters.length > 0 || priorityFilters.length > 0) && (
                    <button 
                        onClick={() => {setStatusFilters([]); setPriorityFilters([]); setIsFilterDropdownOpen(false);}}
                        className="mt-3 w-full text-xs text-purple-400 hover:text-purple-300 p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                        Limpar todos os filtros
                    </button>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 mb-2 px-1">
        Exibindo {filteredAndSortedTasks.length} de {tasks.length} tarefas.
      </div>

      {isLoading && tasks.length === 0 ? (
         <div className="flex-grow flex items-center justify-center text-gray-400">
            <div role="status" className="flex flex-col items-center">
              <svg aria-hidden="true" className="w-10 h-10 text-gray-700 animate-spin fill-purple-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 27.9921Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 40.0218 89.4791 44.2538 89.2601 48.4949C88.8338 51.9606 86.9617 55.1122 83.9787 56.8948C81.0961 58.5922 77.3175 59.0098 73.8097 58.068C70.2015 57.0883 66.9914 54.8952 64.6109 51.8828C62.431 49.2347 60.9149 46.0271 60.1791 42.5679C59.2056 38.1758 59.9853 33.6279 62.2701 29.9213C62.7703 29.1153 63.6249 28.6003 64.5011 28.6003C65.9743 28.6003 67.0649 29.9213 66.4946 31.3203C64.8249 34.3417 64.3024 37.8991 65.0028 41.2975C65.9281 45.6435 68.1124 49.4082 71.0431 52.0807C73.9738 54.7533 77.6558 56.2461 81.4865 56.2461C85.1676 56.2461 88.6636 54.7785 91.2338 52.2228C93.8041 49.6671 95.0225 46.0736 95.0225 42.5679C95.0225 38.9569 93.9065 35.5115 91.5731 32.6658L91.3731 32.3858C90.9175 31.7858 90.1812 31.3203 89.3051 31.3203C87.8318 31.3203 86.7412 32.6413 87.3715 34.0409Z" fill="currentFill"/>
              </svg>
              <span className="sr-only">Carregando tarefas...</span>
              <p className="mt-2 text-sm">Carregando tarefas...</p>
            </div>
          </div>
      ) : filteredAndSortedTasks.length === 0 ? (
        <div className="text-center text-gray-400 py-10 flex-grow flex flex-col items-center justify-center bg-gray-800 rounded-md">
          <InformationCircleIcon className="w-16 h-16 text-gray-500 mb-6" />
          { (searchTerm || statusFilters.length > 0 || priorityFilters.length > 0) ? (
            <>
              <p className="text-xl font-semibold text-gray-200 mb-2">Nenhuma tarefa encontrada</p>
              <p className="text-sm mb-4">Tente ajustar seus filtros de busca, status ou prioridade.</p>
              <button 
                onClick={() => { setSearchTerm(''); setStatusFilters([]); setPriorityFilters([]); }}
                className="text-sm text-purple-400 hover:text-purple-300 p-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Limpar todos os filtros
              </button>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-gray-200 mb-2">Nenhuma tarefa registrada.</p>
              <p className="text-sm">Clique em "Nova Tarefa" para criar uma.</p>
            </>
          )}
        </div>
      ) : (
        <ul className="overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {filteredAndSortedTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onEditTask={onEditTask}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default TaskList;
