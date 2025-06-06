
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chat, Content } from "@google/genai"; // Added Content
import type { GenerateContentResponse, Session } from "@google/genai"; // Assuming Session from genai is what you might need, adjust if it's from Supabase
import { 
    Ticket, Message, TicketStatus, IssueCategory, UrgencyLevel, ReportTimeFrame, ReportData,
    Task, TaskStatus as TaskStatusEnum, TaskPriority, TaskClassification,
    EquipmentItem, EquipmentType, EquipmentStatus as EquipmentStatusEnum, 
    Contract, 
    NavigationItemConfig,
    ViewMode 
} from './types';
import { reportService } from './services/reportService';
import { supabase } from './services/supabaseClient'; 
import { hasConfigErrors } from './services/configStatus'; 
import ConfigurationErrorPage from './components/ConfigurationErrorPage'; 
import LoginPage from './components/LoginPage';
import FeedbackAlert from './components/FeedbackAlert'; 
import TicketList from './components/TicketList';
import TicketForm, { TicketFormData as AppTicketFormData } from './components/TicketForm'; 
import TicketDetailView from './components/TicketDetailView';
import LoadingSpinner from './components/LoadingSpinner';
import DashboardView from './components/DashboardView';
import ReportsPage from './components/ReportsPage';
import SidebarNav from './components/SidebarNav';
import HomePage from './components/HomePage';
import TaskList from './components/TaskList'; 
import TaskForm, { TaskFormData as AppTaskFormData } from './components/TaskForm';  
import InventoryDashboardView from './components/InventoryDashboardView';
import InventoryItemForm, { InventoryItemFormData as AppInventoryItemFormData } from './components/InventoryItemForm';
import InventoryStockList from './components/InventoryStockList'; 
import InventoryDeployedList from './components/InventoryDeployedList'; 
import ContractList from './components/ContractList';
import ContractForm, { ContractFormData as AppContractFormData } from './components/ContractForm';
import HelpPage from './components/HelpPage'; // Added HelpPage
import { 
    createChat as createAiChat, 
    generateStream as generateAiStream, 
    isAiAvailable,
    geminiInitializationError 
} from './services/geminiService';
import { HELP_DESK_SYSTEM_INSTRUCTION, HELP_APP_SYSTEM_INSTRUCTION } from './constants';
import { ChartBarIcon, TicketIcon, ClipboardDocumentListIcon, ArchiveBoxIcon, DocumentTextIcon, DocumentDuplicateIcon, LifebuoyIcon, HPDSKLogoIcon } from './components/icons';


export interface AppFeedback {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

const mainNavItemsConfig: NavigationItemConfig[] = [
  { viewMode: 'dashboard', label: 'Dashboard', icon: ChartBarIcon, colorClass: 'bg-purple-600 hover:bg-purple-700' },
  { viewMode: 'list', label: 'Tickets', icon: TicketIcon, colorClass: 'bg-indigo-600 hover:bg-indigo-700' }, 
  { viewMode: 'tasks', label: 'Tarefas', icon: ClipboardDocumentListIcon, colorClass: 'bg-teal-600 hover:bg-teal-700' },
  { viewMode: 'inventoryDashboard', label: 'Inventário', icon: ArchiveBoxIcon, colorClass: 'bg-pink-600 hover:bg-pink-700' },
  { viewMode: 'contractsList', label: 'Contratos', icon: DocumentDuplicateIcon, colorClass: 'bg-cyan-600 hover:bg-cyan-700' },
  { viewMode: 'reports', label: 'Relatórios', icon: DocumentTextIcon, colorClass: 'bg-orange-600 hover:bg-orange-700' },
  { viewMode: 'help', label: 'Ajuda', icon: LifebuoyIcon, colorClass: 'bg-gray-600 hover:bg-gray-700'}
];

const parseSupabaseDataDates = (item: any, dateFields: string[]): any => {
  const newItem = { ...item };
  dateFields.forEach(field => {
    if (newItem[field] && typeof newItem[field] === 'string') {
      if (newItem[field].match(/^\d{4}-\d{2}-\d{2}$/)) {
         const [year, month, day] = newItem[field].split('-').map(Number);
         const date = new Date(Date.UTC(year, month - 1, day)); 
         if (!isNaN(date.getTime())) {
            newItem[field] = date;
         }
      } else { 
        const date = new Date(newItem[field]);
        if (!isNaN(date.getTime())) {
          newItem[field] = date;
        }
      }
    }
  });
  return newItem;
};


export const App: React.FC = () => {
  if (hasConfigErrors) {
    return <ConfigurationErrorPage />;
  }
  
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);


  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [selectedEquipmentItemId, setSelectedEquipmentItemId] = useState<string | null>(null);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const [currentAppView, setCurrentAppViewInternal] = useState<ViewMode>('home');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const setViewMode = (newMode: ViewMode, feedback?: AppFeedback) => {
    if (feedback) { 
      sessionStorage.setItem('appFeedback', JSON.stringify(feedback));
    }
    setCurrentAppViewInternal(newMode);
  };

  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [globalAppFeedback, setGlobalAppFeedback] = useState<AppFeedback | null>(null);

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);
  const [isTaskLoading, setIsTaskLoading] = useState<boolean>(false); 
  const [isEquipmentLoading, setIsEquipmentLoading] = useState<boolean>(false);
  const [isContractsLoading, setIsContractsLoading] = useState<boolean>(false);

  const activeChatsRef = useRef<Map<string, Chat>>(new Map());
  
  useEffect(() => {
    if (!supabase) {
      setIsSessionLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session as any); // Cast to any if Supabase Session type conflicts
      setIsSessionLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session as any); // Cast to any if Supabase Session type conflicts
        setIsSessionLoading(false);
        if (!session) { // If user logs out, redirect to home (which will become login)
            setCurrentAppViewInternal('home');
        }
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);


  useEffect(() => {
    const storedFeedback = sessionStorage.getItem('appFeedback');
    if (storedFeedback) {
      try {
        setGlobalAppFeedback(JSON.parse(storedFeedback));
        sessionStorage.removeItem('appFeedback');
      } catch (e) {
        console.error("Failed to parse appFeedback from session storage", e);
        sessionStorage.removeItem('appFeedback');
      }
    }
  }, [currentAppView]);

 useEffect(() => {
    if (!supabase || !session) {  // Don't fetch if no session
      setIsLoading(false);
      setTickets([]);
      setTasks([]);
      setEquipmentItems([]);
      setContracts([]);
      return;
    }
    
    const shouldFetchTickets = ['list', 'detail', 'dashboard', 'reports'].includes(currentAppView);
    const shouldFetchTasks = ['tasks', 'taskForm', 'dashboard', 'reports'].includes(currentAppView);
    const shouldFetchEquipment = currentAppView.startsWith('inventory') || ['dashboard', 'reports'].includes(currentAppView);
    const shouldFetchContracts = ['contractsList', 'contractForm', 'dashboard', 'reports'].includes(currentAppView);

    let isActive = true; 
    setGlobalAppFeedback(null);

    const fetchTicketsAndMessages = async () => {
      if (!shouldFetchTickets) return;
      setIsLoading(true);
      try {
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false });

        if (!isActive) return;
        if (ticketsError) throw ticketsError;
        if (!ticketsData) { setTickets([]); return; }
        
        const parsedTickets = ticketsData.map(ticket => parseSupabaseDataDates(ticket, ['created_at', 'updated_at']));
        const ticketIds = parsedTickets.map(ticket => ticket.id);

        if (ticketIds.length > 0) {
            const { data: allMessagesData, error: messagesError } = await supabase
            .from('messages')
            .select('*') 
            .in('ticket_id', ticketIds) 
            .order('timestamp', { ascending: true });
            
            if (!isActive) return;
            if (messagesError) console.error(`Error fetching messages:`, messagesError.message);

            const messagesByTicketId = new Map<string, Message[]>();
            if (allMessagesData) {
            allMessagesData.forEach((dbMsg: any) => { 
                let sender: 'user' | 'ai' = 'ai'; 
                if (dbMsg.sender_type === 'user') sender = 'user';
                
                const appMsg: Partial<Message> = {
                    id: dbMsg.id, ticket_id: dbMsg.ticket_id,
                    text: dbMsg.text_content || dbMsg.text || '', 
                    timestamp: dbMsg.timestamp ? new Date(dbMsg.timestamp) : new Date(),
                    isStreaming: false, sender: sender,
                    // updated_at is intentionally not mapped from db here for messages as it might not exist
                };
                if (!appMsg.id || !appMsg.ticket_id) return; 
                const completeMessage = appMsg as Message;
                const currentMessages = messagesByTicketId.get(completeMessage.ticket_id!) || [];
                currentMessages.push(completeMessage);
                messagesByTicketId.set(completeMessage.ticket_id!, currentMessages);
            });
            }
            const ticketsWithConversations: Ticket[] = parsedTickets.map((ticket: any) => ({
            ...ticket, conversation: messagesByTicketId.get(ticket.id) || []
            }));
            if (isActive) setTickets(ticketsWithConversations);
        } else {
             if (isActive) setTickets([]);
        }
      } catch (error: any) {
        if (!isActive) return;
        console.error("Error in fetchTicketsAndMessages:", error.message);
        setGlobalAppFeedback({ type: 'error', message: "Erro ao carregar dados dos tickets." });
        setTickets([]);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    
    if (shouldFetchTickets) fetchTicketsAndMessages(); else if (!['list', 'detail', 'dashboard', 'reports'].includes(currentAppView)) setIsLoading(false);

    if (shouldFetchTasks) fetchTasksScoped();
    if (shouldFetchEquipment) fetchEquipmentItemsScoped();
    if (shouldFetchContracts) fetchContractsScoped();

    return () => { isActive = false; };
  }, [currentAppView, supabase, session]); // Add session as a dependency

  const fetchTasksScoped = useCallback(async () => {
    if (!supabase || !session) return; // Check session
    setIsTaskLoading(true);
    const { data, error } = await supabase.from('tasks').select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setGlobalAppFeedback({ type: 'error', message: 'Erro ao carregar tarefas: ' + error.message });
      setTasks([]);
    } else if (data) {
      const mappedTasks: Task[] = data.map((dbTask: any) => {
        const taskWithMappedDates = {
          ...dbTask,
          startDate: dbTask.start_date, 
          dueDate: dbTask.due_date,     
        };
        const parsedDatesTask = parseSupabaseDataDates(taskWithMappedDates, ['created_at', 'updated_at', 'startDate', 'dueDate']);
        
        return {
          id: parsedDatesTask.id,
          name: parsedDatesTask.name,
          subject: parsedDatesTask.subject,
          description: parsedDatesTask.description,
          status: parsedDatesTask.status as TaskStatusEnum, 
          department: parsedDatesTask.department,
          startDate: parsedDatesTask.startDate, 
          dueDate: parsedDatesTask.dueDate,     
          priority: parsedDatesTask.priority as TaskPriority, 
          classification: parsedDatesTask.classification as TaskClassification, 
          created_at: parsedDatesTask.created_at, 
          updated_at: parsedDatesTask.updated_at, 
        };
      });
      setTasks(mappedTasks);
    } else {
      setTasks([]);
    }
    setIsTaskLoading(false);
  }, [supabase, session]); // Add session


  const fetchEquipmentItemsScoped = useCallback(async () => {
    if (!supabase || !session) return; // Check session
    setIsEquipmentLoading(true);
    const { data, error } = await supabase.from('equipment_items').select('*')
      .order('created_at', { ascending: false });
    if (error) setGlobalAppFeedback({ type: 'error', message: 'Erro ao carregar inventário: ' + error.message });
    else if (data) {
        const mappedItems: EquipmentItem[] = data.map((dbItem: any) => {
            return parseSupabaseDataDates(dbItem, ['created_at', 'updated_at', 'purchase_date', 'warranty_end_date']) as EquipmentItem;
        });
        setEquipmentItems(mappedItems);
    } else {
        setEquipmentItems([]);
    }
    setIsEquipmentLoading(false);
  }, [supabase, session]); // Add session

  const fetchContractsScoped = useCallback(async () => {
    if (!supabase || !session) return; // Check session
    setIsContractsLoading(true);
    const { data, error } = await supabase.from('contracts').select('*')
      .order('renewal_or_expiry_date', { ascending: true });
    if (error) setGlobalAppFeedback({ type: 'error', message: 'Erro ao carregar contratos: ' + error.message });
    else if (data) {
        const mappedData = data.map(c => ({
          id: c.id, companyName: c.company_name, contractNumber: c.contract_number, productOrServiceName: c.product_or_service_name,
          contractValue: c.contract_value, startDate: c.start_date, renewalOrExpiryDate: c.renewal_or_expiry_date,
          endDate: c.end_date, description: c.description, expiryNotificationDays: c.expiry_notification_days,
          created_at: c.created_at, updated_at: c.updated_at,
        }));
        setContracts(mappedData.map(c => parseSupabaseDataDates(c, ['created_at', 'updated_at', 'startDate', 'renewalOrExpiryDate', 'endDate'])) as Contract[]);
    }
    setIsContractsLoading(false);
  }, [supabase, session]); // Add session


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleSidebarNavigate = (newMode: ViewMode) => {
      setSelectedTicketId(null); 
      setSelectedTaskId(null); 
      setSelectedEquipmentItemId(null);
      setSelectedContractId(null);
      setReportData(null); 
      setViewMode(newMode);
  };
  
  const handleLogout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
        setGlobalAppFeedback({type: 'error', message: `Erro ao sair: ${error.message}`});
    } else {
        setSession(null); // Should be handled by onAuthStateChange, but good for immediate UI update
        setCurrentAppViewInternal('home'); // Navigate to home, which will show login
        setGlobalAppFeedback({type: 'success', message: 'Você saiu com sucesso.'});
    }
  };


  const handleChangeTicketStatus = async (ticketId: string, newStatus: TicketStatus): Promise<AppFeedback> => {
    if (!supabase) return { type: 'error', message: "Cliente Supabase não inicializado."};
    const ticketToUpdate = tickets.find(t => t.id === ticketId);
    if (!ticketToUpdate) return { type: 'error', message: "Ticket não encontrado."};

    const { data, error } = await supabase
      .from('tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) return { type: 'error', message: "Erro ao atualizar status: " + error.message };
    if (data) {
      const updatedTicketBase = parseSupabaseDataDates(data, ['created_at', 'updated_at']);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updatedTicketBase, status: newStatus } : t));
      return { type: 'success', message: `Status alterado para "${newStatus}".` };
    }
    return { type: 'error', message: "Falha desconhecida."};
  };

  const updateTicketConversationOptimistically = useCallback( (ticketId: string, newMessage?: Message, newStatus?: TicketStatus, streamingMessageId?: string, chunkText?: string, isFinalChunk: boolean = false) => {
      setTickets(prevTickets =>
        prevTickets.map(t => {
          if (t.id === ticketId) {
            let updatedConversation = [...t.conversation];
            if (newMessage && !updatedConversation.find(msg => msg.id === newMessage.id)) {
                updatedConversation.push(newMessage);
            }
            if (streamingMessageId && chunkText !== undefined) { 
              updatedConversation = updatedConversation.map(msg =>
                msg.id === streamingMessageId ? { ...msg, text: (msg.text || '') + chunkText, isStreaming: !isFinalChunk } : msg
              );
            } else if (streamingMessageId && isFinalChunk) { 
                 updatedConversation = updatedConversation.map(msg =>
                msg.id === streamingMessageId ? { ...msg, isStreaming: false } : msg
              );
            }
            return { ...t, conversation: updatedConversation, status: newStatus || t.status, updated_at: new Date() };
          }
          return t;
        })
      );
    }, []);

  const processAiStream = async (ticketId: string, stream: AsyncIterableIterator<GenerateContentResponse> | null, initialAiMessageId: string): Promise<AppFeedback> => {
    if (!stream || !supabase) {
        const errorMsg = "Erro: Stream da IA ou Supabase não disponível.";
        setIsAiResponding(false);
        try {
            await supabase?.from('tickets').update({ status: TicketStatus.OPEN, updated_at: new Date().toISOString() }).eq('id', ticketId);
            const failText = "Falha ao processar stream da IA.";
            await supabase?.from('messages').update({ 
              text_content: failText.trim(), 
              timestamp: new Date().toISOString(), 
              sender_type: 'ai',
              // updated_at removed
            }).eq('id', initialAiMessageId);
            updateTicketConversationOptimistically(ticketId, undefined, TicketStatus.OPEN, initialAiMessageId, failText.trim(), true);
            setTickets(prevTickets => prevTickets.map(t => t.id === ticketId ? { ...t, status: TicketStatus.OPEN, updated_at: new Date() } : t));
        } catch (dbError) { console.error("DB error during AI stream failure handling:", dbError); }
        return { type: 'error', message: errorMsg };
    }
    let fullAiText = '';
    try {
      for await (const chunk of stream) {
        const chunkText = chunk.text; 
        if (chunkText !== undefined) { 
            fullAiText += chunkText;
            updateTicketConversationOptimistically(ticketId, undefined, undefined, initialAiMessageId, chunkText, false);
        }
      }
      updateTicketConversationOptimistically(ticketId, undefined, undefined, initialAiMessageId, '', true); 
      
      const isAiGeneratedError = fullAiText.toLowerCase().includes("erro:") || fullAiText.toLowerCase().includes("falha:");
      const finalTicketStatus = isAiGeneratedError ? TicketStatus.OPEN : TicketStatus.PENDING_USER;

      const { error: messageError } = await supabase.from('messages').update({ 
        text_content: fullAiText, 
        timestamp: new Date().toISOString(),
        // updated_at removed
      }).eq('id', initialAiMessageId); 
      if (messageError) throw messageError;

      await supabase.from('tickets').update({ status: finalTicketStatus, updated_at: new Date().toISOString() }).eq('id', ticketId);
      setTickets(prevTickets => prevTickets.map(t => t.id === ticketId ? { ...t, status: finalTicketStatus, updated_at: new Date() } : t));
      
      setIsAiResponding(false);
      if (isAiGeneratedError) {
        return { type: 'error', message: `IA reportou um erro: ${fullAiText.substring(0,100)}...` };
      }
      return { type: 'success', message: "Resposta da IA recebida." };

    } catch (error: any) {
      console.error("Error processing AI stream:", error.message);
      const errorText = "Desculpe, erro ao processar com a IA.";
      try {
        await supabase.from('messages').update({ 
          text_content: errorText, 
          timestamp: new Date().toISOString(),
          // updated_at removed
        }).eq('id', initialAiMessageId);
        updateTicketConversationOptimistically(ticketId, undefined, TicketStatus.OPEN, initialAiMessageId, errorText.substring(fullAiText.length || 0), true);
        await supabase.from('tickets').update({ status: TicketStatus.OPEN, updated_at: new Date().toISOString() }).eq('id', ticketId);
        setTickets(prevTickets => prevTickets.map(t => t.id === ticketId ? { ...t, status: TicketStatus.OPEN, updated_at: new Date() } : t));
      } catch (dbError) { console.error("DB error during AI stream error handling:", dbError); }
      setIsAiResponding(false);
      return { type: 'error', message: "Erro na IA: " + error.message };
    }
  };

  const handleCreateTicket = useCallback(async (ticketData: AppTicketFormData): Promise<AppFeedback & { ticketId?: string }> => {
    if (!supabase) return { type: 'error', message: "Cliente Supabase não inicializado." };
    if (!isAiAvailable()) {
        return { type: 'error', message: `IA indisponível: ${geminiInitializationError || "Erro desconhecido na IA."}` };
    }
    
    setIsAiResponding(true);
    setGlobalAppFeedback(null);

    const newTicketPayload = {
      user_name: ticketData.userName, 
      department: ticketData.department, category: ticketData.category, urgency: ticketData.urgency,
      description: ticketData.description, status: TicketStatus.PENDING_AI,
    };

    const { data: createdTicket, error: ticketError } = await supabase
      .from('tickets').insert(newTicketPayload).select().single();

    if (ticketError || !createdTicket) {
      setIsAiResponding(false);
      return { type: 'error', message: "Falha ao registrar ticket: " + ticketError?.message };
    }

    const newTicketForState: Ticket = { ...parseSupabaseDataDates(createdTicket, ['created_at', 'updated_at']), conversation: [] } as Ticket;
    setTickets(prev => [newTicketForState, ...prev]);
    setSelectedTicketId(newTicketForState.id);
    setViewMode('detail', { type: 'info', message: `Ticket #${newTicketForState.id.substring(0,8)}... criado! Helpy analisando...` }); 
    
    try {
      const chat = createAiChat(HELP_DESK_SYSTEM_INSTRUCTION);
      if (!chat) throw new Error("Falha ao criar sessão de chat IA. " + (geminiInitializationError || ""));
      activeChatsRef.current.set(newTicketForState.id, chat);

      const { data: initialAiMsgData, error: initialMsgError } = await supabase.from('messages').insert({
          ticket_id: newTicketForState.id, sender_type: 'ai', text_content: '...', timestamp: new Date().toISOString()
      }).select().single(); 
      if (initialMsgError || !initialAiMsgData) throw initialMsgError || new Error("Failed to create placeholder AI message.");

      const initialAiMessageId = initialAiMsgData.id as string;
      updateTicketConversationOptimistically(newTicketForState.id, { id: initialAiMessageId, sender: 'ai', text: '', timestamp: new Date(), isStreaming: true, ticket_id: newTicketForState.id }, TicketStatus.PENDING_AI);

      const initialPrompt = `Um novo ticket de suporte foi criado:
ID do Ticket: ${newTicketForState.id}
Nome do Usuário: ${newTicketForState.user_name}
Categoria: ${newTicketForState.category}
Urgência: ${newTicketForState.urgency}
Descrição do Problema: "${newTicketForState.description}"

Por favor, acuse o recebimento deste ticket, cumprimente o usuário ${newTicketForState.user_name} cordialmente, e forneça assistência inicial ou faça perguntas claras para diagnosticar melhor o problema.`;
      
      const stream = await generateAiStream(chat, initialPrompt);
      if (!stream) throw new Error("Falha ao obter stream da IA. " + (geminiInitializationError || ""));

      return { ...(await processAiStream(newTicketForState.id, stream, initialAiMessageId)), ticketId: newTicketForState.id };

    } catch (error: any) {
      await supabase.from('tickets').update({ status: TicketStatus.OPEN, updated_at: new Date().toISOString() }).eq('id', newTicketForState.id);
      const errorMessageText = `Ticket criado, mas IA indisponível: ${error.message}.`;
      const { data: errDbMsg } = await supabase.from('messages').insert({ ticket_id: newTicketForState.id, sender_type: 'ai', text_content: errorMessageText, timestamp: new Date().toISOString() }).select().single();
      if(errDbMsg) updateTicketConversationOptimistically(newTicketForState.id, { id: errDbMsg.id as string, sender: 'ai', text: errorMessageText, timestamp: new Date(), ticket_id: newTicketForState.id }, TicketStatus.OPEN, undefined, undefined, true);
      setTickets(prev => prev.map(t => t.id === newTicketForState.id ? { ...t, status: TicketStatus.OPEN, updated_at: new Date() } : t));
      setIsAiResponding(false); 
      return { type: 'error', message: `Falha com IA: ${error.message}`, ticketId: newTicketForState.id };
    }
  }, [updateTicketConversationOptimistically, supabase, setViewMode]);

  const handleSendMessage = useCallback(async (ticketId: string, messageText: string): Promise<AppFeedback> => {
    if (!supabase) return { type: 'error', message: "Cliente Supabase não inicializado." };
    if (!isAiAvailable()) {
        return { type: 'error', message: `IA indisponível: ${geminiInitializationError || "Erro desconhecido na IA."}` };
    }
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status === TicketStatus.CANCELLED || ticket.status === TicketStatus.RESOLVED) return { type: 'error', message: "Ticket finalizado." };

    setIsAiResponding(true);
    setGlobalAppFeedback(null);

    const { data: userMsgData, error: userMsgError } = await supabase.from('messages').insert({
        ticket_id: ticketId, sender_type: 'user', text_content: messageText, timestamp: new Date().toISOString()
    }).select().single(); 

    if (userMsgError || !userMsgData) {
        setIsAiResponding(false);
        return { type: 'error', message: "Erro ao salvar mensagem: " + userMsgError?.message };
    }
    
    updateTicketConversationOptimistically(ticketId, { id: userMsgData.id as string, sender: 'user', text: messageText, timestamp: new Date(), ticket_id: ticketId }, TicketStatus.PENDING_AI);
    
    let chat = activeChatsRef.current.get(ticketId);
    if (!chat) {
        const history: Content[] = ticket.conversation
            .filter(msg => msg.id !== userMsgData.id) 
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }],
            }));
      chat = createAiChat(HELP_DESK_SYSTEM_INSTRUCTION, history);
      if(!chat) {
        await supabase.from('tickets').update({ status: TicketStatus.OPEN, updated_at: new Date().toISOString() }).eq('id', ticketId); 
        updateTicketConversationOptimistically(ticketId, undefined, TicketStatus.OPEN);
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: TicketStatus.OPEN } : t));
        setIsAiResponding(false);
        return { type: 'error', message: "Falha ao criar sessão de chat IA. " + (geminiInitializationError || "") };
      }
      activeChatsRef.current.set(ticketId, chat);
    }

    await supabase.from('tickets').update({ status: TicketStatus.PENDING_AI, updated_at: new Date().toISOString() }).eq('id', ticketId);

    try {
      const { data: initialAiMsgData, error: initialMsgError } = await supabase.from('messages').insert({
          ticket_id: ticketId, sender_type: 'ai', text_content: '...', timestamp: new Date().toISOString()
      }).select().single();
      if (initialMsgError || !initialAiMsgData) throw initialMsgError || new Error("Failed to create placeholder AI message.");

      const initialAiMessageId = initialAiMsgData.id as string;
      updateTicketConversationOptimistically(ticketId, { id: initialAiMessageId, sender: 'ai', text: '', timestamp: new Date(), isStreaming: true, ticket_id: ticketId });

      const stream = await generateAiStream(chat, messageText); 
      if (!stream) throw new Error("Falha ao obter stream da IA. " + (geminiInitializationError || ""));
      
      return processAiStream(ticketId, stream, initialAiMessageId); 
    } catch (error: any) {
      await supabase.from('tickets').update({ status: TicketStatus.OPEN, updated_at: new Date().toISOString() }).eq('id', ticketId); 
      const errorMessageText = "Erro ao enviar mensagem para IA.";
      const { data: errDbMsg } = await supabase.from('messages').insert({ ticket_id: ticketId, sender_type: 'ai', text_content: errorMessageText, timestamp: new Date().toISOString() }).select().single();
      if(errDbMsg) updateTicketConversationOptimistically(ticketId, { id: errDbMsg.id as string, sender: 'ai', text: errorMessageText, timestamp: new Date(), ticket_id: ticketId }, TicketStatus.OPEN, undefined, undefined, true);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: TicketStatus.OPEN } : t));
      setIsAiResponding(false);
      return { type: 'error', message: "Erro com IA: " + error.message };
    }
  }, [tickets, updateTicketConversationOptimistically, supabase]);

  const handleGenerateReport = useCallback(async (timeFrame: ReportTimeFrame): Promise<AppFeedback> => {
    if (!supabase) return { type: 'error', message: "Cliente Supabase não inicializado."};
     if (!isAiAvailable()) {
        return { type: 'error', message: `IA indisponível para gerar insights: ${geminiInitializationError || "Erro desconhecido."}` };
    }
    setIsReportLoading(true);
    setReportData(null);
    setGlobalAppFeedback(null);
    try {
      const { data: allSystemTicketsData, error: allTicketsError } = await supabase
          .from('tickets').select('*')
          .order('created_at', { ascending: false }); 
      if (allTicketsError) throw allTicketsError;
      
      const allParsedTickets = (allSystemTicketsData || []).map(ticket => parseSupabaseDataDates(ticket, ['created_at', 'updated_at']) as Ticket);
      const { filteredTickets, periodDescription } = reportService.filterTicketsByTimeFrame(allParsedTickets, timeFrame);
      const stats = reportService.calculateReportStats(filteredTickets);

      const { data: rawTaskData, error: taskFetchError } = await supabase.from('tasks').select('*');
      if (taskFetchError) throw new Error(`Error fetching tasks for report: ${taskFetchError.message}`);
      
      const mappedTasksForReport: Task[] = (rawTaskData || []).map((dbTask: any) => {
        const taskWithMappedDates = { ...dbTask, startDate: dbTask.start_date, dueDate: dbTask.due_date };
        const parsedDatesTask = parseSupabaseDataDates(taskWithMappedDates, ['created_at', 'updated_at', 'startDate', 'dueDate']);
        return {
          id: parsedDatesTask.id, name: parsedDatesTask.name, subject: parsedDatesTask.subject, description: parsedDatesTask.description,
          status: parsedDatesTask.status as TaskStatusEnum, department: parsedDatesTask.department, startDate: parsedDatesTask.startDate,
          dueDate: parsedDatesTask.dueDate, priority: parsedDatesTask.priority as TaskPriority, classification: parsedDatesTask.classification as TaskClassification,
          created_at: parsedDatesTask.created_at, updated_at: parsedDatesTask.updated_at,
        };
      });

      const { data: rawEquipmentData, error: equipmentFetchError } = await supabase.from('equipment_items').select('*');
      if (equipmentFetchError) throw new Error(`Error fetching equipment for report: ${equipmentFetchError.message}`);
      
      const mappedEquipmentForReport: EquipmentItem[] = (rawEquipmentData || []).map((dbItem: any) => {
        return parseSupabaseDataDates(dbItem, ['created_at', 'updated_at', 'purchase_date', 'warranty_end_date']) as EquipmentItem;
      });

      const aiInsights = await reportService.generateReportInsightsWithAI(
          filteredTickets, 
          mappedTasksForReport, 
          mappedEquipmentForReport, 
          periodDescription, 
          stats 
      );

      setReportData({ ...stats, periodDescription, timeFrameSelected: timeFrame, aiInsights });
      return { type: 'success', message: `Relatório para "${periodDescription}" gerado.`};
    } catch (error: any) {
      setReportData(null);
      return { type: 'error', message: "Erro ao gerar relatório: " + error.message};
    } finally {
      setIsReportLoading(false);
    }
  }, [supabase]); 

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<AppFeedback & { taskId?: string }> => {
    if (!supabase) return { type: 'error', message: 'Cliente Supabase não inicializado.' };
    setIsTaskLoading(true);
    setGlobalAppFeedback(null);
    const newTaskPayload = { ...taskData, start_date: taskData.startDate, due_date: taskData.dueDate };
    delete (newTaskPayload as any).startDate; delete (newTaskPayload as any).dueDate;

    const { data: createdTask, error } = await supabase.from('tasks').insert(newTaskPayload).select().single();
    setIsTaskLoading(false);
    if (error || !createdTask) return { type: 'error', message: 'Falha ao criar tarefa: ' + error?.message };
    
    const newTaskForState = parseSupabaseDataDates({ ...createdTask, startDate: createdTask.start_date, dueDate: createdTask.due_date }, ['created_at', 'updated_at', 'startDate', 'dueDate']) as Task;
    setTasks(prev => [newTaskForState, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setViewMode('tasks', { type: 'success', message: `Tarefa "${newTaskForState.name}" criada.` });
    return { type: 'success', message: `Tarefa criada.`, taskId: newTaskForState.id };
  };

  const handleUpdateTask = async (taskId: string, taskData: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<AppFeedback> => {
    if (!supabase) return { type: 'error', message: 'Cliente Supabase não inicializado.' };
    setIsTaskLoading(true);
    setGlobalAppFeedback(null);
    const updatePayload: any = { ...taskData, updated_at: new Date().toISOString() };
    if (taskData.startDate) { updatePayload.start_date = taskData.startDate; delete updatePayload.startDate; }
    if (taskData.dueDate) { updatePayload.due_date = taskData.dueDate; delete updatePayload.dueDate; }

    const { data: updatedTask, error } = await supabase.from('tasks').update(updatePayload).eq('id', taskId).select().single();
    setIsTaskLoading(false);
    if (error || !updatedTask) return { type: 'error', message: 'Falha ao atualizar tarefa: ' + error?.message };
    
    const updatedTaskForState = parseSupabaseDataDates({ ...updatedTask, startDate: updatedTask.start_date, dueDate: updatedTask.due_date }, ['created_at', 'updated_at', 'startDate', 'dueDate']) as Task;
    setTasks(prev => prev.map(t => (t.id === taskId ? updatedTaskForState : t)).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setViewMode('tasks', { type: 'success', message: `Tarefa "${updatedTaskForState.name}" atualizada.` });
    return { type: 'success', message: `Tarefa atualizada.` };
  };
  
  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatusEnum): Promise<void> => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    const feedback = await handleUpdateTask(taskId, { status: newStatus }); 
    setGlobalAppFeedback(feedback.type === 'error' ? feedback : { type: 'success', message: `Status da tarefa "${taskToUpdate.name}" alterado.`});
  };

  const handleCreateEquipmentItem = async (itemData: Omit<EquipmentItem, 'id' | 'created_at' | 'updated_at' > ): Promise<AppFeedback & { itemId?: string }> => {
    if (!supabase) return { type: 'error', message: 'Cliente Supabase não inicializado.' };
    setIsEquipmentLoading(true);
    setGlobalAppFeedback(null);
    const newItemPayload: any = { ...itemData, purchase_date: itemData.purchase_date || null, warranty_end_date: itemData.warranty_end_date || null };

    const { data: createdItem, error } = await supabase.from('equipment_items').insert(newItemPayload).select().single();
    setIsEquipmentLoading(false);
    if (error || !createdItem) return { type: 'error', message: 'Falha ao criar item: ' + error?.message };

    const newItemForState = parseSupabaseDataDates(createdItem, ['created_at', 'updated_at', 'purchase_date', 'warranty_end_date']) as EquipmentItem;
    setEquipmentItems(prev => [newItemForState, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setViewMode('inventoryStockList', { type: 'success', message: `Item "${newItemForState.name}" adicionado.` });
    return { type: 'success', message: `Item adicionado.`, itemId: newItemForState.id };
  };

  const handleUpdateEquipmentItem = async (itemId: string, itemData: Partial<Omit<EquipmentItem, 'id' | 'created_at'>>): Promise<AppFeedback> => {
    if (!supabase) return { type: 'error', message: 'Cliente Supabase não inicializado.' };
    setIsEquipmentLoading(true);
    setGlobalAppFeedback(null);
    const updatePayload: any = { ...itemData, updated_at: new Date().toISOString() };
    if (itemData.purchase_date !== undefined) updatePayload.purchase_date = itemData.purchase_date || null;
    if (itemData.warranty_end_date !== undefined) updatePayload.warranty_end_date = itemData.warranty_end_date || null;
    
    const { data: updatedItem, error } = await supabase.from('equipment_items').update(updatePayload).eq('id', itemId).select().single();
    setIsEquipmentLoading(false);
    if (error || !updatedItem) return { type: 'error', message: 'Falha ao atualizar item: ' + error?.message };
    
    const updatedItemForState = parseSupabaseDataDates(updatedItem, ['created_at', 'updated_at', 'purchase_date', 'warranty_end_date']) as EquipmentItem;
    setEquipmentItems(prev => prev.map(i => (i.id === itemId ? updatedItemForState : i)).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setViewMode('inventoryStockList', { type: 'success', message: `Item "${updatedItemForState.name}" atualizado.` });
    return { type: 'success', message: `Item atualizado.` };
  };

  const handleCreateContract = async (contractData: AppContractFormData): Promise<AppFeedback & { contractId?: string }> => {
    if (!supabase) return { type: 'error', message: 'Cliente Supabase não inicializado.' };
    setIsContractsLoading(true);
    const newContractPayload = {
      company_name: contractData.companyName, contract_number: contractData.contractNumber, product_or_service_name: contractData.productOrServiceName,
      contract_value: contractData.contractValue, start_date: contractData.startDate, renewal_or_expiry_date: contractData.renewalOrExpiryDate,
      end_date: contractData.endDate || null, description: contractData.description, expiry_notification_days: contractData.expiryNotificationDays,
    };
    const { data: createdContract, error } = await supabase.from('contracts').insert(newContractPayload).select().single();
    setIsContractsLoading(false);
    if (error || !createdContract) return { type: 'error', message: 'Falha ao criar contrato: ' + error?.message };

    const newContractForState = parseSupabaseDataDates({ ...createdContract, companyName: createdContract.company_name, contractNumber: createdContract.contract_number, productOrServiceName: createdContract.product_or_service_name, contractValue: createdContract.contract_value, startDate: createdContract.start_date, renewalOrExpiryDate: createdContract.renewal_or_expiry_date, endDate: createdContract.end_date, expiryNotificationDays: createdContract.expiry_notification_days }, ['created_at', 'updated_at', 'startDate', 'renewalOrExpiryDate', 'endDate']) as Contract;
    setContracts(prev => [newContractForState, ...prev].sort((a,b) => new Date(b.renewalOrExpiryDate).getTime() - new Date(a.renewalOrExpiryDate).getTime()));
    setViewMode('contractsList', { type: 'success', message: `Contrato "${newContractForState.contractNumber}" criado.` });
    return { type: 'success', message: `Contrato criado.`, contractId: newContractForState.id };
  };

  const handleUpdateContract = async (contractId: string, contractData: Partial<AppContractFormData>): Promise<AppFeedback> => {
    if (!supabase) return { type: 'error', message: 'Cliente Supabase não inicializado.' };
    setIsContractsLoading(true);
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (contractData.companyName !== undefined) updatePayload.company_name = contractData.companyName;
    if (contractData.contractNumber !== undefined) updatePayload.contract_number = contractData.contractNumber;
    if (contractData.productOrServiceName !== undefined) updatePayload.product_or_service_name = contractData.productOrServiceName;
    if (contractData.contractValue !== undefined) updatePayload.contract_value = contractData.contractValue;
    if (contractData.startDate !== undefined) updatePayload.start_date = contractData.startDate;
    if (contractData.renewalOrExpiryDate !== undefined) updatePayload.renewal_or_expiry_date = contractData.renewalOrExpiryDate;
    if (contractData.endDate !== undefined) updatePayload.end_date = contractData.endDate || null;
    if (contractData.description !== undefined) updatePayload.description = contractData.description;
    if (contractData.expiryNotificationDays !== undefined) updatePayload.expiry_notification_days = contractData.expiryNotificationDays;
    
    const { data: updatedContract, error } = await supabase.from('contracts').update(updatePayload).eq('id', contractId).select().single();
    setIsContractsLoading(false);
    if (error || !updatedContract) return { type: 'error', message: 'Falha ao atualizar contrato: ' + error?.message };
    
    const updatedContractForState = parseSupabaseDataDates({ ...updatedContract, companyName: updatedContract.company_name, contractNumber: updatedContract.contract_number, productOrServiceName: updatedContract.product_or_service_name, contractValue: updatedContract.contract_value, startDate: updatedContract.start_date, renewalOrExpiryDate: updatedContract.renewal_or_expiry_date, endDate: updatedContract.end_date, expiryNotificationDays: updatedContract.expiry_notification_days }, ['created_at', 'updated_at', 'startDate', 'renewalOrExpiryDate', 'endDate']) as Contract;
    setContracts(prev => prev.map(c => (c.id === contractId ? updatedContractForState : c)).sort((a,b) => new Date(b.renewalOrExpiryDate).getTime() - new Date(a.renewalOrExpiryDate).getTime()));
    setViewMode('contractsList', { type: 'success', message: `Contrato "${updatedContractForState.contractNumber}" atualizado.` });
    return { type: 'success', message: `Contrato atualizado.` };
  };
  

  const mainContentMargin = 'm-0 sm:m-5'; 
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);
  const selectedTaskForForm = tasks.find(t => t.id === selectedTaskId);
  const selectedEquipmentItemForForm = equipmentItems.find(i => i.id === selectedEquipmentItemId);
  const selectedContractForForm = contracts.find(c => c.id === selectedContractId);

  const showGeneralLoadingSpinner = 
    (currentAppView === 'list' && isLoading && tickets.length === 0) ||
    (currentAppView === 'tasks' && isTaskLoading && tasks.length === 0) ||
    (currentAppView === 'contractsList' && isContractsLoading && contracts.length === 0) ||
    (currentAppView === 'dashboard' && (isLoading || isTaskLoading || isEquipmentLoading || isContractsLoading) && tickets.length === 0 && tasks.length === 0 && equipmentItems.length === 0 && contracts.length === 0) ||
    (currentAppView === 'reports' && !reportData && (isReportLoading || isLoading || isTaskLoading || isEquipmentLoading || isContractsLoading)) ||
    (currentAppView.startsWith('inventory') && 
     !['inventoryDashboard', 'inventoryItemForm'].includes(currentAppView) &&
     isEquipmentLoading && 
     ((currentAppView === 'inventoryStockList' && equipmentItems.length === 0) ||
      (currentAppView === 'inventoryDeployedList' && equipmentItems.length === 0))
    ) ||
    (currentAppView === 'inventoryDashboard' && isEquipmentLoading && equipmentItems.length === 0);

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <HPDSKLogoIcon className="w-20 h-20 mb-4 animate-pulse" />
        <LoadingSpinner size="w-10 h-10" />
        <p className="mt-3 text-lg">Verificando sessão...</p>
      </div>
    );
  }

  if (!session) {
    return <LoginPage supabaseClient={supabase} setGlobalAppFeedback={setGlobalAppFeedback} />;
  }
  
  return (
    <div className="min-h-screen flex bg-gray-900 text-gray-100 transition-colors duration-300">
      <SidebarNav
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        currentView={currentAppView}
        onNavigate={handleSidebarNavigate}
        navItems={mainNavItemsConfig} 
        onLogout={handleLogout}
      />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        {globalAppFeedback && (
          <div className="p-0 print:hidden">
            <FeedbackAlert 
                type={globalAppFeedback.type} 
                message={globalAppFeedback.message} 
                onDismiss={() => setGlobalAppFeedback(null)} 
            />
          </div>
        )}
        <main className="flex-grow p-0 overflow-y-auto">
            {showGeneralLoadingSpinner && (
                <div className="flex justify-center items-center h-full">
                    <LoadingSpinner size="w-12 h-12" />
                    <p className="ml-3 text-gray-300">Carregando...</p>
                </div>
            )}
            {currentAppView === 'home' && !showGeneralLoadingSpinner && ( 
                <HomePage onNavigate={handleSidebarNavigate} navItems={mainNavItemsConfig} />
            )}
            {currentAppView === 'dashboard' && !showGeneralLoadingSpinner && (
                <DashboardView 
                    tickets={tickets} 
                    tasks={tasks} 
                    onNavigateToList={() => handleSidebarNavigate('list')} 
                    onNavigateToTasks={() => handleSidebarNavigate('tasks')}
                />
            )}
            {currentAppView === 'reports' && !showGeneralLoadingSpinner && (
                <ReportsPage
                    allTickets={tickets} reportData={reportData} isReportLoading={isReportLoading}
                    onGenerateReport={handleGenerateReport}
                />
            )}
            {currentAppView === 'help' && !showGeneralLoadingSpinner && (
                 <HelpPage />
            )}
            {currentAppView === 'list' && !showGeneralLoadingSpinner && (
                <TicketList 
                    tickets={tickets} selectedTicketId={selectedTicketId} 
                    onSelectTicket={(id) => { setSelectedTicketId(id); setViewMode('detail');}} 
                    onNewTicket={() => { setSelectedTicketId(null); setViewMode('form');}} 
                    isLoading={isLoading && tickets.length === 0} 
                />
            )}
            {currentAppView === 'form' && ( 
                <TicketForm 
                    onSubmitTicket={handleCreateTicket} 
                    onCancel={() => handleSidebarNavigate('list')} 
                    isLoading={isAiResponding} 
                />
            )}
            {currentAppView === 'detail' && selectedTicket && ( 
                <TicketDetailView
                    ticket={selectedTicket} 
                    onSendMessage={handleSendMessage} 
                    onBackToList={() => handleSidebarNavigate('list')}
                    isAiResponding={isAiResponding && selectedTicket.conversation.some(m => m.isStreaming)}
                    onChangeStatus={handleChangeTicketStatus}
                    initialFeedback={globalAppFeedback}
                    clearInitialFeedback={() => setGlobalAppFeedback(null)}
                />
            )}
             {currentAppView === 'detail' && !selectedTicket && !isLoading && tickets.length > 0 && (
                 <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                    <p className="text-xl">Selecione um ticket da lista para ver os detalhes.</p>
                </div>
            )}

            {currentAppView === 'tasks' && !showGeneralLoadingSpinner && (
              <TaskList
                tasks={tasks}
                onNewTask={() => { setSelectedTaskId(null); setViewMode('taskForm'); }}
                onEditTask={(id) => { setSelectedTaskId(id); setViewMode('taskForm'); }}
                isLoading={isTaskLoading && tasks.length === 0}
              />
            )}
            {currentAppView === 'taskForm' && ( 
              <TaskForm
                onSubmitTask={async (data: AppTaskFormData) => { 
                  if (selectedTaskId) { 
                    return handleUpdateTask(selectedTaskId, data);
                  } else { 
                    const taskToCreate: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
                        name: data.name!, subject: data.subject!, description: data.description!,
                        status: data.status || TaskStatusEnum.ABERTO, department: data.department!,
                        startDate: data.startDate!, dueDate: data.dueDate!,
                        priority: data.priority || TaskPriority.MEDIA, classification: data.classification || TaskClassification.OUTRO,
                    };
                    return handleCreateTask(taskToCreate);
                  }
                }}
                onCancel={() => { setSelectedTaskId(null); setViewMode('tasks');}}
                isLoading={isTaskLoading} 
                initialTaskData={selectedTaskForForm}
              />
            )}

            {currentAppView === 'inventoryDashboard' && !showGeneralLoadingSpinner && (
              <InventoryDashboardView
                equipmentItems={equipmentItems}
                onNavigate={(view) => { if (view === 'inventoryItemForm') setSelectedEquipmentItemId(null); handleSidebarNavigate(view); }}
              />
            )}
            {currentAppView === 'inventoryItemForm' && (
                 <InventoryItemForm
                    onSubmitItem={async (data: AppInventoryItemFormData) => { 
                        if (selectedEquipmentItemId) return handleUpdateEquipmentItem(selectedEquipmentItemId, data);
                        else {
                            const itemToCreate: Omit<EquipmentItem, 'id' | 'created_at' | 'updated_at'> = { ...data };
                            return handleCreateEquipmentItem(itemToCreate);
                        }
                    }}
                    onCancel={() => { setSelectedEquipmentItemId(null); setViewMode('inventoryDashboard');}}
                    isLoading={isEquipmentLoading}
                    initialItemData={selectedEquipmentItemForForm}
                 />
            )}
            {currentAppView === 'inventoryStockList' && !showGeneralLoadingSpinner && (
                <InventoryStockList 
                    equipmentItems={equipmentItems.filter(item => item.status === EquipmentStatusEnum.EM_ESTOQUE || item.status === EquipmentStatusEnum.PEDIDO)} 
                    onNavigate={handleSidebarNavigate}
                    onEditItem={(id) => { setSelectedEquipmentItemId(id); setViewMode('inventoryItemForm'); }}
                    onAddItem={() => { setSelectedEquipmentItemId(null); setViewMode('inventoryItemForm');}}
                    isLoading={isEquipmentLoading && equipmentItems.length === 0}
                />
            )}
            {currentAppView === 'inventoryDeployedList' && !showGeneralLoadingSpinner && (
                <InventoryDeployedList 
                    equipmentItems={equipmentItems.filter(item => item.status === EquipmentStatusEnum.EM_USO || item.status === EquipmentStatusEnum.EMPRESTADO || item.status === EquipmentStatusEnum.EM_MANUTENCAO)} 
                    onNavigate={handleSidebarNavigate}
                    isLoading={isEquipmentLoading && equipmentItems.length === 0}
                />
            )}
            
            {currentAppView === 'contractsList' && !showGeneralLoadingSpinner && (
              <ContractList
                contracts={contracts} isLoading={isContractsLoading}
                onNewContract={() => { setSelectedContractId(null); setViewMode('contractForm'); }}
                onEditContract={(id) => { setSelectedContractId(id); setViewMode('contractForm'); }}
              />
            )}
            {currentAppView === 'contractForm' && (
              <ContractForm
                onSubmitContract={async (data: AppContractFormData) => {  
                  if (selectedContractId) return handleUpdateContract(selectedContractId, data);
                  else return handleCreateContract(data);
                }}
                onCancel={() => { setSelectedContractId(null); setViewMode('contractsList'); }}
                isLoading={isContractsLoading}
                initialContractData={selectedContractForForm}
              />
            )}
        </main>
      </div>
    </div>
  );
};
