import React, { useState } from 'react';
import { DocData, DocType, UrgencyLevel, SecrecyLevel } from './types';
import { Editor } from './components/Editor';
import { PaperPreview } from './components/PaperPreview';
import { FileText } from 'lucide-react';

const INITIAL_DATA: DocData = {
  issuer: 'XX市人民政府办公厅',
  docType: DocType.NOTICE,
  docNumber: 'X府办发〔2024〕12号',
  secrecy: SecrecyLevel.NONE,
  urgency: UrgencyLevel.NONE,
  recipient: '各区人民政府，市政府各委、办、局',
  title: '关于进一步优化政务服务提升行政效能的通知',
  content: `各单位：\n\n为深入贯彻落实国家关于深化"放管服"改革的决策部署，持续优化营商环境，切实解决企业和群众办事难、办事慢、办事繁的问题，现就有关事项通知如下：\n\n一、全面推进政务服务标准化规范化便利化。各级各部门要严格按照国家标准，梳理权责清单，规范审批服务事项，实现同一事项无差别受理、同标准办理。\n\n二、大力推行"一网通办"。依托一体化政务服务平台，加快推进政务服务事项全流程网上办理，提高网上实办率，让数据多跑路，群众少跑腿。\n\n三、建立健全政务服务效能监督评价机制。加强对政务服务运行情况的监测分析，建立"好差评"制度，倒逼服务质量提升。\n\n特此通知。`,
  signer: 'XX市人民政府办公厅',
  date: new Date().toISOString().split('T')[0]
};

export default function App() {
  const [docData, setDocData] = useState<DocData>(INITIAL_DATA);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden">
      {/* Sidebar / Editor */}
      <div 
        className={`${isSidebarOpen ? 'w-full md:w-[450px]' : 'w-0'} transition-all duration-300 h-full relative z-20 flex-shrink-0 shadow-xl print:hidden`}
      >
        <Editor data={docData} onChange={setDocData} />
        
        {/* Toggle Button for Sidebar (Mobile friendly) */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-12 top-6 bg-slate-800 text-white p-2 rounded-r-md shadow-md hover:bg-slate-700 md:hidden"
        >
          <FileText size={20} />
        </button>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 h-full relative flex flex-col">
        {/* Top bar on desktop to toggle sidebar if needed, mainly for aesthetics */}
        <div className="h-12 bg-white border-b border-slate-200 flex items-center px-4 justify-between print:hidden">
           <div className="flex items-center gap-2 text-slate-600">
             <FileText className="text-red-600" />
             <span className="font-bold text-lg tracking-tight">RedHeader Architect</span>
             <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-2">GB/T 9704-2012</span>
           </div>
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
             className="text-sm font-medium text-slate-500 hover:text-slate-800 hidden md:block"
           >
             {isSidebarOpen ? 'Hide Editor' : 'Show Editor'}
           </button>
        </div>

        <div className="flex-1 overflow-hidden relative bg-slate-200/50">
           <PaperPreview data={docData} />
        </div>
      </div>
      
      {/* Mobile Sidebar Toggle Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
