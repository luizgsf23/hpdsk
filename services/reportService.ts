
import { GenerateContentResponse } from "@google/genai"; // Import only if directly using its type for casting, else remove.
import { Ticket, ReportTimeFrame, ReportData, IssueCategory, UrgencyLevel, TicketStatus, Task, EquipmentItem, TaskStatus as TaskStatusEnum, TaskPriority, TaskClassification, EquipmentStatus as EquipmentStatusEnum, EquipmentType } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';
import { generateText, isAiAvailable, geminiInitializationError as geminiServiceError } from './geminiService'; // Use central service

// --- Helper Functions ---

const getStartOfWeek = (date: Date, weekStartsOnMonday: boolean = true): Date => {
  const d = new Date(date);
  const day = d.getDay(); 
  const diff = weekStartsOnMonday ? (day === 0 ? -6 : day - 1) : day;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfMonth = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfYear = (date: Date): Date => {
  const d = new Date(date.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const generatePeriodDescription = (timeFrame: ReportTimeFrame, refDate: Date): string => {
    const today = new Date(refDate); 
    today.setHours(0,0,0,0);

    switch (timeFrame) {
        case ReportTimeFrame.TODAY:
            return `Diário - ${formatDate(today)}`;
        case ReportTimeFrame.YESTERDAY:
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            return `Diário - ${formatDate(yesterday)}`;
        case ReportTimeFrame.THIS_WEEK:
            const startThisWeek = getStartOfWeek(today);
            const endThisWeek = new Date(startThisWeek);
            endThisWeek.setDate(startThisWeek.getDate() + 6);
            return `Semanal - ${formatDate(startThisWeek)} a ${formatDate(endThisWeek)}`;
        case ReportTimeFrame.LAST_WEEK:
            const currentMon = getStartOfWeek(today);
            const endLastWeek = new Date(currentMon);
            endLastWeek.setDate(currentMon.getDate() - 1); 
            const startLastWeek = new Date(endLastWeek);
            startLastWeek.setDate(endLastWeek.getDate() - 6); 
            return `Semanal - ${formatDate(startLastWeek)} a ${formatDate(endLastWeek)}`;
        case ReportTimeFrame.THIS_MONTH:
            const startThisMonth = getStartOfMonth(today);
            const endThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return `Mensal - ${startThisMonth.toLocaleString('pt-BR', { month: 'long' })} de ${today.getFullYear()}`;
        case ReportTimeFrame.LAST_MONTH:
            const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            return `Mensal - ${firstDayLastMonth.toLocaleString('pt-BR', { month: 'long' })} de ${firstDayLastMonth.getFullYear()}`;
        case ReportTimeFrame.THIS_YEAR:
            return `Anual - ${today.getFullYear()}`;
        case ReportTimeFrame.LAST_YEAR:
            const lastYear = today.getFullYear() - 1;
            return `Anual - ${lastYear}`;
        default:
            const exhaustiveCheck: never = timeFrame;
            return "Período Desconhecido";
    }
};


// --- Exported Service Object ---

export const reportService = {
  filterTicketsByTimeFrame: (
    allTickets: Ticket[],
    timeFrame: ReportTimeFrame
  ): { filteredTickets: Ticket[]; periodDescription: string } => {
    const now = new Date(); 
    let startDate: Date;
    let endDate: Date = new Date(now);

    const periodDescription = generatePeriodDescription(timeFrame, now);

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    switch (timeFrame) {
        case ReportTimeFrame.TODAY:
            startDate = todayStart;
            endDate = todayEnd;
            break;
        case ReportTimeFrame.YESTERDAY:
            startDate = new Date(todayStart);
            startDate.setDate(todayStart.getDate() - 1);
            endDate = new Date(todayEnd);
            endDate.setDate(todayEnd.getDate() - 1);
            break;
        case ReportTimeFrame.THIS_WEEK:
            startDate = getStartOfWeek(now);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case ReportTimeFrame.LAST_WEEK:
            const currentMon = getStartOfWeek(now);
            endDate = new Date(currentMon);
            endDate.setDate(currentMon.getDate() - 1); 
            endDate.setHours(23,59,59,999);
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6); 
            startDate.setHours(0,0,0,0);
            break;
        case ReportTimeFrame.THIS_MONTH:
            startDate = getStartOfMonth(now);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case ReportTimeFrame.LAST_MONTH:
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case ReportTimeFrame.THIS_YEAR:
            startDate = getStartOfYear(now);
            endDate = new Date(now.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
            break;
        case ReportTimeFrame.LAST_YEAR:
            const lastYearVal = now.getFullYear() - 1;
            startDate = new Date(lastYearVal, 0, 1);
            endDate = new Date(lastYearVal, 11, 31);
            endDate.setHours(23, 59, 59, 999);
            break;
        default:
            const exhaustiveCheck: never = timeFrame;
            console.warn(`Unhandled timeFrame in filterTicketsByTimeFrame: ${exhaustiveCheck}. Defaulting to all tickets.`);
            startDate = new Date(0); 
            endDate = new Date();    
    }

    const filteredTickets = allTickets.filter(ticket => {
        const createdAt = new Date(ticket.created_at);
        return createdAt >= startDate && createdAt <= endDate;
    });

    return { filteredTickets, periodDescription };
  },

  calculateReportStats: (
    filteredTickets: Ticket[]
  ): Omit<ReportData, 'periodDescription' | 'timeFrameSelected' | 'aiInsights'> => {
    const totalTickets = filteredTickets.length;
    const resolvedTickets = filteredTickets.filter(t => t.status === TicketStatus.RESOLVED).length;
    const openTickets = filteredTickets.filter(t => t.status === TicketStatus.OPEN).length;
    const cancelledTickets = filteredTickets.filter(t => t.status === TicketStatus.CANCELLED).length;
    const pendingAiTickets = filteredTickets.filter(t => t.status === TicketStatus.PENDING_AI).length;
    const pendingUserTickets = filteredTickets.filter(t => t.status === TicketStatus.PENDING_USER).length;

    const ticketsByCategory: { category: IssueCategory; count: number }[] = [];
    Object.values(IssueCategory).forEach(cat => {
        const count = filteredTickets.filter(t => t.category === cat).length;
        if (count > 0) ticketsByCategory.push({ category: cat, count });
    });
    ticketsByCategory.sort((a, b) => b.count - a.count);


    const ticketsByUrgency: { urgency: UrgencyLevel; count: number }[] = [];
    Object.values(UrgencyLevel).forEach(level => {
        const count = filteredTickets.filter(t => t.urgency === level).length;
        if (count > 0) ticketsByUrgency.push({ urgency: level, count });
    });
    ticketsByUrgency.sort((a, b) => b.count - a.count);

    const ticketsByStatus: { status: TicketStatus; count: number }[] = [];
    Object.values(TicketStatus).forEach(stat => {
        const count = filteredTickets.filter(t => t.status === stat).length;
        if (count > 0) ticketsByStatus.push({ status: stat, count });
    });
    ticketsByStatus.sort((a,b) => b.count - a.count);
    
    return {
        totalTickets,
        resolvedTickets,
        openTickets,
        cancelledTickets,
        pendingAiTickets,
        pendingUserTickets,
        ticketsByCategory,
        ticketsByUrgency,
        ticketsByStatus,
    };
  },

  generateReportInsightsWithAI: async (
    tickets: Ticket[],
    tasks: Task[], 
    equipmentItems: EquipmentItem[], 
    periodDescription: string,
    ticketStats: Omit<ReportData, 'periodDescription' | 'timeFrameSelected' | 'aiInsights'>
  ): Promise<string> => {
    if (!isAiAvailable()) {
        return `Insights da IA não podem ser gerados: ${geminiServiceError || "Cliente Gemini não inicializado."}`;
    }

    const totalTasks = tasks.length;
    const openTasksCount = tasks.filter(t => t.status === TaskStatusEnum.ABERTO).length;
    const completedTasksCount = tasks.filter(t => t.status === TaskStatusEnum.CONCLUIDO).length;
    const tasksByPriority: { priority: TaskPriority; count: number }[] = [];
    Object.values(TaskPriority).forEach(prio => {
        const count = tasks.filter(t => t.priority === prio).length;
        if (count > 0) tasksByPriority.push({ priority: prio, count});
    });
    tasksByPriority.sort((a, b) => b.count - a.count);

    const totalEquipment = equipmentItems.length;
    const equipmentInStock = equipmentItems.filter(e => e.status === EquipmentStatusEnum.EM_ESTOQUE).length;
    const equipmentInUse = equipmentItems.filter(e => e.status === EquipmentStatusEnum.EM_USO).length;
    const equipmentInMaintenance = equipmentItems.filter(e => e.status === EquipmentStatusEnum.EM_MANUTENCAO).length;
    const equipmentByType: { type: EquipmentType; count: number}[] = [];
    Object.values(EquipmentType).forEach(type => {
        const count = equipmentItems.filter(e => e.type === type).length;
        if (count > 0) equipmentByType.push({ type: type, count});
    });
    equipmentByType.sort((a,b) => b.count - a.count);


    const ticketSamples = tickets.slice(0, Math.min(3, tickets.length)).map(t => 
        `- Ticket (ID: ...${t.id.slice(-6)}), Categoria: ${t.category}, Urgência: ${t.urgency}, Status: ${t.status}. Descrição: "${t.description.substring(0, 70)}..."`
    ).join('\n');

    const taskSamples = tasks.slice(0, Math.min(3, tasks.length)).map(t => 
        `- Tarefa (ID: ...${t.id.slice(-6)}), Nome: ${t.name}, Prioridade: ${t.priority}, Status: ${t.status}. Vencimento: ${new Date(t.dueDate).toLocaleDateString('pt-BR')}`
    ).join('\n');
    
    const equipmentSamples = equipmentItems.slice(0, Math.min(3, equipmentItems.length)).map(e =>
        `- Equipamento (ID: ...${e.id.slice(-6)}), Nome: ${e.name}, Tipo: ${e.type}, Status: ${e.status}.`
    ).join('\n');

    const reportSystemInstruction = `Você é um analista de dados sênior especializado em otimizar operações de help desk e gerenciamento de TI. Analise os dados fornecidos e gere insights e recomendações.`;

    const prompt = `
Analise os seguintes dados para o período: ${periodDescription}.

--- DADOS DE TICKETS DE SUPORTE ---
Estatísticas Chave de Tickets:
- Total de Tickets Criados no Período: ${ticketStats.totalTickets}
- Tickets Resolvidos no Período: ${ticketStats.resolvedTickets}
- Tickets Atualmente Abertos (Criados no Período): ${ticketStats.openTickets}
- Tickets Cancelados no Período: ${ticketStats.cancelledTickets}
- Tickets Aguardando Resposta da IA (Criados no Período): ${ticketStats.pendingAiTickets}
- Tickets Aguardando Resposta do Usuário (Criados no Período): ${ticketStats.pendingUserTickets}

Distribuição de Tickets por Categoria (no período):
${ticketStats.ticketsByCategory.map(s => `- ${s.category}: ${s.count} (${((s.count / (ticketStats.totalTickets || 1)) * 100).toFixed(1)}%)`).join('\n') || '- Nenhuma categoria com tickets.'}

Distribuição de Tickets por Urgência (no período):
${ticketStats.ticketsByUrgency.map(s => `- ${s.urgency}: ${s.count} (${((s.count / (ticketStats.totalTickets || 1)) * 100).toFixed(1)}%)`).join('\n') || '- Nenhuma urgência com tickets.'}

Amostra de Tickets do Período (primeiros ${Math.min(3, tickets.length)}):
${ticketSamples || "- Nenhuma amostra de ticket disponível."}

--- DADOS DE TAREFAS (GERAL - NÃO RESTRITO AO PERÍODO DOS TICKETS) ---
Estatísticas Gerais de Tarefas (total no sistema):
- Total de Tarefas Registradas: ${totalTasks}
- Tarefas Abertas: ${openTasksCount}
- Tarefas Concluídas: ${completedTasksCount}
- Tarefas por Prioridade: ${tasksByPriority.map(p => `${p.priority}: ${p.count}`).join(', ') || 'N/A'}

Amostra de Tarefas (geral, primeiras ${Math.min(3, tasks.length)}):
${taskSamples || "- Nenhuma amostra de tarefa disponível."}

--- DADOS DE INVENTÁRIO (GERAL - NÃO RESTRITO AO PERÍODO DOS TICKETS) ---
Estatísticas Gerais de Inventário (total no sistema):
- Total de Itens de Equipamento: ${totalEquipment}
- Itens em Estoque: ${equipmentInStock}
- Itens em Uso: ${equipmentInUse}
- Itens em Manutenção: ${equipmentInMaintenance}
- Equipamentos por Tipo (Top 3): ${equipmentByType.slice(0,3).map(e => `${e.type}: ${e.count}`).join(', ') || 'N/A'}

Amostra de Itens de Inventário (geral, primeiros ${Math.min(3, equipmentItems.length)}):
${equipmentSamples || "- Nenhuma amostra de item disponível."}

--- SOLICITAÇÃO DE ANÁLISE ---
Com base EXCLUSIVAMENTE nos dados fornecidos acima (tickets do período, e dados gerais de tarefas e inventário para contexto), forneça um relatório conciso em português do Brasil (máximo 4-5 parágrafos curtos) com:
1. **Observações Principais (Foco nos Tickets do Período):** Destaque as tendências mais significativas nos tickets do período (ex: categorias mais problemáticas, urgências predominantes, eficácia da resolução).
2. **Correlações e Insights (Considerando todas as fontes):** Identifique possíveis correlações ou insights cruzados. Por exemplo:
    - Tickets de hardware estão associados a equipamentos específicos ou antigos do inventário? (Use as amostras para inferir se possível).
    - Tarefas pendentes ou de alta prioridade estão relacionadas a problemas descritos nos tickets ou a equipamentos em manutenção?
    - A quantidade de tickets de uma categoria específica sugere a necessidade de novas tarefas preventivas ou de melhoria?
3. **Pontos de Atenção (Foco nos Tickets do Período):** Identifique possíveis áreas que requerem atenção nos tickets do período (ex: alta proporção de tickets críticos não resolvidos, gargalos).
4. **Recomendações Acionáveis (Integradas):** Sugira 1-2 ações práticas e gerais para melhorar o suporte, baseadas diretamente nos dados e nas correlações observadas (ex: treinamento focado se uma categoria domina, revisão de processos para tickets parados, priorizar tarefas que possam mitigar tipos comuns de tickets).

Formate a resposta para fácil leitura. Use markdown para **negrito** para títulos e termos chave. Seja direto e evite linguagem excessivamente técnica.
Concentre-se na análise dos tickets do período, usando os dados de tarefas e inventário como contexto para enriquecer os insights.
    `;

    try {
      const response = await generateText(prompt, reportSystemInstruction, GEMINI_MODEL_NAME);
      return response.text || "Não foi possível gerar insights da IA no momento.";
    } catch (error) {
      console.error("Error generating AI insights for report:", error);
      return `Erro ao contatar o serviço de IA para gerar insights: ${(error as Error).message}`;
    }
  }
};
