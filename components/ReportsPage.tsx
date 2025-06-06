
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportData, ReportTimeFrame, Ticket, IssueCategory, UrgencyLevel, TicketStatus } from '../types';
import LoadingSpinner from './LoadingSpinner';
import FeedbackAlert from './FeedbackAlert'; 
import type { AppFeedback } from '../types'; 
import { 
    CalendarDaysIcon, DocumentTextIcon, SparklesIcon, CheckCircleIcon, ClockIcon, XMarkIcon, 
    BoltIcon, ExclamationTriangleIcon, Bars3BottomLeftIcon, EllipsisHorizontalIcon, 
    InformationCircleIcon, UserCircleIcon, TicketIcon, PrinterIcon
} from './icons';
import StatCard from './StatCard'; 
import { parseBoldMarkdown } from '../utils/textUtils';

interface ReportsPageProps {
  allTickets: Ticket[]; 
  reportData: ReportData | null;
  isReportLoading: boolean;
  onGenerateReport: (timeFrame: ReportTimeFrame) => Promise<AppFeedback>; 
}

interface TimeFrameButtonProps {
  timeFrame: ReportTimeFrame;
  label: string;
  onClick: (tf: ReportTimeFrame) => void;
  isSelected: boolean;
  disabled: boolean;
}

const TimeFrameButtonInner: React.FC<TimeFrameButtonProps> = ({ timeFrame, label, onClick, isSelected, disabled }) => (
  <button
    onClick={() => onClick(timeFrame)}
    disabled={disabled}
    className={`
      px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-150 ease-in-out
      border w-full
      ${isSelected 
        ? 'bg-purple-600 text-white border-purple-500 shadow-md' 
        : `bg-gray-700 text-gray-200 border-gray-600 
           hover:bg-gray-600 hover:border-gray-500 
           disabled:bg-gray-800/50 disabled:text-gray-500 
           disabled:border-gray-700/50 disabled:cursor-not-allowed`
      }
    `}
    aria-pressed={isSelected}
  >
    {label}
  </button>
);
const TimeFrameButton = React.memo(TimeFrameButtonInner);

const ReportsPage: React.FC<ReportsPageProps> = ({ reportData, isReportLoading, onGenerateReport }) => {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<ReportTimeFrame | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [feedback, setFeedback] = useState<AppFeedback | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (feedback) {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 7000); 
    }
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, [feedback]);

  const handleGenerateClick = async () => {
    if (selectedTimeFrame && !isReportLoading) {
      setFeedback(null); 
      const result = await onGenerateReport(selectedTimeFrame);
      setFeedback(result); 
    }
  };

  const handlePrintReport = async () => {
    const reportContentElement = document.getElementById('report-content');
    if (!reportContentElement || !reportData) {
      setFeedback({type: 'error', message: "Conteúdo do relatório não encontrado ou dados ausentes para gerar PDF."});
      return;
    }

    setIsGeneratingPdf(true);
    setFeedback(null);
    try {
      const A4_WIDTH_MM = 210;
      const PDF_MARGIN_MM = 15;
      const BASE_DPI_FOR_LAYOUT = 150;

      const layoutWidthMm = A4_WIDTH_MM - (2 * PDF_MARGIN_MM);
      const layoutWidthPx = Math.floor((layoutWidthMm / 25.4) * BASE_DPI_FOR_LAYOUT);
      
      const wrapper = document.getElementById('report-content-wrapper');
      const originalWrapperBg = wrapper ? wrapper.style.backgroundColor : '';
      if (wrapper) wrapper.style.backgroundColor = 'white';


      const canvas = await html2canvas(reportContentElement, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff',
        windowWidth: layoutWidthPx, width: reportContentElement.scrollWidth, height: reportContentElement.scrollHeight, scrollY: -window.scrollY,
      });
      
      if (wrapper) wrapper.style.backgroundColor = originalWrapperBg; 

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pdfPageWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const margin = PDF_MARGIN_MM; 
      const availableWidth = pdfPageWidth - 2 * margin;
      const availableHeight = pdfPageHeight - 2 * margin;
      
      let imgWidth = canvas.width;
      let imgHeight = canvas.height;
      const aspectRatio = imgWidth / imgHeight;

      let pdfImgWidth = availableWidth;
      let pdfImgHeight = pdfImgWidth / aspectRatio;

      if (pdfImgHeight > availableHeight) {
          pdfImgHeight = availableHeight;
          pdfImgWidth = pdfImgHeight * aspectRatio;
      }
      
      let currentY = margin;
      let remainingImgHeight = imgHeight;
      const sourceImgWidth = imgWidth; 
      
      const pageHeightInCanvasPx = (availableHeight / pdfImgHeight) * imgHeight;


      while (remainingImgHeight > 0) {
          const sliceHeight = Math.min(pageHeightInCanvasPx, remainingImgHeight);
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = sourceImgWidth;
          tempCanvas.height = sliceHeight;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(canvas, 0, imgHeight - remainingImgHeight, sourceImgWidth, sliceHeight, 0, 0, sourceImgWidth, sliceHeight);
              const pageImgData = tempCanvas.toDataURL('image/png');
              
              let pagePdfImgWidth = availableWidth;
              let pagePdfImgHeight = pagePdfImgWidth / (sourceImgWidth / sliceHeight);

              if (pagePdfImgHeight > availableHeight) {
                  pagePdfImgHeight = availableHeight;
                  pagePdfImgWidth = pagePdfImgHeight * (sourceImgWidth / sliceHeight);
              }
              
              if (currentY !== margin) { 
                  pdf.addPage();
              }
              pdf.addImage(pageImgData, 'PNG', margin, margin, pagePdfImgWidth, pagePdfImgHeight);
          }
          remainingImgHeight -= sliceHeight;
          currentY = margin; 
      }


      pdf.save(`relatorio_HPDSK_${reportData.periodDescription.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      setFeedback({type: 'success', message: "PDF do relatório gerado com sucesso!"});
    } catch (error) {
      console.error("Erro ao gerar PDF com html2canvas e jsPDF:", error);
      setFeedback({type: 'error', message: "Ocorreu um erro ao gerar o PDF. Verifique o console."});
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  const getUrgencyIcon = (urgency: UrgencyLevel, className: string = "w-4 h-4 inline mr-1.5") => {
    switch (urgency) {
        case UrgencyLevel.CRITICAL: return <BoltIcon className={className + " text-red-500"} />;
        case UrgencyLevel.HIGH: return <ExclamationTriangleIcon className={className + " text-orange-500"} />;
        case UrgencyLevel.MEDIUM: return <Bars3BottomLeftIcon className={className + " text-yellow-500"} />;
        case UrgencyLevel.LOW: return <EllipsisHorizontalIcon className={className + " text-purple-400"} />; 
        default: return null;
    }
  };

  const getCategoryColor = (category: IssueCategory): string => {
    switch (category) {
        case IssueCategory.HARDWARE: return "bg-pink-500";
        case IssueCategory.SOFTWARE: return "bg-purple-500";
        case IssueCategory.NETWORK: return "bg-indigo-500";
        case IssueCategory.ACCOUNT: return "bg-purple-700";
        case IssueCategory.OTHER: return "bg-teal-500";
        default: return "bg-gray-500";
    }
  };
   const getStatusIcon = (status: TicketStatus, className: string = "w-4 h-4 inline mr-1.5") => {
    switch (status) {
        case TicketStatus.OPEN: return <ClockIcon className={className + " text-purple-400"} />; 
        case TicketStatus.PENDING_AI: return <SparklesIcon className={className + " text-purple-500"} />; 
        case TicketStatus.PENDING_USER: return <UserCircleIcon className={className + " text-yellow-400"} />; 
        case TicketStatus.RESOLVED: return <CheckCircleIcon className={className + " text-indigo-400"} />; 
        case TicketStatus.CANCELLED: return <XMarkIcon className={className + " text-gray-400"} />;
        default: return null;
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-gray-900 rounded-lg shadow-xl h-full flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-2 pb-3 sm:pb-4 border-b border-gray-700 print:hidden">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-purple-400 flex items-center mb-2 sm:mb-0">
          <DocumentTextIcon className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-purple-400" />
          Central de Relatórios
        </h2>
      </div>

      {feedback && (
          <FeedbackAlert 
            type={feedback.type} 
            message={feedback.message} 
            onDismiss={() => setFeedback(null)}
            className="mb-4 print:hidden"
          />
      )}

      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-800 rounded-lg print:hidden">
        <h3 className="text-md sm:text-lg font-medium text-gray-200 mb-2 sm:mb-3 flex items-center">
            <CalendarDaysIcon className="w-5 h-5 mr-2 text-gray-400"/>
            Selecione o Período do Relatório:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          {Object.values(ReportTimeFrame).map(tf => (
            <TimeFrameButton
              key={tf} timeFrame={tf} label={tf}
              onClick={setSelectedTimeFrame} isSelected={selectedTimeFrame === tf}
              disabled={isReportLoading || isGeneratingPdf}
            />
          ))}
        </div>
        <button
          onClick={handleGenerateClick}
          disabled={!selectedTimeFrame || isReportLoading || isGeneratingPdf}
          className="mt-3 sm:mt-4 w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {isReportLoading ? <LoadingSpinner size="w-5 h-5" /> : "Gerar Relatório"}
        </button>
      </div>

      {isReportLoading && (
        <div className="flex-grow flex flex-col items-center justify-center text-gray-200 p-6 sm:p-10 print:hidden">
          <LoadingSpinner size="w-10 h-10 sm:w-12 sm:h-12" />
          <p className="mt-3 sm:mt-4 text-md sm:text-lg">Gerando relatório, por favor aguarde...</p>
          <p className="text-xs sm:text-sm text-gray-400">Isso pode levar alguns instantes.</p>
        </div>
      )}

      {!isReportLoading && !reportData && !feedback && ( 
        <div className="flex-grow flex flex-col items-center justify-center text-gray-400 bg-gray-800/50 rounded-lg p-6 sm:p-10 text-center print:hidden">
          <InformationCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mb-4 sm:mb-6" />
          <p className="text-lg sm:text-xl text-gray-200 mb-2">Nenhum relatório gerado.</p>
          <p className="text-xs sm:text-sm">Selecione um período e clique em "Gerar Relatório".</p>
        </div>
      )}

      {!isReportLoading && reportData && (
        <div className="space-y-6 sm:space-y-8" id="report-content-wrapper">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-700 pb-2 mb-4 sm:mb-0">
            <h3 className="text-xl sm:text-2xl font-semibold text-purple-400 mb-2 sm:mb-0">
              Relatório: {reportData.periodDescription}
            </h3>
            <button
              onClick={handlePrintReport} disabled={isGeneratingPdf}
              className="print:hidden ml-0 sm:ml-4 w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center justify-center text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Gerar PDF do relatório"
            >
              {isGeneratingPdf ? <LoadingSpinner size="w-4 h-4 sm:w-5 sm:h-5" /> : <PrinterIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />}
              {isGeneratingPdf ? "Gerando PDF..." : "Baixar PDF"}
            </button>
          </div>
          
          <div id="report-content" className="text-gray-100 bg-gray-800 p-3 sm:p-4 rounded-md">
            <section>
              <h4 className="text-lg sm:text-xl font-medium text-gray-100 mb-3 sm:mb-4">Visão Geral</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <StatCard title="Total de Tickets Criados" value={reportData.totalTickets} icon={<TicketIcon className="w-6 h-6"/>} iconColorClass="text-purple-400" />
                <StatCard title="Tickets Resolvidos" value={reportData.resolvedTickets} icon={<CheckCircleIcon className="w-6 h-6"/>} iconColorClass="text-indigo-400" />
                <StatCard title="Tickets Abertos" value={reportData.openTickets} icon={<ClockIcon className="w-6 h-6"/>} iconColorClass="text-purple-500" />
                <StatCard title="Tickets Cancelados" value={reportData.cancelledTickets} icon={<XMarkIcon className="w-6 h-6"/>} iconColorClass="text-gray-400" />
                <StatCard title="Aguardando IA" value={reportData.pendingAiTickets} icon={<SparklesIcon className="w-6 h-6"/>} iconColorClass="text-purple-600" />
                <StatCard title="Aguardando Usuário" value={reportData.pendingUserTickets} icon={<UserCircleIcon className="w-6 h-6"/>} iconColorClass="text-yellow-400" />
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
                  <div className="bg-gray-700 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-md sm:text-lg font-medium text-gray-100 mb-2 sm:mb-3">Por Status</h4>
                      {reportData.ticketsByStatus.length > 0 ? (
                          <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
                          {reportData.ticketsByStatus.map(item => (
                              <li key={item.status} className="flex justify-between items-center text-gray-300">
                                  <span className="flex items-center">{getStatusIcon(item.status)} {item.status}</span>
                                  <span className="font-semibold text-gray-100">{item.count}</span>
                              </li>
                          ))}
                          </ul>
                      ) : <p className="text-xs sm:text-sm text-gray-400">N/A</p>}
                  </div>
                  <div className="bg-gray-700 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-md sm:text-lg font-medium text-gray-100 mb-2 sm:mb-3">Por Categoria</h4>
                      {reportData.ticketsByCategory.length > 0 ? (
                          <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
                          {reportData.ticketsByCategory.map(item => (
                              <li key={item.category} className="flex justify-between items-center text-gray-300">
                                <span><span className={`inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full mr-1.5 sm:mr-2 ${getCategoryColor(item.category)}`}></span>{item.category}</span>
                                  <span className="font-semibold text-gray-100">{item.count}</span>
                              </li>
                          ))}
                          </ul>
                      ) : <p className="text-xs sm:text-sm text-gray-400">N/A</p>}
                  </div>
                  <div className="bg-gray-700 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-md sm:text-lg font-medium text-gray-100 mb-2 sm:mb-3">Por Urgência</h4>
                      {reportData.ticketsByUrgency.length > 0 ? (
                          <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
                          {reportData.ticketsByUrgency.map(item => (
                              <li key={item.urgency} className="flex justify-between items-center text-gray-300">
                                <span className="flex items-center">{getUrgencyIcon(item.urgency)} {item.urgency}</span>
                                <span className="font-semibold text-gray-100">{item.count}</span>
                              </li>
                          ))}
                          </ul>
                      ) : <p className="text-xs sm:text-sm text-gray-400">N/A</p>}
                  </div>
            </section>

            {reportData.aiInsights && (
              <section className="mt-6 sm:mt-8 ai-insights-section">
                <h4 className="text-lg sm:text-xl font-medium text-gray-100 mb-2 sm:mb-3 flex items-center">
                  <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
                  Insights da IA
                </h4>
                <div className="bg-gray-700 p-3 sm:p-4 md:p-6 rounded-lg shadow-inner">
                  <div className="text-xs sm:text-sm text-gray-200 whitespace-pre-wrap font-mono leading-relaxed ai-insights-content">
                    {parseBoldMarkdown(reportData.aiInsights)}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
