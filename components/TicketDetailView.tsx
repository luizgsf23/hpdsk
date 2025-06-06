
import React, { useState, useEffect, useRef } from 'react';
import { Ticket, Message as MessageType, UrgencyLevel, TicketStatus } from '../types';
import ChatMessage from './ChatMessage';
import LoadingSpinner from './LoadingSpinner';
import FeedbackAlert from './FeedbackAlert'; 
import type { AppFeedback } from '../types'; 
import { PaperAirplaneIcon, ArrowLeftIcon, BoltIcon, ExclamationTriangleIcon, Bars3BottomLeftIcon, EllipsisHorizontalIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon, ArrowPathIcon, LifebuoyIcon } from './icons';

interface TicketDetailViewProps {
  ticket: Ticket;
  onSendMessage: (ticketId: string, messageText: string) => Promise<AppFeedback>;
  onBackToList: () => void;
  isAiResponding: boolean;
  onChangeStatus: (ticketId: string, newStatus: TicketStatus) => Promise<AppFeedback>;
  initialFeedback?: AppFeedback | null; 
  clearInitialFeedback?: () => void; 
}

const UrgencyDisplay: React.FC<{ urgency: UrgencyLevel }> = ({ urgency }) => {
  let icon, color, text;
  switch (urgency) {
    case UrgencyLevel.CRITICAL: icon = <BoltIcon className="w-5 h-5" />; color="text-red-500"; text="Crítica"; break; 
    case UrgencyLevel.HIGH: icon = <ExclamationTriangleIcon className="w-5 h-5" />; color="text-orange-500"; text="Alta"; break; 
    case UrgencyLevel.MEDIUM: icon = <Bars3BottomLeftIcon className="w-5 h-5" />; color="text-yellow-500"; text="Média"; break; 
    case UrgencyLevel.LOW: icon = <EllipsisHorizontalIcon className="w-5 h-5" />; color="text-purple-400"; text="Baixa"; break; 
    default: return null;
  }
  return <div className={`flex items-center space-x-1 ${color}`}>{icon}<span>{text}</span></div>;
};

const TicketDetailView: React.FC<TicketDetailViewProps> = ({ 
    ticket, onSendMessage, onBackToList, isAiResponding, onChangeStatus,
    initialFeedback, clearInitialFeedback 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isConversationExpanded, setIsConversationExpanded] = useState(true);
  const [localFeedback, setLocalFeedback] = useState<AppFeedback | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialFeedback) {
      setLocalFeedback(initialFeedback);
      if (clearInitialFeedback) clearInitialFeedback();
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setLocalFeedback(null), 7000);
    }
  }, [initialFeedback, clearInitialFeedback]); 

  useEffect(() => {
    if (isConversationExpanded) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket.conversation, isConversationExpanded]);

  useEffect(() => {
    setLocalFeedback(null);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
  }, [ticket.id]);

  const handleShowFeedback = (feedback: AppFeedback) => {
    setLocalFeedback(feedback);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    if (feedback.type === 'success' || feedback.type === 'info') { 
      feedbackTimeoutRef.current = setTimeout(() => setLocalFeedback(null), 7000);
    }
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !isAiResponding) {
      const result = await onSendMessage(ticket.id, newMessage.trim());
      handleShowFeedback(result);
      if (result.type === 'success') {
        setNewMessage('');
      }
    }
  };

  const handleChangeStatusSubmit = async (newStatus: TicketStatus) => {
    if (ticket.status === newStatus) return;
    const result = await onChangeStatus(ticket.id, newStatus);
    handleShowFeedback(result);
  };
  
  const TICKET_DETAIL_TEXT_COLOR = 'text-gray-100';
  const TICKET_DETAIL_LABEL_COLOR = 'text-gray-400';

  const canChangeStatus = ticket.status !== TicketStatus.CANCELLED && ticket.status !== TicketStatus.RESOLVED && !isAiResponding;
  const showAiWaitMessage = isAiResponding && ticket.status !== TicketStatus.CANCELLED && ticket.status !== TicketStatus.RESOLVED;

  const lastMessage = ticket.conversation[ticket.conversation.length - 1];
  const isLastAiMessageError = lastMessage?.sender === 'ai' &&
                                !lastMessage.isStreaming &&
                                (lastMessage.text?.toLowerCase().includes("erro") || lastMessage.text?.toLowerCase().includes("falha"));

  const handleRetryLastUserMessage = async () => {
    const lastUserMessage = ticket.conversation.filter(m => m.sender === 'user').pop();
    if (isAiResponding) return;

    if (lastUserMessage && lastUserMessage.text) {
        const result = await onSendMessage(ticket.id, lastUserMessage.text);
        handleShowFeedback(result); 
    } else {
        handleShowFeedback({type: 'warning', message: "Nenhuma mensagem anterior do usuário encontrada para reenviar."});
    }
  };


  return (
    <div className="p-2 sm:p-6 bg-gray-900 rounded-lg shadow-xl h-full flex flex-col overflow-hidden"> 
      <div className="flex items-center justify-between pb-4 border-b border-gray-700 mb-1"> 
        <button 
          onClick={onBackToList} 
          className="p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
          aria-label="Voltar para lista"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-purple-400 truncate max-w-xs sm:max-w-md md:max-w-lg" title={`${ticket.category}: ${ticket.description}`}>{ticket.category}: {ticket.description.substring(0,50)}{ticket.description.length > 50 ? '...' : ''}</h2>
          <p className="text-xs text-gray-500">ID: {ticket.id}</p>
        </div>
        <div className="w-10 h-10"> {/* Spacer */} </div>
      </div>
      
      {localFeedback && (
        <FeedbackAlert 
            type={localFeedback.type} 
            message={localFeedback.message} 
            onDismiss={() => setLocalFeedback(null)}
            className="my-2 mx-0 sm:mx-0"
        />
      )}

      <div className="mb-4 p-4 bg-gray-800 rounded-md grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6 text-sm"> 
        <div>
          <span className={`font-semibold ${TICKET_DETAIL_LABEL_COLOR} block`}>Usuário:</span>
          <span className={TICKET_DETAIL_TEXT_COLOR}>{ticket.user_name}</span>
        </div>
        <div>
          <span className={`font-semibold ${TICKET_DETAIL_LABEL_COLOR} block`}>Setor:</span>
          <span className={TICKET_DETAIL_TEXT_COLOR}>{ticket.department || 'N/A'}</span>
        </div>
        <div>
          <span className={`font-semibold ${TICKET_DETAIL_LABEL_COLOR} block`}>Urgência:</span>
          <UrgencyDisplay urgency={ticket.urgency} />
        </div>
        
        <div className="col-span-2 sm:col-span-1">
          <span className={`font-semibold ${TICKET_DETAIL_LABEL_COLOR} block mb-1`}>Status Atual:</span>
           <span className={`text-white px-2 py-1 rounded-full text-xs font-medium ${
              ticket.status === TicketStatus.OPEN ? 'bg-purple-500' : 
              ticket.status === TicketStatus.PENDING_AI ? 'bg-purple-600' : 
              ticket.status === TicketStatus.PENDING_USER ? 'bg-yellow-600 text-yellow-100' : 
              ticket.status === TicketStatus.RESOLVED ? 'bg-indigo-500' :  
              ticket.status === TicketStatus.CANCELLED ? 'bg-gray-600' : 'bg-gray-500' 
            }`}>{ticket.status}</span>
        </div>

        <div className="col-span-2 sm:col-span-2">
          <label htmlFor="ticketStatus" className={`font-semibold ${TICKET_DETAIL_LABEL_COLOR} block mb-1`}>Alterar Status:</label>
            <div className="relative">
                <select
                    id="ticketStatus"
                    value={ticket.status}
                    onChange={(e) => handleChangeStatusSubmit(e.target.value as TicketStatus)}
                    disabled={!canChangeStatus}
                    className={`w-full max-w-xs p-2 pr-8 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 ${TICKET_DETAIL_TEXT_COLOR} appearance-none disabled:opacity-60 disabled:cursor-not-allowed`}
                    aria-label="Alterar status do ticket"
                >
                    {Object.values(TicketStatus).map(statusVal => (
                    <option key={statusVal} value={statusVal}>{statusVal}</option>
                    ))}
                </select>
                {canChangeStatus && 
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                }
            </div>
            {showAiWaitMessage && (
                <p className="text-xs text-gray-500 mt-1">Aguarde a IA para alterar o status.</p>
            )}
        </div>

        <div className="col-span-2 sm:col-span-3">
            <span className={`font-semibold ${TICKET_DETAIL_LABEL_COLOR} block`}>Descrição Completa:</span>
            <p className={`${TICKET_DETAIL_TEXT_COLOR} whitespace-pre-wrap`}>{ticket.description}</p>
        </div>
      </div>
      
      <div 
        className="flex justify-between items-center p-2 sm:p-3 bg-gray-800 rounded-t-md cursor-pointer hover:bg-gray-700 transition-colors mt-2" 
        onClick={() => setIsConversationExpanded(prev => !prev)}
        role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsConversationExpanded(prev => !prev)}
        aria-expanded={isConversationExpanded} aria-controls={`conversation-content-${ticket.id}`}
      >
        <h3 className="text-md font-semibold text-purple-300">Conversa com IA</h3> 
        <button className="text-gray-400 hover:text-purple-400"> 
          {isConversationExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </button>
      </div>

      {isConversationExpanded && (
        <div id={`conversation-content-${ticket.id}`} className="flex flex-col flex-grow min-h-0 bg-gray-800/70 rounded-b-md">  
          <div className="flex-grow overflow-y-auto p-1 sm:p-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700"> 
            {ticket.conversation.map(msg => ( <ChatMessage key={msg.id} message={msg} /> ))}
            {isAiResponding && ticket.conversation[ticket.conversation.length -1]?.sender === 'user' && (
              <div className="flex items-start mb-4">
                <SparklesIcon className={`w-8 h-8 text-purple-400 mr-3 flex-shrink-0 mt-1`} /> 
                <div className={`max-w-[75%] p-3 rounded-lg shadow bg-gray-700 ${TICKET_DETAIL_TEXT_COLOR} rounded-bl-none`}>
                  <LoadingSpinner size="w-5 h-5" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {((ticket.status !== TicketStatus.CANCELLED && ticket.status !== TicketStatus.RESOLVED)) && !isLastAiMessageError ? (
            <form onSubmit={handleSendMessageSubmit} className="mt-auto pt-3 sm:pt-4 border-t border-gray-700 p-2 sm:p-3 flex items-center"> 
              <input
                type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isAiResponding ? "Aguarde a resposta da IA..." : "Digite sua mensagem..."}
                className={`flex-grow p-3 bg-gray-700 border border-gray-600 rounded-l-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 ${TICKET_DETAIL_TEXT_COLOR} placeholder-gray-400 disabled:opacity-70`} 
              />
              <button type="submit" disabled={isAiResponding || !newMessage.trim()}
                className="bg-purple-600 text-white p-3 rounded-r-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center" 
                style={{minWidth: '50px'}}
              >
                {isAiResponding ? <LoadingSpinner size="w-5 h-5" /> : <PaperAirplaneIcon className="w-5 h-5" />}
              </button>
            </form>
          ) : isLastAiMessageError ? (
             <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-700 text-center p-3 space-y-3 bg-red-900/10 rounded-b-md">
                <div className="flex items-center justify-center text-red-400">
                    <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
                    <p className="font-semibold">A IA encontrou um problema.</p>
                </div>
                <p className="text-xs text-gray-300 italic">
                    A última resposta da IA (visível acima na conversa) indicou um erro.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-2">
                    <button
                    onClick={handleRetryLastUserMessage}
                    disabled={isAiResponding || !ticket.conversation.find(m => m.sender === 'user')}
                    className="w-full sm:w-auto px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Tentar Novamente
                    </button>
                    <button
                    onClick={() => {
                        const supportEmail = "suporte.hpdsk@example.com"; 
                        const supportPhone = "(XX) XXXX-XXXX"; 
                        alert(`Se o problema persistir, por favor, contate o suporte:\n\nEmail: ${supportEmail}\nTelefone: ${supportPhone}\n\nInclua o ID do Ticket: ${ticket.id} e uma descrição do problema.`);
                    }}
                    className="w-full sm:w-auto px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
                    >
                    <LifebuoyIcon className="w-4 h-4 mr-2" />
                    Contatar Suporte
                    </button>
                </div>
            </div>
          ) : (
            <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-700 text-center text-gray-400 p-2 sm:p-3"> 
                 {`Este ticket está ${ticket.status.toLowerCase()}. Não é possível enviar novas mensagens.`}
            </div>
          )}
        </div>
      )}
      {!isConversationExpanded && ((ticket.status === TicketStatus.CANCELLED || ticket.status === TicketStatus.RESOLVED)) && (
        <div className="mt-1 p-2 text-xs text-center text-gray-500 bg-gray-800/70 rounded-b-md"> 
            Ticket {ticket.status.toLowerCase()}.
        </div>
      )}
    </div>
  );
};

export default TicketDetailView;
