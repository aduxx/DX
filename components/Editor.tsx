import React, { useState } from 'react';
import { DocData, DocType, UrgencyLevel, SecrecyLevel } from '../types';
import { Wand2, Loader2, FileDown, Printer } from 'lucide-react';
import { generateDocContent, polishContent } from '../services/geminiService';

interface EditorProps {
  data: DocData;
  onChange: (data: DocData) => void;
}

export const Editor: React.FC<EditorProps> = ({ data, onChange }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleChange = (field: keyof DocData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const result = await generateDocContent(
        aiPrompt,
        data.docType,
        data.issuer || '本机关',
        data.recipient || '下级机关'
      );
      onChange({
        ...data,
        title: result.title || data.title,
        content: result.content || data.content,
        docNumber: result.docNumber || data.docNumber
      });
    } catch (e) {
      alert("AI Generation failed. Please check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePolish = async () => {
    if (!data.content) return;
    setIsPolishing(true);
    try {
      const refined = await polishContent(data.content);
      handleChange('content', refined);
    } catch (e) {
       alert("AI Polishing failed.");
    } finally {
      setIsPolishing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    // Construct HTML for Word
    // Note: Word handles HTML tables best for layout.
    
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${data.title}</title>
        <style>
          @page {
            size: 210mm 297mm;
            margin: 37mm 26mm 35mm 28mm; /* T R B L */
            mso-page-orientation: portrait;
          }
          body {
            font-family: "FangSong_GB2312", "FangSong", serif;
            font-size: 16pt;
            line-height: 28pt;
          }
          .header-box { width: 100%; margin-bottom: 20pt; }
          .red-header {
            font-family: "SimSun", serif;
            color: red;
            font-size: 26pt; /* Approx 37px */
            font-weight: bold;
            text-align: center;
            letter-spacing: 5px;
          }
          .red-line {
            border-bottom: 2px solid red;
            text-align: center;
            line-height: 10pt;
            margin-top: 10pt;
            margin-bottom: 30pt;
          }
          .doc-number {
            background: white;
            font-family: "FangSong", serif;
            font-size: 12pt;
            padding: 0 10px;
            position: relative; 
            top: 5px; /* Visual tweak */
          }
          .doc-title {
            font-family: "SimSun", serif;
            font-size: 22pt;
            font-weight: bold;
            text-align: center;
            margin: 30pt 0;
            line-height: 1.5;
          }
          .recipient {
            font-family: "FangSong", serif;
            font-size: 16pt;
            text-align: left;
            margin-bottom: 10pt;
          }
          .content {
            font-family: "FangSong", serif;
            font-size: 16pt;
            line-height: 28pt;
            text-align: justify;
            text-indent: 2em;
          }
          .signer-box {
            margin-top: 60pt;
            text-align: right;
            font-family: "FangSong", serif;
            font-size: 16pt;
            line-height: 28pt;
          }
          .meta-info {
            font-family: "SimHei", sans-serif;
            font-size: 10pt;
            margin-bottom: 5pt;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="meta-info">
             ${data.secrecy ? `<span>秘密等级：★${data.secrecy}</span>` : ''}
             &nbsp;&nbsp;&nbsp;&nbsp;
             ${data.urgency ? `<span>紧急程度：${data.urgency}</span>` : ''}
          </div>
          <div class="red-header">
             ${data.issuer} <span style="color: black; font-weight: normal; font-size: 20pt; letter-spacing: 0;">文件</span>
          </div>
          <div class="red-line">
            <span class="doc-number">${data.docNumber}</span>
          </div>
        </div>
        
        <div class="doc-title">${data.title}</div>
        
        <div class="recipient">${data.recipient}：</div>
        
        <div class="content">
          ${data.content.split('\n').map(p => `<p>${p}</p>`).join('')}
        </div>
        
        <div class="signer-box">
          <p>${data.signer || data.issuer}</p>
          <p>${new Date(data.date).toLocaleDateString('zh-CN', {year: 'numeric', month: 'long', day: 'numeric'})}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title || 'document'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="font-bold text-slate-700 text-lg">Document Parameters</h2>
        <div className="flex gap-2">
             <button 
                onClick={handleDownloadWord}
                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-md transition-colors"
                title="Download as Word"
             >
               <FileDown size={20} />
             </button>
             <button 
                onClick={handlePrint}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
                title="Print / Save as PDF"
             >
               <Printer size={20} />
             </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* AI Section */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2 text-blue-800 font-medium">
            <Wand2 size={18} />
            <span>AI Drafter (Gemini)</span>
          </div>
          <textarea
            className="w-full p-3 text-sm border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none mb-3 resize-none bg-white"
            rows={3}
            placeholder="Describe what you want to write (e.g., A notice about typhoon preparation)..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !aiPrompt}
            className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : 'Generate Draft'}
          </button>
        </div>

        {/* Metadata Fields */}
        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Type (文种)</label>
            <select 
              value={data.docType} 
              onChange={(e) => handleChange('docType', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
            >
              {Object.values(DocType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Doc Number (发文字号)</label>
            <input 
              type="text" 
              value={data.docNumber}
              onChange={(e) => handleChange('docNumber', e.target.value)}
              placeholder="X发〔2024〕1号"
              className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Issuer (发文机关)</label>
            <input 
              type="text" 
              value={data.issuer}
              onChange={(e) => handleChange('issuer', e.target.value)}
              placeholder="XX市人民政府"
              className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Recipient (主送机关)</label>
            <input 
              type="text" 
              value={data.recipient}
              onChange={(e) => handleChange('recipient', e.target.value)}
              placeholder="各区县政府"
              className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
        </div>

         <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Secrecy (密级)</label>
            <select 
              value={data.secrecy} 
              onChange={(e) => handleChange('secrecy', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value="">None</option>
              {Object.values(SecrecyLevel).filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Urgency (紧急程度)</label>
            <select 
              value={data.urgency} 
              onChange={(e) => handleChange('urgency', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value="">None</option>
              {Object.values(UrgencyLevel).filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Title (标题)</label>
          <input 
            type="text" 
            value={data.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full p-2 border border-slate-300 rounded text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none"
          />
        </div>

        <div className="flex-1 flex flex-col min-h-[300px]">
           <div className="flex justify-between items-end mb-1">
             <label className="block text-xs font-semibold text-slate-500">Body Content (正文)</label>
             <button 
                onClick={handlePolish}
                disabled={isPolishing || !data.content}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
             >
                <Wand2 size={12} /> Polish Tone
             </button>
           </div>
           <textarea 
             value={data.content}
             onChange={(e) => handleChange('content', e.target.value)}
             className="w-full flex-1 p-3 border border-slate-300 rounded text-sm leading-relaxed focus:ring-2 focus:ring-red-500 outline-none resize-none font-fangsong"
           />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Signer (落款)</label>
            <input 
              type="text" 
              value={data.signer}
              onChange={(e) => handleChange('signer', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Date (日期)</label>
            <input 
              type="date" 
              value={data.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
        </div>

      </div>
    </div>
  );
};