

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chat, Content } from "@google/genai"; // Added Content
import type { GenerateContentResponse } from "@google/genai"; 
import type { Session as SupabaseSession, User } from '@supabase/supabase-js'; // Supabase specific types
import { 
    Ticket, Message, TicketStatus, IssueCategory, UrgencyLevel, ReportTimeFrame, ReportData,
    Task, TaskStatus as TaskStatusEnum, TaskPriority, TaskClassification,
    EquipmentItem, EquipmentType, EquipmentStatus as EquipmentStatusEnum, 
    Contract, 
    NavigationItemConfig,
    ViewMode,
    UserProfile,
    AppFeedback // Imported AppFeedback
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
import HelpPage from './components/HelpPage'; 
import UserProfilePage from './components/UserProfilePage'; // Added UserProfilePage
import HeaderBar from './components/HeaderBar'; // New HeaderBar for mobile
import { 
    createChat as createAiChat, 
    generateStream as generateAiStream, 
    isAiAvailable,
    geminiInitializationError 
} from './services/geminiService';
import { HELP_DESK_SYSTEM_INSTRUCTION, HELP_APP_SYSTEM_INSTRUCTION } from './constants';
import { ChartBarIcon, TicketIcon, ClipboardDocumentListIcon, ArchiveBoxIcon, DocumentTextIcon, DocumentDuplicateIcon, LifebuoyIcon, UserCircleIcon, HPDSKLogoIcon } from './components/icons';


// AppFeedback interface moved to types.ts

const mainNavItemsConfig: NavigationItemConfig[] = [
  { viewMode: 'dashboard', label: 'Dashboard', icon: ChartBarIcon, colorClass: 'bg-purple-600 hover:bg-purple-700' },
  { viewMode: 'list', label: 'Tickets', icon: TicketIcon, colorClass: 'bg-indigo-600 hover:bg-indigo-700' }, 
  { viewMode: 'tasks', label: 'Tarefas', icon: ClipboardDocumentListIcon, colorClass: 'bg-teal-600 hover:bg-teal-700' },
  { viewMode: 'inventoryDashboard', label: 'Inventário', icon: ArchiveBoxIcon, colorClass: 'bg-pink-600 hover:bg-pink-700' },
  { viewMode: 'contractsList', label: 'Contratos', icon: DocumentDuplicateIcon, colorClass: 'bg-cyan-600 hover:bg-cyan-700' },
  { viewMode: 'reports', label: 'Relatórios', icon: DocumentTextIcon, colorClass: 'bg-orange-600 hover:bg-orange-700' },
  { viewMode: 'profile', label: 'Meu Perfil', icon: UserCircleIcon, colorClass: 'bg-slate-600 hover:bg-slate-700'}, // Added profile
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
  
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); 
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
  
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);


  const setViewMode = (newMode: ViewMode, feedback?: AppFeedback) => {
    if (feedback) { 
      sessionStorage.setItem('appFeedback', JSON.stringify(feedback));
    }
    setCurrentAppViewInternal(newMode);
    if (isMobileView) setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);
  const [globalAppFeedback, setGlobalAppFeedback] = useState<AppFeedback | null>(null);

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);
  const [isTaskLoading, setIsTaskLoading] = useState<boolean>(false); 
  const [isEquipmentLoading, setIsEquipmentLoading] = useState<boolean>(false);
  const [isContractsLoading, setIsContractsLoading] = useState<boolean>(false);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false); 

  const activeChatsRef = useRef<Map<string, Chat>>(new Map());

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobileView(mobile);
        if (!mobile) { // If resizing to desktop view
            setIsMobileMenuOpen(false); // Ensure mobile overlay menu is closed
        } else { // If resizing to mobile view
            // setIsDesktopSidebarOpen(true); // Optionally reset desktop sidebar state or manage as needed
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!supabase || !userId) return;
    setIsProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      if (data) {
        setUserProfile(parseSupabaseDataDates(data, ['updated_at', 'created_at']) as UserProfile);
      } else {
        setUserProfile(null); // Profile might not exist yet if trigger hasn't run
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error.message);
      setGlobalAppFeedback({type: 'error', message: `Erro ao buscar perfil: ${error.message}`});
      setUserProfile(null); 
    } finally {
      setIsProfileLoading(false);
    }
  }, [supabase]);
  
  useEffect(() => {
    if (!supabase) {
      setIsSessionLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user?.id) {
        fetchUserProfile(currentSession.user.id);
      }
      setIsSessionLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user?.id) {
            if (newSession.user.id !== session?.user?.id) { 
                 fetchUserProfile(newSession.user.id);
            }
        } else {
            setUserProfile(null); 
            if (currentAppView !== 'home') setCurrentAppViewInternal('home'); // Redirect to home on logout if not already there
        }
        // setIsSessionLoading(false); // This was causing quick flashes, better to keep session loading tied to initial getSession
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile, session?.user?.id, currentAppView]);


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
    // setGlobalAppFeedback(null); // Removed this to persist feedback across navigations until explicitly cleared

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
  }, [currentAppView, supabase, session]); 

  const fetchTasksScoped = useCallback(async () => {
    if (!supabase || !session) return; 
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
  }, [supabase, session]); 


  const fetchEquipmentItemsScoped = useCallback(async () => {
    if (!supabase || !session) return; 
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
  }, [supabase, session]); 

  const fetchContractsScoped = useCallback(async () => {
    if (!supabase || !session) return; 
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
  }, [supabase, session]); 


  const toggleSidebar = () => {
    if (isMobileView) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
    }
  };

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
        setSession(null); 
        setUserProfile(null); 
        setCurrentAppViewInternal('home'); 
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
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: TicketStatus.OPEN, updated_at: new Date() } : t));
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
  
  const handleCreateContract = async (contractData: Omit<Contract, 'id' | 'created_at' | 'updated_at'>): Promise<AppFeedback & { contractId?: string }> => {
    if (!supabase) return { type: 'error', message: 'Cliente Supabase não inicializado.' };
    setIsContractsLoading(true);
    setGlobalAppFeedback(null);
    const newContractPayload = {
        company_name: contractData.companyName,
        contract_number: contractData.contractNumber,
        product_or_service_name: contractData.productOrServiceName,
        contract_value: contractData.contractValue,
        start_date: contractData.startDate,
        renewal_or_expiry_date: contractData.renewalOrExpiryDate,
        end_date: contractData.endDate || null,
        description: contractData.description || null,
        expiry_notification_days: contractData.expiryNotificationDays
    };

    const { data: createdContract, error } = await supabase.from('contracts').insert(newContractPayload).select().single();
    setIsContractsLoading(false);
    if (error || !createdContract) return { type: 'error', message: 'Falha ao criar contrato: ' + error?.message };
    
    const newContractForState = parseSupabaseDataDates({
        ...createdContract, companyName: createdContract.company_name, contractNumber: createdContract.contract_number, productOrServiceName: createdContract.product_or_service_name,
        contractValue: createdContract.contract_value, startDate: createdContract.start_date, renewalOrExpiryDate: createdContract.renewal_or_expiry_date,
        endDate: createdContract.end_date, expiryNotificationDays: createdContract.expiry_notification_days
    }, ['created_at', 'updated_at', 'startDate', 'renewalOrExpiryDate', 'endDate']) as Contract;

    setContracts(prev => [newContractForState, ...prev].sort((a,b) => new Date(a.renewalOrExpiryDate).getTime() - new Date(b.renewalOrExpiryDate).getTime()));
    setViewMode('contractsList', { type: 'success', message: `Contrato "${newContractForState.contractNumber}" adicionado.` });
    return { type: 'success', message: `Contrato adicionado.`, contractId: newContractForState.id };
  };

  const handleUpdateContract = async (contractId: string, contractData: Partial<Omit<Contract, 'id' | 'created_at'>>): Promise<AppFeedback> => {
    if (!supabase) return { type: 'error', message: 'Cliente Supabase não inicializado.' };
    setIsContractsLoading(true);
    setGlobalAppFeedback(null);
    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (contractData.companyName !== undefined) updatePayload.company_name = contractData.companyName;
    if (contractData.contractNumber !== undefined) updatePayload.contract_number = contractData.contractNumber;
    if (contractData.productOrServiceName !== undefined) updatePayload.product_or_service_name = contractData.productOrServiceName;
    if (contractData.contractValue !== undefined) updatePayload.contract_value = contractData.contractValue;
    if (contractData.startDate !== undefined) updatePayload.start_date = contractData.startDate;
    if (contractData.renewalOrExpiryDate !== undefined) updatePayload.renewal_or_expiry_date = contractData.renewalOrExpiryDate;
    if (contractData.endDate !== undefined) updatePayload.end_date = contractData.endDate || null;
    if (contractData.description !== undefined) updatePayload.description = contractData.description || null;
    if (contractData.expiryNotificationDays !== undefined) updatePayload.expiry_notification_days = contractData.expiryNotificationDays;

    const { data: updatedContract, error } = await supabase.from('contracts').update(updatePayload).eq('id', contractId).select().single();
    setIsContractsLoading(false);
    if (error || !updatedContract) return { type: 'error', message: 'Falha ao atualizar contrato: ' + error?.message };
    
    const updatedContractForState = parseSupabaseDataDates({
      ...updatedContract, companyName: updatedContract.company_name, contractNumber: updatedContract.contract_number, productOrServiceName: updatedContract.product_or_service_name,
      contractValue: updatedContract.contract_value, startDate: updatedContract.start_date, renewalOrExpiryDate: updatedContract.renewal_or_expiry_date,
      endDate: updatedContract.end_date, expiryNotificationDays: updatedContract.expiry_notification_days
    }, ['created_at', 'updated_at', 'startDate', 'renewalOrExpiryDate', 'endDate']) as Contract;

    setContracts(prev => prev.map(c => (c.id === contractId ? updatedContractForState : c)).sort((a,b) => new Date(a.renewalOrExpiryDate).getTime() - new Date(b.renewalOrExpiryDate).getTime()));
    setViewMode('contractsList', { type: 'success', message: `Contrato "${updatedContractForState.contractNumber}" atualizado.` });
    return { type: 'success', message: `Contrato atualizado.` };
  };
  
  const handleUpdateUserProfile = async (userId: string, dataToUpdate: { full_name?: string | null; department?: string | null }): Promise<AppFeedback> => {
    if (!supabase || !userId) return { type: 'error', message: 'Usuário não autenticado ou Supabase não disponível.' };
    setIsProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...dataToUpdate, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const updatedProfile = parseSupabaseDataDates(data, ['updated_at', 'created_at']) as UserProfile;
        setUserProfile(updatedProfile); // Update local state
        return { type: 'success', message: 'Perfil atualizado com sucesso!' };
      }
      throw new Error('Falha ao atualizar perfil, nenhum dado retornado.');
    } catch (error: any) {
      return { type: 'error', message: `Erro ao atualizar perfil: ${error.message}` };
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleUpdateUserPassword = async (newPassword: string): Promise<AppFeedback> => {
    if (!supabase) return { type: 'error', message: 'Supabase não disponível.' };
    setIsProfileLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { type: 'success', message: 'Senha alterada com sucesso!' };
    } catch (error: any) {
      return { type: 'error', message: `Erro ao alterar senha: ${error.message}` };
    } finally {
      setIsProfileLoading(false);
    }
  };


  // --- Content Rendering Logic ---
  let content;
  if (isSessionLoading) {
    content = (
      <div className="flex flex-col items-center justify-center h-full">
        <LoadingSpinner size="w-12 h-12" />
        <p className="mt-3 text-gray-400">Carregando sessão...</p>
      </div>
    );
  } else if (!session) {
    content = <LoginPage supabaseClient={supabase} setGlobalAppFeedback={setGlobalAppFeedback} />;
  } else {
    switch (currentAppView) {
      case 'home':
        content = <HomePage onNavigate={handleSidebarNavigate} navItems={mainNavItemsConfig} />;
        break;
      case 'list':
        content = (
          <TicketList
            tickets={tickets}
            selectedTicketId={selectedTicketId}
            onSelectTicket={(id) => { setSelectedTicketId(id); setViewMode('detail'); }}
            onNewTicket={() => setViewMode('form')}
            isLoading={isLoading}
          />
        );
        break;
      case 'form':
        content = (
          <TicketForm
            onSubmitTicket={handleCreateTicket}
            onCancel={() => setViewMode(selectedTicketId ? 'detail' : 'list')}
            isLoading={isAiResponding || isLoading}
          />
        );
        break;
      case 'detail':
        const selectedTicket = tickets.find(t => t.id === selectedTicketId);
        content = selectedTicket ? (
          <TicketDetailView
            ticket={selectedTicket}
            onSendMessage={handleSendMessage}
            onBackToList={() => { setSelectedTicketId(null); setViewMode('list'); }}
            isAiResponding={isAiResponding}
            onChangeStatus={handleChangeTicketStatus}
            initialFeedback={globalAppFeedback}
            clearInitialFeedback={() => setGlobalAppFeedback(null)}
          />
        ) : (
          <div className="p-6 text-center text-gray-300">
             {isLoading ? <LoadingSpinner /> : "Ticket não encontrado ou ID inválido."}
          </div>
        );
        break;
      case 'dashboard':
        content = <DashboardView tickets={tickets} tasks={tasks} onNavigateToList={() => setViewMode('list')} onNavigateToTasks={() => setViewMode('tasks')} />;
        break;
      case 'reports':
        content = <ReportsPage allTickets={tickets} reportData={reportData} isReportLoading={isReportLoading} onGenerateReport={handleGenerateReport} />;
        break;
      case 'tasks':
        content = (
            <TaskList 
                tasks={tasks} 
                isLoading={isTaskLoading} 
                onNewTask={() => { setSelectedTaskId(null); setViewMode('taskForm');}}
                onEditTask={(id) => { setSelectedTaskId(id); setViewMode('taskForm');}}
            />
        );
        break;
      case 'taskForm':
        const selectedTask = tasks.find(t => t.id === selectedTaskId);
        content = (
            <TaskForm 
                onSubmitTask={selectedTask ? (data) => handleUpdateTask(selectedTask.id, data) : handleCreateTask}
                onCancel={() => { setSelectedTaskId(null); setViewMode('tasks'); }}
                isLoading={isTaskLoading}
                initialTaskData={selectedTask}
            />
        );
        break;
      case 'inventoryDashboard':
        content = <InventoryDashboardView equipmentItems={equipmentItems} onNavigate={handleSidebarNavigate} />;
        break;
      case 'inventoryStockList':
        content = <InventoryStockList 
                        equipmentItems={equipmentItems} 
                        onNavigate={handleSidebarNavigate}
                        isLoading={isEquipmentLoading}
                        onAddItem={() => { setSelectedEquipmentItemId(null); setViewMode('inventoryItemForm'); }}
                        onEditItem={(id) => { setSelectedEquipmentItemId(id); setViewMode('inventoryItemForm'); }}
                  />;
        break;
      case 'inventoryDeployedList':
        content = <InventoryDeployedList equipmentItems={equipmentItems} onNavigate={handleSidebarNavigate} isLoading={isEquipmentLoading}/>;
        break;
      case 'inventoryItemForm':
        const selectedItem = equipmentItems.find(i => i.id === selectedEquipmentItemId);
        content = <InventoryItemForm 
                    onSubmitItem={selectedItem ? (data) => handleUpdateEquipmentItem(selectedItem.id, data) : handleCreateEquipmentItem}
                    onCancel={() => { setSelectedEquipmentItemId(null); setViewMode('inventoryStockList'); }}
                    isLoading={isEquipmentLoading}
                    initialItemData={selectedItem}
                  />;
        break;
      case 'contractsList':
        content = <ContractList 
                    contracts={contracts}
                    isLoading={isContractsLoading}
                    onNewContract={() => {setSelectedContractId(null); setViewMode('contractForm');}}
                    onEditContract={(id) => {setSelectedContractId(id); setViewMode('contractForm');}}
                  />;
        break;
      case 'contractForm':
        const selectedContract = contracts.find(c => c.id === selectedContractId);
        content = <ContractForm 
                    onSubmitContract={selectedContract ? (data) => handleUpdateContract(selectedContract.id, data) : handleCreateContract}
                    onCancel={() => {setSelectedContractId(null); setViewMode('contractsList');}}
                    isLoading={isContractsLoading}
                    initialContractData={selectedContract}
                  />;
        break;
      case 'help':
        content = <HelpPage />;
        break;
      case 'profile':
        content = <UserProfilePage 
                    session={session} 
                    userProfile={userProfile}
                    isProfileLoading={isProfileLoading}
                    onUpdateProfile={handleUpdateUserProfile}
                    onUpdatePassword={handleUpdateUserPassword}
                    onBack={() => setViewMode('dashboard')} // Or 'home'
                    setGlobalAppFeedback={setGlobalAppFeedback}
                  />;
        break;
      default:
        content = <HomePage onNavigate={handleSidebarNavigate} navItems={mainNavItemsConfig} />;
    }
  }

  // Hide initial load indicator once React is ready
  useEffect(() => {
    const initialLoadIndicator = document.getElementById('initial-load-indicator');
    if (initialLoadIndicator) {
      initialLoadIndicator.style.display = 'none';
    }
  }, []);

  const sidebarCurrentOpenState = isMobileView ? isMobileMenuOpen : isDesktopSidebarOpen;
  const mainContentPaddingClass = isMobileView ? 'pl-0' : (isDesktopSidebarOpen ? 'pl-60' : 'pl-20');


  return (
    <div className={`flex h-screen bg-gray-900 ${isMobileView && isMobileMenuOpen ? 'overflow-hidden' : ''}`}>
      {session && (
        <SidebarNav 
          isOpen={sidebarCurrentOpenState}
          isMobile={isMobileView}
          toggleSidebar={toggleSidebar}
          currentView={currentAppView}
          onNavigate={handleSidebarNavigate}
          navItems={mainNavItemsConfig}
          onLogout={handleLogout}
          closeMobileMenu={() => setIsMobileMenuOpen(false)}
        />
      )}
      {/* Overlay for mobile menu */}
      {isMobileView && isMobileMenuOpen && (
          <div 
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
          ></div>
      )}

      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${mainContentPaddingClass}`}>
        {session && isMobileView && (
            <HeaderBar 
                onToggleSidebar={() => setIsMobileMenuOpen(true)} 
                pageTitle={mainNavItemsConfig.find(item => item.viewMode === currentAppView)?.label || "HPDSK"}
            />
        )}
        <main className={`flex-1 p-3 sm:p-6 overflow-y-auto bg-gray-900`}>
            {globalAppFeedback && session && currentAppView !== 'detail' && ( 
                <FeedbackAlert 
                    type={globalAppFeedback.type} 
                    message={globalAppFeedback.message} 
                    onDismiss={() => setGlobalAppFeedback(null)}
                    className="mb-4" 
                />
            )}
            <div className={`${!session ? 'h-full' : 'bg-gray-900 h-full'}`}>
            {content}
            </div>
        </main>
      </div>
    </div>
  );
};

// Supabase types might already be imported globally, but explicit import is safer.
export type { User, SupabaseSession };
export type TicketFormData = AppTicketFormData;
export type TaskFormData = AppTaskFormData;
export type InventoryItemFormData = AppInventoryItemFormData;
export type ContractFormData = AppContractFormData;
