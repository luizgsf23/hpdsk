
import React, { useState, useRef, useEffect } from 'react';
import { Chat, GenerateContentResponse, Content } from "@google/genai";
import { LifebuoyIcon, BookOpenIcon, SparklesIcon, ChevronDownIcon, PaperAirplaneIcon, UserCircleIcon, ChatBubbleLeftEllipsisIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';
import { createChat as createAiChat, generateStream as generateAiStream, isAiAvailable, geminiInitializationError } from '../services/geminiService';
import { HELP_APP_SYSTEM_INSTRUCTION } from '../constants';
import { parseBoldMarkdown } from '../utils/textUtils';

interface FAQItem {
  question: string;
  answer: string;
}

interface TutorialItem {
  title: string;
  steps: string[];
}

interface HelpMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const faqs: FAQItem[] = [
  { question: "Como crio um novo ticket de suporte?", answer: "Vá para a seção 'Tickets' na barra lateral e clique no botão 'Novo Ticket'. Preencha o formulário com os detalhes do seu problema e envie." },
  { question: "Onde posso ver o status dos meus tickets?", answer: "Na seção 'Tickets', você verá uma lista de todos os seus tickets com seus respectivos status (Aberto, Aguardando IA, Resolvido, etc.)." },
  { question: "Como interajo com o assistente de IA em um ticket?", answer: "Após abrir um ticket, um chat com a IA será iniciado. Você pode digitar suas mensagens na caixa de texto e enviar para continuar a conversa e obter ajuda." },
  { question: "Posso reabrir um ticket resolvido?", answer: "Atualmente, a funcionalidade de reabrir tickets não está implementada. Se o problema persistir ou um novo relacionado surgir, por favor, crie um novo ticket." },
  { question: "Como gero um relatório de tickets?", answer: "Acesse a seção 'Relatórios', selecione o período desejado e clique em 'Gerar Relatório'. Você poderá ver estatísticas e insights gerados pela IA." },
];

const tutorials: TutorialItem[] = [
  { title: "Abrindo seu Primeiro Ticket", steps: ["1. No menu lateral, clique em 'Tickets'.", "2. Na tela de listagem de tickets, clique no botão '+ Novo Ticket'.", "3. Preencha seu nome e setor.", "4. Selecione a categoria e urgência do problema.", "5. Descreva detalhadamente o problema no campo de descrição.", "6. Clique em 'Enviar Ticket'. A IA Helpy iniciará o atendimento."] },
  { title: "Interagindo com o Assistente IA", steps: ["1. Após criar um ticket, ou ao selecionar um ticket existente, a conversa com a IA será exibida.", "2. Leia a mensagem da IA.", "3. Digite sua resposta ou mais detalhes na caixa de texto na parte inferior do chat.", "4. Clique no ícone de avião de papel ou pressione Enter para enviar sua mensagem.", "5. Aguarde a resposta da IA. O status do ticket será atualizado conforme a interação."] },
  { title: "Entendendo o Dashboard", steps: ["1. Clique em 'Dashboard' no menu lateral.", "2. Visualize os cartões de estatísticas rápidas sobre tickets e tarefas.", "3. Analise os gráficos de barras para entender a distribuição de tickets por status, urgência e categoria.", "4. O dashboard oferece uma visão geral do estado atual do seu help desk."] },
];

const HelpPage: React.FC = () => {
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [helpChatMessages, setHelpChatMessages] = useState<HelpMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isHelpAiResponding, setIsHelpAiResponding] = useState(false);
  const localChatRef = useRef<Chat | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [helpChatMessages]);

  const handleSendMessageToHelpAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const messageText = userInput.trim();
    if (!messageText) return;

    if (!isAiAvailable()) {
        const errorMsg: HelpMessage = { id: Date.now().toString(), sender: 'ai', text: `Assistente IA indisponível: ${geminiInitializationError || "Erro desconhecido."}`, timestamp: new Date() };
        setHelpChatMessages(prev => [...prev, errorMsg]);
        return;
    }

    const newUserMessage: HelpMessage = { id: Date.now().toString(), sender: 'user', text: messageText, timestamp: new Date() };
    setHelpChatMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsHelpAiResponding(true);

    if (!localChatRef.current) {
        const history: Content[] = helpChatMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{text: msg.text}]
        }));
        localChatRef.current = createAiChat(HELP_APP_SYSTEM_INSTRUCTION, history);
    }
    
    if (!localChatRef.current) {
        const errorMsg: HelpMessage = { id: (Date.now()+1).toString(), sender: 'ai', text: "Erro ao iniciar chat com assistente IA.", timestamp: new Date() };
        setHelpChatMessages(prev => [...prev, errorMsg]);
        setIsHelpAiResponding(false);
        return;
    }
    
    const aiPlaceholderMessageId = (Date.now() + 1).toString();
    const aiPlaceholderMessage: HelpMessage = { id: aiPlaceholderMessageId, sender: 'ai', text: '', timestamp: new Date(), isStreaming: true };
    setHelpChatMessages(prev => [...prev, aiPlaceholderMessage]);

    try {
        const stream = await generateAiStream(localChatRef.current, messageText);
        if (!stream) {
            throw new Error("Falha ao obter stream do assistente IA.");
        }

        let fullAiText = '';
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullAiText += chunkText;
                setHelpChatMessages(prev => prev.map(msg => 
                    msg.id === aiPlaceholderMessageId ? {...msg, text: fullAiText, isStreaming: true } : msg
                ));
            }
        }
        setHelpChatMessages(prev => prev.map(msg => 
            msg.id === aiPlaceholderMessageId ? {...msg, text: fullAiText, isStreaming: false } : msg
        ));

    } catch (error) {
        const errorText = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        setHelpChatMessages(prev => prev.map(msg => 
            msg.id === aiPlaceholderMessageId ? {...msg, text: `Erro: ${errorText}`, isStreaming: false } : msg
        ));
    } finally {
        setIsHelpAiResponding(false);
    }
  };


  return (
    <div className="p-4 sm:p-6 bg-gray-900 text-gray-100 rounded-lg shadow-xl h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
      <div className="flex items-center mb-6 pb-4 border-b border-gray-700">
        <LifebuoyIcon className="w-8 h-8 mr-3 text-purple-400" />
        <h1 className="text-2xl sm:text-3xl font-semibold text-purple-400">Central de Ajuda HPDSK</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* FAQ Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
            <ChatBubbleLeftEllipsisIcon className="w-6 h-6 mr-2"/>
            Perguntas Frequentes (FAQ)
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-700 rounded-md">
                <button
                  onClick={() => toggleAccordion(`faq-${index}`)}
                  className="flex justify-between items-center w-full p-3 text-left text-gray-200 hover:bg-gray-700/50 transition-colors"
                  aria-expanded={activeAccordion === `faq-${index}`}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span>{faq.question}</span>
                  <ChevronDownIcon className={`w-5 h-5 transform transition-transform ${activeAccordion === `faq-${index}` ? 'rotate-180' : ''}`} />
                </button>
                {activeAccordion === `faq-${index}` && (
                  <div id={`faq-answer-${index}`} className="p-3 border-t border-gray-700 text-gray-300 text-sm bg-gray-700/30">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tutorials Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
            <BookOpenIcon className="w-6 h-6 mr-2"/>
            Tutoriais Passo a Passo
          </h2>
          <div className="space-y-3">
            {tutorials.map((tutorial, index) => (
              <div key={index} className="border border-gray-700 rounded-md">
                <button
                  onClick={() => toggleAccordion(`tutorial-${index}`)}
                  className="flex justify-between items-center w-full p-3 text-left text-gray-200 hover:bg-gray-700/50 transition-colors"
                  aria-expanded={activeAccordion === `tutorial-${index}`}
                  aria-controls={`tutorial-steps-${index}`}
                >
                  <span>{tutorial.title}</span>
                  <ChevronDownIcon className={`w-5 h-5 transform transition-transform ${activeAccordion === `tutorial-${index}` ? 'rotate-180' : ''}`} />
                </button>
                {activeAccordion === `tutorial-${index}` && (
                  <div id={`tutorial-steps-${index}`} className="p-3 border-t border-gray-700 text-gray-300 text-sm bg-gray-700/30">
                    <ul className="list-disc list-inside space-y-1">
                      {tutorial.steps.map((step, stepIndex) => <li key={stepIndex}>{step}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* AI Help Assistant Section */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2"/>
            Assistente de Ajuda IA
        </h2>
        <p className="text-sm text-gray-400 mb-4">
            Tem alguma dúvida sobre como usar o HPDSK? Pergunte ao nosso assistente!
            Ex: "Como adiciono um novo item ao inventário?" ou "Onde configuro as notificações de contrato?"
        </p>
        <div className="h-64 flex flex-col border border-gray-700 rounded-md">
            <div className="flex-grow overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700">
                {helpChatMessages.map(msg => (
                    <div key={msg.id} className={`flex items-start ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <SparklesIcon className="w-6 h-6 text-purple-400 mr-2 flex-shrink-0 mt-0.5" />}
                        <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-100 rounded-bl-none'}`}>
                            {parseBoldMarkdown(msg.text)}
                            {msg.isStreaming && <span className="animate-pulse">...</span>}
                            <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-purple-200 text-right' : 'text-gray-400'}`}>
                                {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                        {msg.sender === 'user' && <UserCircleIcon className="w-6 h-6 text-gray-400 ml-2 flex-shrink-0 mt-0.5" />}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessageToHelpAI} className="p-3 border-t border-gray-700 flex items-center">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={isHelpAiResponding ? "Aguarde..." : "Pergunte sobre o HPDSK..."}
                    className="flex-grow p-2.5 bg-gray-700 border border-gray-600 rounded-l-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400 disabled:opacity-70"
                    disabled={isHelpAiResponding}
                    aria-label="Sua pergunta para o assistente de ajuda IA"
                />
                <button type="submit" disabled={isHelpAiResponding || !userInput.trim()}
                    className="bg-purple-600 text-white p-2.5 rounded-r-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Enviar pergunta"
                >
                    {isHelpAiResponding ? <LoadingSpinner size="w-5 h-5" /> : <PaperAirplaneIcon className="w-5 h-5" />}
                </button>
            </form>
        </div>
      </div>

      {/* Contact Us Section */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-purple-300 mb-4">Fale Conosco</h2>
        <p className="text-gray-300 mb-1">Precisa de ajuda adicional ou encontrou um problema técnico com o aplicativo HPDSK?</p>
        <p className="text-gray-400 text-sm mb-3">Entre em contato com nossa equipe de suporte:</p>
        <ul className="space-y-2 text-sm">
          <li><strong>E-mail:</strong> <a href="mailto:suporte.hpdsk@example.com" className="text-purple-400 hover:underline">suporte.hpdsk@example.com</a> (Email de placeholder)</li>
          <li><strong>Telefone:</strong> (XX) XXXX-XXXX (Telefone de placeholder)</li>
          <li><strong>Horário de Suporte:</strong> Segunda a Sexta, das 08:00 às 18:00 (horário de Brasília)</li>
        </ul>
      </div>
    </div>
  );
};

export default HelpPage;

