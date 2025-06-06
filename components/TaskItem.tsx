
import React from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { 
    ClockIcon, CheckCircleIcon, ArrowPathIcon, XMarkIcon, 
    BoltIcon, ExclamationTriangleIcon, EllipsisHorizontalIcon, 
    PencilSquareIcon
} from './icons';

interface TaskItemProps {
  task: Task;
  onEditTask: (taskId: string) => void;
}

const PriorityIndicator: React.FC<{ priority: TaskPriority, className?: string }> = ({ priority, className = "w-5 h-5" }) => {
  switch (priority) {
    case TaskPriority.ALTA: return <BoltIcon className={`${className} text-red-500`} />;
    case TaskPriority.MEDIA: return <ExclamationTriangleIcon className={`${className} text-orange-500`} />;
    case TaskPriority.BAIXA: return <EllipsisHorizontalIcon className={`${className} text-yellow-500`} />;
    default: return <EllipsisHorizontalIcon className={`${className} text-gray-400`} />;
  }
};

const StatusDisplay: React.FC<{ status: TaskStatus, className?: string }> = ({ status, className }) => {
  let icon: JSX.Element;
  let bgColor = 'bg-gray-700';
  let textColor = 'text-gray-200';
  let ringColor = 'ring-gray-500';

  switch (status) {
    case TaskStatus.ABERTO:
      icon = <ArrowPathIcon className="w-3.5 h-3.5 mr-1.5 text-purple-300" />;
      bgColor = 'bg-purple-800'; 
      textColor = 'text-purple-200'; 
      ringColor = 'ring-purple-600';
      break;
    case TaskStatus.PENDENTE:
      icon = <ClockIcon className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />;
      bgColor = 'bg-yellow-800'; 
      textColor = 'text-yellow-100'; 
      ringColor = 'ring-yellow-600';
      break;
    case TaskStatus.EM_ANDAMENTO:
      icon = <ArrowPathIcon className="w-3.5 h-3.5 mr-1.5 text-blue-400 animate-spin-slow" />; 
      bgColor = 'bg-blue-800'; 
      textColor = 'text-blue-100'; 
      ringColor = 'ring-blue-600';
      break;
    case TaskStatus.CONCLUIDO:
      icon = <CheckCircleIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-300" />;
      bgColor = 'bg-indigo-800'; 
      textColor = 'text-indigo-200'; 
      ringColor = 'ring-indigo-600';
      break;
    case TaskStatus.CANCELADO: 
      icon = <XMarkIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400" />;
      bgColor = 'bg-gray-700'; 
      textColor = 'text-gray-300'; 
      ringColor = 'ring-gray-500';
      break;
    default:
      icon = <EllipsisHorizontalIcon className="w-3.5 h-3.5 mr-1.5" />;
      break;
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${bgColor} ${textColor} ring-1 ring-inset ${ringColor} ${className}`}>
      {icon}
      {status}
    </span>
  );
};


const TaskItemInner: React.FC<TaskItemProps> = ({ task, onEditTask }) => {
  const title = `${task.name}: ${task.subject.substring(0, 50)}${task.subject.length > 50 ? "..." : ""}`;
  
  const formatDate = (dateInput: Date | string | undefined) => {
    if (!dateInput) return 'N/A';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  return (
    <li
      className={`
        block p-4 mb-3 rounded-lg shadow-lg transition-all duration-200 ease-in-out 
        bg-gray-800 border border-gray-700 hover:bg-gray-700/70 hover:border-gray-600
        focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900
      `}
      aria-label={`Tarefa: ${title}, status ${task.status}`}
    >
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex-grow min-w-0">
            <h3 className={`text-base font-semibold text-purple-300 group-hover:text-purple-200 transition-colors pr-2 truncate`} title={title}>
            {title}
            </h3>
            <p className="text-xs text-gray-400 truncate" title={task.subject}>{task.subject}</p>
        </div>
        <div className="flex-shrink-0 ml-2 flex items-center space-x-2">
          <PriorityIndicator priority={task.priority} className="w-5 h-5" />
          <button 
            onClick={(e) => { e.stopPropagation(); onEditTask(task.id);}} 
            className="p-1.5 rounded-md text-gray-400 hover:text-purple-400 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
            aria-label={`Editar tarefa ${task.name}`}
            title="Editar Tarefa"
          >
            <PencilSquareIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-xs mb-3.5">
        <div>
            <p className="text-gray-400">Setor:</p>
            <p className="text-gray-200 font-medium truncate" title={task.department}>{task.department}</p>
        </div>
        <div>
            <p className="text-gray-400">Data Início:</p>
            <p className="text-gray-300">{formatDate(task.startDate)}</p>
        </div>
        <div>
            <p className="text-gray-400">Data Venc.:</p>
            <p className="text-gray-300">{formatDate(task.dueDate)}</p>
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <StatusDisplay status={task.status} />
        <span className="text-xs text-gray-500">ID: {task.id.substring(0,8)}...</span>
      </div>
    </li>
  );
};

const TaskItem = React.memo(TaskItemInner);
export default TaskItem;