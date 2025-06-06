

import { Chat } from "@google/genai";

export enum IssueCategory {
  HARDWARE = "Hardware",
  SOFTWARE = "Software",
  NETWORK = "Rede",
  ACCOUNT = "Conta",
  OTHER = "Outro",
}

export enum UrgencyLevel {
  LOW = "Baixa",
  MEDIUM = "Média",
  HIGH = "Alta",
  CRITICAL = "Crítica",
}

export enum TicketStatus {
  OPEN = "Aberto",
  PENDING_AI = "Aguardando IA",
  PENDING_USER = "Aguardando Usuário",
  RESOLVED = "Resolvido",
  CANCELLED = "Cancelado",
}

export interface Message {
  id: string; // UUID from Supabase or client-generated for local chats
  sender: "user" | "ai";
  text: string;
  timestamp: Date | string; // Store as Date in app, string from DB
  isStreaming?: boolean;
  ticket_id?: string; // For Supabase relation
  text_content?: string; // alias for text if Supabase uses this
  updated_at?: Date | string; // Added optional updated_at
}

export interface Ticket {
  id: string; // UUID from Supabase
  user_name: string; 
  department: string; 
  category: IssueCategory;
  urgency: UrgencyLevel;
  description: string;
  status: TicketStatus;
  created_at: Date | string; // Store as Date in app, string from DB
  updated_at: Date | string; // Store as Date in app, string from DB
  conversation: Message[];
}

export enum ReportTimeFrame {
  TODAY = "Hoje",
  YESTERDAY = "Ontem",
  THIS_WEEK = "Esta Semana",
  LAST_WEEK = "Semana Passada",
  THIS_MONTH = "Este Mês",
  LAST_MONTH = "Mês Passado",
  THIS_YEAR = "Este Ano",
  LAST_YEAR = "Ano Passado",
}

export interface ReportData {
  periodDescription: string;
  timeFrameSelected: ReportTimeFrame;
  totalTickets: number;
  resolvedTickets: number;
  openTickets: number;
  cancelledTickets: number;
  pendingAiTickets: number;
  pendingUserTickets: number;
  ticketsByCategory: { category: IssueCategory; count: number }[];
  ticketsByUrgency: { urgency: UrgencyLevel; count: number }[];
  ticketsByStatus: { status: TicketStatus; count: number }[];
  aiInsights?: string;
}

// New Task related enums and interface
export enum TaskStatus {
  ABERTO = "Aberto",
  PENDENTE = "Pendente",
  EM_ANDAMENTO = "Em Andamento",
  CONCLUIDO = "Concluído",
  CANCELADO = "Cancelado",
}

export enum TaskPriority {
  ALTA = "Alta",
  MEDIA = "Média",
  BAIXA = "Baixa",
}

export enum TaskClassification {
  QUESTAO = "Questão",
  PROBLEMA = "Problema",
  REQUISICAO_FUNCIONALIDADE = "Requisição de Funcionalidade",
  MELHORIA = "Melhoria",
  OUTRO = "Outro",
}

export interface Task {
  id: string; // UUID
  name: string;
  subject: string;
  description: string;
  status: TaskStatus;
  department: string; // setor/sala
  startDate: Date | string; 
  dueDate: Date | string;   
  priority: TaskPriority;
  classification: TaskClassification;
  created_at: Date | string;
  updated_at: Date | string;
}

// --- Inventory Module Types ---

export enum EquipmentType {
  NOTEBOOK = "Notebook",
  DESKTOP = "Desktop",
  MONITOR = "Monitor",
  IMPRESSORA = "Impressora",
  SCANNER = "Scanner",
  ROTEADOR = "Roteador",
  SWITCH = "Switch",
  SERVIDOR = "Servidor",
  TABLET = "Tablet",
  CELULAR = "Celular Corporativo",
  PROJETOR = "Projetor",
  TECLADO = "Teclado",
  MOUSE = "Mouse",
  NOBREAK = "Nobreak",
  SOFTWARE_LICENCA = "Licença de Software",
  OUTRO = "Outro Equipamento",
}

export enum EquipmentStatus {
  EM_ESTOQUE = "Em Estoque",
  EM_USO = "Em Uso",
  EM_MANUTENCAO = "Em Manutenção",
  EMPRESTADO = "Emprestado",
  DESCARTADO = "Descartado",
  PEDIDO = "Pedido", 
  EXTRAVIADO = "Extraviado",
}

export interface EquipmentItem {
  id: string; // UUID
  name: string; 
  type: EquipmentType;
  serial_number?: string | null;
  patrimony_number?: string | null; 
  status: EquipmentStatus;
  location?: string | null; 
  assigned_to_user_name?: string | null; 
  supplier?: string | null;
  purchase_date?: Date | string | null;
  warranty_end_date?: Date | string | null;
  purchase_value?: number | null;
  notes?: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

// --- Contracts Module Types ---
export interface Contract {
  id: string; // UUID
  companyName: string;
  contractNumber: string;
  productOrServiceName: string;
  contractValue: number;
  startDate: Date | string;
  renewalOrExpiryDate: Date | string;
  endDate?: Date | string | null;
  description?: string | null;
  expiryNotificationDays: number; 
  created_at: Date | string;
  updated_at: Date | string;
}

// --- User Profile Types ---
// From Supabase `profiles` table
export interface UserProfile {
    id: string; // Corresponds to auth.users.id
    full_name: string | null;
    role: 'Administrador' | 'Supervisor' | 'Técnico'; // As per user_role_enum
    department: string | null;
    updated_at: Date | string;
    created_at?: Date | string; // Added created_at
}

// AppFeedback Interface
export interface AppFeedback {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

// Moved from App.tsx to be available for NavigationItemConfig
export type ViewMode = 
  'home' | 'list' | 'form' | 'detail' | 'dashboard' | 'reports' | 
  'tasks' | 'taskForm' |
  'inventoryDashboard' | 'inventoryStockList' | 'inventoryDeployedList' | 
  'inventoryItemForm' |
  'contractsList' | 'contractForm' |
  'help' | 'profile'; // Added 'profile'


// For dynamic navigation
export interface NavigationItemConfig {
  viewMode: ViewMode;
  label: string;
  icon: React.FC<{ className?: string }>;
  colorClass?: string; // Optional: Tailwind color class for homepage buttons
}