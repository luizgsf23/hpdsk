
import React from 'react';
import { Ticket, TicketStatus, IssueCategory, UrgencyLevel, Task, TaskStatus as TaskStatusEnum, TaskPriority, TaskClassification } from '../types';
import StatCard from './StatCard';
import SimpleBarChart, { BarChartItem } from './SimpleBarChart';
import { 
  TicketIcon as TicketIconSolid, CheckCircleIcon, ClockIcon, ChartBarIcon, 
  BoltIcon, ExclamationTriangleIcon, Bars3BottomLeftIcon, EllipsisHorizontalIcon, UserGroupIcon, SparklesIcon, XMarkIcon,
  ClipboardDocumentListIcon, QuestionMarkCircleIcon, LightBulbIcon, WrenchScrewdriverIcon, TagIcon, CubeIcon, ArrowPathIcon // Added ArrowPathIcon
} from './icons';

interface DashboardViewProps {
  tickets: Ticket[];
  tasks: Task[];
  onNavigateToList: () => void; 
  onNavigateToTasks: () => void;
}

// --- Ticket Helpers ---
const getTicketStatusColorClass = (status: TicketStatus): string => {
  switch (status) {
    case TicketStatus.OPEN: return 'bg-purple-500';
    case TicketStatus.PENDING_AI: return 'bg-purple-600'; 
    case TicketStatus.PENDING_USER: return 'bg-yellow-500'; 
    case TicketStatus.RESOLVED: return 'bg-indigo-500'; 
    case TicketStatus.CANCELLED: return 'bg-gray-600'; 
    default: return 'bg-gray-500';
  }
};

const getTicketUrgencyColorClass = (urgency: UrgencyLevel): string => {
  switch (urgency) {
    case UrgencyLevel.CRITICAL: return 'bg-red-500'; 
    case UrgencyLevel.HIGH: return 'bg-orange-500'; 
    case UrgencyLevel.MEDIUM: return 'bg-yellow-500'; 
    case UrgencyLevel.LOW: return 'bg-purple-400'; 
    default: return 'bg-gray-500';
  }
};

const getTicketCategoryColorClass = (category: IssueCategory): string => {
  switch (category) {
    case IssueCategory.HARDWARE: return 'bg-pink-500'; 
    case IssueCategory.SOFTWARE: return 'bg-purple-500';
    case IssueCategory.NETWORK: return 'bg-indigo-500'; 
    case IssueCategory.ACCOUNT: return 'bg-purple-700'; 
    case IssueCategory.OTHER: return 'bg-teal-500'; 
    default: return 'bg-gray-400';
  }
};

const getTicketUrgencyIcon = (urgency: UrgencyLevel, className?: string): JSX.Element => {
  const props = { className: className || "w-4 h-4" };
  switch (urgency) {
    case UrgencyLevel.CRITICAL: return <BoltIcon {...props} />;
    case UrgencyLevel.HIGH: return <ExclamationTriangleIcon {...props} />;
    case UrgencyLevel.MEDIUM: return <Bars3BottomLeftIcon {...props} />;
    case UrgencyLevel.LOW: return <EllipsisHorizontalIcon {...props} />;
    default: return <div />;
  }
};

// --- Task Helpers ---
const getTaskStatusColorClass = (status: TaskStatusEnum): string => {
  switch (status) {
    case TaskStatusEnum.ABERTO: return 'bg-purple-500';
    case TaskStatusEnum.PENDENTE: return 'bg-yellow-500';
    case TaskStatusEnum.EM_ANDAMENTO: return 'bg-blue-500'; // Using blue for 'Em Andamento'
    case TaskStatusEnum.CONCLUIDO: return 'bg-indigo-500';
    case TaskStatusEnum.CANCELADO: return 'bg-gray-600';
    default: return 'bg-gray-500';
  }
};

const getTaskPriorityColorClass = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.ALTA: return 'bg-red-500';
    case TaskPriority.MEDIA: return 'bg-orange-500';
    case TaskPriority.BAIXA: return 'bg-yellow-500'; // Changed to yellow for better distinction from low ticket urgency
    default: return 'bg-gray-500';
  }
};

const getTaskClassificationColorClass = (classification: TaskClassification): string => {
  switch (classification) {
    case TaskClassification.QUESTAO: return 'bg-purple-400';
    case TaskClassification.PROBLEMA: return 'bg-pink-500';
    case TaskClassification.REQUISICAO_FUNCIONALIDADE: return 'bg-teal-500';
    case TaskClassification.MELHORIA: return 'bg-indigo-400';
    case TaskClassification.OUTRO: return 'bg-gray-500';
    default: return 'bg-gray-400';
  }
};

const getTaskStatusIcon = (status: TaskStatusEnum, className?: string): JSX.Element => {
    const props = { className: className || "w-7 h-7" };
    switch(status) {
        case TaskStatusEnum.ABERTO: return <ClockIcon {...props} />;
        case TaskStatusEnum.PENDENTE: return <EllipsisHorizontalIcon {...props} />;
        case TaskStatusEnum.EM_ANDAMENTO: return <ArrowPathIcon {...props} />;
        case TaskStatusEnum.CONCLUIDO: return <CheckCircleIcon {...props} />;
        case TaskStatusEnum.CANCELADO: return <XMarkIcon {...props} />;
        default: return <QuestionMarkCircleIcon {...props}/>;
    }
};
const getTaskPriorityIcon = (priority: TaskPriority, className?: string): JSX.Element => {
    const props = { className: className || "w-4 h-4" };
    switch(priority){
        case TaskPriority.ALTA: return <BoltIcon {...props} />;
        case TaskPriority.MEDIA: return <ExclamationTriangleIcon {...props} />;
        case TaskPriority.BAIXA: return <EllipsisHorizontalIcon {...props} />;
        default: return <div/>;
    }
};
const getTaskClassificationIcon = (classification: TaskClassification, className?: string): JSX.Element => {
    const props = { className: className || "w-4 h-4" };
     switch(classification){
        case TaskClassification.QUESTAO: return <QuestionMarkCircleIcon {...props} />;
        case TaskClassification.PROBLEMA: return <WrenchScrewdriverIcon {...props} />;
        case TaskClassification.REQUISICAO_FUNCIONALIDADE: return <LightBulbIcon {...props} />;
        case TaskClassification.MELHORIA: return <CubeIcon {...props} />;
        case TaskClassification.OUTRO: return <TagIcon {...props} />;
        default: return <div/>;
    }
};

const DashboardView: React.FC<DashboardViewProps> = ({ tickets, tasks, onNavigateToList, onNavigateToTasks }) => {
  // Ticket Stats
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === TicketStatus.OPEN).length;
  const resolvedTickets = tickets.filter(t => t.status === TicketStatus.RESOLVED).length;
  const pendingAiTickets = tickets.filter(t => t.status === TicketStatus.PENDING_AI).length;
  const pendingUserTickets = tickets.filter(t => t.status === TicketStatus.PENDING_USER).length;
  const cancelledTickets = tickets.filter(t => t.status === TicketStatus.CANCELLED).length;

  const ticketsByStatusData: BarChartItem[] = Object.values(TicketStatus).map(status => ({
    label: status,
    value: tickets.filter(t => t.status === status).length,
    colorClass: getTicketStatusColorClass(status),
  })).filter(item => item.value > 0).sort((a,b) => b.value - a.value);
  
  const ticketsByCategoryData: BarChartItem[] = Object.values(IssueCategory).map(category => ({
    label: category,
    value: tickets.filter(t => t.category === category).length,
    colorClass: getTicketCategoryColorClass(category), 
  })).filter(item => item.value > 0).sort((a,b) => b.value - a.value);

  const ticketsByUrgencyData: BarChartItem[] = Object.values(UrgencyLevel).map(urgency => ({
    label: urgency,
    value: tickets.filter(t => t.urgency === urgency).length,
    colorClass: getTicketUrgencyColorClass(urgency),
    icon: getTicketUrgencyIcon(urgency, "w-4 h-4 inline-block text-inherit"),
  })).filter(item => item.value > 0).sort((a,b) => b.value - a.value);

  const ticketDepartmentCounts: Record<string, number> = {};
  tickets.forEach(ticket => {
    const department = ticket.department || "Não Especificado";
    ticketDepartmentCounts[department] = (ticketDepartmentCounts[department] || 0) + 1;
  });
  const ticketsByDepartmentData: BarChartItem[] = Object.entries(ticketDepartmentCounts).map(([dept, count]) => ({
    label: dept,
    value: count,
    colorClass: 'bg-purple-500', // Consistent color for departments
  })).filter(item => item.value > 0).sort((a,b) => b.value - a.value);

  // Task Stats
  const totalTasks = tasks.length;
  const openTasks = tasks.filter(t => t.status === TaskStatusEnum.ABERTO).length;
  const pendingTasks = tasks.filter(t => t.status === TaskStatusEnum.PENDENTE).length;
  const inProgressTasks = tasks.filter(t => t.status === TaskStatusEnum.EM_ANDAMENTO).length;
  const completedTasks = tasks.filter(t => t.status === TaskStatusEnum.CONCLUIDO).length;

  const tasksByStatusData: BarChartItem[] = Object.values(TaskStatusEnum).map(status => ({
    label: status,
    value: tasks.filter(t => t.status === status).length,
    colorClass: getTaskStatusColorClass(status),
    icon: getTaskStatusIcon(status, "w-4 h-4 inline-block text-inherit"),
  })).filter(item => item.value > 0).sort((a,b) => b.value - a.value);

  const tasksByPriorityData: BarChartItem[] = Object.values(TaskPriority).map(priority => ({
    label: priority,
    value: tasks.filter(t => t.priority === priority).length,
    colorClass: getTaskPriorityColorClass(priority),
    icon: getTaskPriorityIcon(priority, "w-4 h-4 inline-block text-inherit"),
  })).filter(item => item.value > 0).sort((a,b) => b.value - a.value);
  
  const tasksByClassificationData: BarChartItem[] = Object.values(TaskClassification).map(classification => ({
    label: classification,
    value: tasks.filter(t => t.classification === classification).length,
    colorClass: getTaskClassificationColorClass(classification),
    icon: getTaskClassificationIcon(classification, "w-4 h-4 inline-block text-inherit"),
  })).filter(item => item.value > 0).sort((a,b) => b.value - a.value);


  return (
    <div className="space-y-6 sm:space-y-8 pb-8 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
      <div className="flex justify-between items-center mb-6 pt-2"> 
        <h2 className="text-2xl sm:text-3xl font-semibold text-purple-400">Dashboard de Atendimento</h2>
      </div>

      {/* Ticket Statistics */}
      <section>
        <h3 className="text-xl font-semibold text-purple-300 mb-4">Estatísticas de Tickets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-5">
          <StatCard title="Total de Tickets" value={totalTickets} icon={<TicketIconSolid className="w-7 h-7" />} iconColorClass="text-purple-400"/>
          <StatCard title="Abertos" value={openTickets} icon={<ClockIcon className="w-7 h-7" />} iconColorClass="text-purple-500" />
          <StatCard title="Aguardando IA" value={pendingAiTickets} icon={<SparklesIcon className="w-7 h-7" />} iconColorClass="text-purple-600"/>
          <StatCard title="Aguardando Usuário" value={pendingUserTickets} icon={<UserGroupIcon className="w-7 h-7" />} iconColorClass="text-yellow-400"/>
          <StatCard title="Resolvidos" value={resolvedTickets} icon={<CheckCircleIcon className="w-7 h-7" />} iconColorClass="text-indigo-400"/>
          <StatCard title="Cancelados" value={cancelledTickets} icon={<XMarkIcon className="w-7 h-7" />} iconColorClass="text-gray-400"/>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <SimpleBarChart title="Tickets por Status" items={ticketsByStatusData} />
          <SimpleBarChart title="Tickets por Urgência" items={ticketsByUrgencyData} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <SimpleBarChart title="Tickets por Categoria" items={ticketsByCategoryData} />
          <SimpleBarChart title="Tickets por Setor (Tickets)" items={ticketsByDepartmentData} />
        </div>
      </section>

      {/* Task Statistics */}
      <section className="mt-10">
        <h3 className="text-xl font-semibold text-purple-300 mb-4">Estatísticas de Tarefas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          <StatCard title="Total de Tarefas" value={totalTasks} icon={<ClipboardDocumentListIcon className="w-7 h-7" />} iconColorClass="text-purple-400"/>
          <StatCard title="Tarefas Abertas" value={openTasks} icon={getTaskStatusIcon(TaskStatusEnum.ABERTO)} iconColorClass="text-purple-500"/>
          <StatCard title="Tarefas Pendentes" value={pendingTasks} icon={getTaskStatusIcon(TaskStatusEnum.PENDENTE)} iconColorClass="text-yellow-400"/>
          <StatCard title="Tarefas Concluídas" value={completedTasks} icon={getTaskStatusIcon(TaskStatusEnum.CONCLUIDO)} iconColorClass="text-indigo-400"/>
        </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <SimpleBarChart title="Tarefas por Status" items={tasksByStatusData} />
          <SimpleBarChart title="Tarefas por Prioridade" items={tasksByPriorityData} />
          <SimpleBarChart title="Tarefas por Classificação" items={tasksByClassificationData} />
        </div>
      </section>
      
      {(tickets.length === 0 && tasks.length === 0) && (
        <div className="bg-gray-800 p-10 rounded-xl shadow-lg text-center text-gray-300 mt-8">
          <ChartBarIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-xl text-gray-100 mb-2">Nenhum dado para exibir no dashboard.</h3>
          <p className="mb-1">Crie alguns tickets para ver as estatísticas de atendimento.</p>
          <p>Crie algumas tarefas para ver as estatísticas de progresso.</p>
          <div className="mt-4 space-x-4">
            <button 
                onClick={onNavigateToList} 
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors">
                Ir para Tickets
            </button>
            <button 
                onClick={onNavigateToTasks} 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
                Ir para Tarefas
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
