import React, { useMemo } from 'react';
import { DocData, SecrecyLevel, UrgencyLevel } from '../types';

interface PaperPreviewProps {
  data: DocData;
}

// --- Constants based on GB/T 9704-2012 ---
// A4: 210mm x 297mm
// Margins: Top 37mm, Bottom 35mm, Left 28mm, Right 26mm
// Content Width: 156mm
// Standard Font: 16pt (approx 5.64mm)
// Standard Line Height: 28pt (approx 9.88mm)
// Char Width: Approx equal to font size (square) for Chinese. 
// Chars per line = 156 / 5.64 ≈ 27.6 -> 28 chars
const CHARS_PER_LINE = 28;
const LINE_HEIGHT_PT = 28;
// Content Height = 297 - 37 - 35 = 225mm
// Total Lines per page = 225mm / 9.88mm ≈ 22.7 -> 22 lines
const LINES_PER_FULL_PAGE = 22; 
// Header takes up space. 
// (Issuer ~3 lines space) + (RedHeader ~3 lines) + (Divider/Number ~2 lines) + (Title ~3 lines) + (Recipient ~1 line)
// Approx 12 lines for header area on page 1.
const LINES_FOR_HEADER_AREA = 10; 
const LINES_FOR_PAGE_1 = LINES_PER_FULL_PAGE - LINES_FOR_HEADER_AREA;
// Signature needs approx 4 lines (Signer + Date + Gap)
const LINES_FOR_SIGNATURE = 4;

const toChineseNum = (num: number) => {
  const chars = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  return num.toString().split('').map(d => chars[parseInt(d)]).join('');
};

const formatDateToChinese = (dateStr: string) => {
  if (!dateStr) return '    年  月  日';
  const date = new Date(dateStr);
  const year = toChineseNum(date.getFullYear());
  const month = toChineseNum(date.getMonth() + 1);
  const day = toChineseNum(date.getDate());
  return `${year}年${month}月${day}日`;
};

// Helper to split text into lines based on char count
const splitTextToLines = (text: string): string[] => {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  paragraphs.forEach(paragraph => {
    if (!paragraph) {
      lines.push(''); // Empty line for paragraph break
      return;
    }
    
    let current = paragraph;
    while (current.length > 0) {
      // Simple slice. Ideally we'd measure, but monospace-ish estimation works well for CJK
      let chunk = current.slice(0, CHARS_PER_LINE);
      
      // Basic punctuation handling: Don't start line with punctuation if possible
      // (Simplified logic: just strict cut for now to ensure fit)
      
      lines.push(chunk);
      current = current.slice(CHARS_PER_LINE);
    }
  });
  
  return lines;
};

interface PageContent {
  pageIndex: number;
  lines: string[];
  isFirstPage: boolean;
  hasSignature: boolean;
}

export const PaperPreview: React.FC<PaperPreviewProps> = ({ data }) => {
  
  const pages = useMemo(() => {
    const allLines = splitTextToLines(data.content || '');
    const pagesList: PageContent[] = [];
    
    let currentLineIndex = 0;
    let pageIndex = 0;
    
    while (currentLineIndex < allLines.length) {
      const isFirstPage = pageIndex === 0;
      const maxLines = isFirstPage ? LINES_FOR_PAGE_1 : LINES_PER_FULL_PAGE;
      
      // Slice lines for this page
      const linesForThisPage = allLines.slice(currentLineIndex, currentLineIndex + maxLines);
      currentLineIndex += linesForThisPage.length;
      
      pagesList.push({
        pageIndex,
        lines: linesForThisPage,
        isFirstPage,
        hasSignature: false
      });
      pageIndex++;
    }

    // Handle Signature Placement
    // Check if last page has room
    const lastPage = pagesList[pagesList.length - 1] || { 
        pageIndex: 0, lines: [], isFirstPage: true, hasSignature: false 
    };
    
    // If empty pages list (no content), create one
    if (pagesList.length === 0) {
        pagesList.push(lastPage);
    }

    const lastPageMaxLines = lastPage.isFirstPage ? LINES_FOR_PAGE_1 : LINES_PER_FULL_PAGE;
    const linesUsed = lastPage.lines.length;
    
    if (linesUsed + LINES_FOR_SIGNATURE <= lastPageMaxLines) {
      lastPage.hasSignature = true;
    } else {
      // Create a new overflow page for signature
      pagesList.push({
        pageIndex: pageIndex,
        lines: [], // Empty text, just signature
        isFirstPage: false,
        hasSignature: true
      });
    }

    return pagesList;
  }, [data.content]);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-300 p-4 md:p-8 flex flex-col items-center gap-8">
      {pages.map((page) => (
        <div 
          key={page.pageIndex}
          className="bg-white shadow-xl relative print:shadow-none shrink-0"
          style={{
            width: '210mm',
            height: '297mm', // Fixed A4 height
            paddingTop: '37mm',
            paddingBottom: '35mm',
            paddingLeft: '28mm',
            paddingRight: '26mm',
            boxSizing: 'border-box',
            pageBreakAfter: 'always'
          }}
        >
          {/* --- Header Area (Only Page 1) --- */}
          {page.isFirstPage && (
            <>
              {/* Meta Top */}
              <div className="flex justify-between items-start mb-2 font-hei text-sm absolute top-[15mm] left-[28mm] right-[26mm]">
                <div className="flex flex-col gap-1 w-1/3">
                   {data.secrecy !== SecrecyLevel.NONE && (
                     <div className="flex gap-2">
                        <span className="tracking-[0.5em]">秘密等级</span>
                        <span className="font-bold">★{data.secrecy}</span>
                     </div>
                   )}
                   {data.urgency !== UrgencyLevel.NONE && (
                     <div className="flex gap-2">
                        <span className="tracking-[0.5em]">紧急程度</span>
                        <span className="font-bold">{data.urgency}</span>
                     </div>
                   )}
                </div>
              </div>

              {/* Red Header */}
              <div className="text-center mt-2 mb-8">
                <h1 
                  className="text-[2rem] leading-none font-song font-bold text-red-600 tracking-widest scale-x-110 transform origin-center"
                  style={{ textShadow: '0 0 1px rgba(220, 38, 38, 0.3)' }}
                >
                  {data.issuer || '发文机关名称'}
                  <span className="text-black ml-4 text-[1.5rem] font-normal tracking-normal text-red-600">文件</span>
                </h1>
              </div>

              {/* Red Line & Doc Number */}
              <div className="relative h-[2px] bg-red-600 mb-8 mt-12 w-full">
                 <div className="absolute -top-8 w-full text-center font-fangsong text-lg bg-white px-2 inline-block">
                   {data.docNumber || '〔2024〕 号'}
                 </div>
              </div>

              {/* Title */}
              <div className="text-center mb-6 px-4 min-h-[3em] flex items-center justify-center">
                <h2 className="font-song font-bold text-[22pt] leading-snug">
                  {data.title || '关于事项的通知'}
                </h2>
              </div>

              {/* Recipient */}
              <div className="text-left font-fangsong text-[16pt] mb-4 pl-0">
                {data.recipient ? `${data.recipient}：` : '某某单位：'}
              </div>
            </>
          )}

          {/* --- Body Content --- */}
          <div className="font-fangsong text-[16pt] leading-[28pt] text-justify">
             {page.lines.map((line, idx) => (
               <div key={idx} className="whitespace-pre-wrap min-h-[28pt]">
                  {/* Indent only if it looks like start of a paragraph (logic simplified here) */}
                  {/* Actually standard practice: lines are just lines. Indent is usually handled by source text having spaces or CSS text-indent on p tags. 
                      Since we split by lines manually, we lose <p> context. 
                      Workaround: Rely on user inputting spaces or add indent to first line of chunk? 
                      Better: Just render line. If user wants indent, they type spaces. 
                  */}
                  {line}
               </div>
             ))}
             {page.lines.length === 0 && !page.hasSignature && (
               <div className="text-slate-300 italic text-sm text-center mt-10">
                 (No text on this page)
               </div>
             )}
          </div>

          {/* --- Signature Area (If valid for this page) --- */}
          {page.hasSignature && (
            <div className="absolute bottom-[45mm] right-[26mm] flex flex-col items-end gap-2 leading-[28pt]">
              <div className="font-fangsong text-[16pt] mr-4 text-right min-w-[200px]">
                 {data.signer || data.issuer}
              </div>
              <div className="font-fangsong text-[16pt] mr-4 text-right min-w-[200px]">
                 {formatDateToChinese(data.date)}
              </div>
            </div>
          )}

          {/* --- Page Number --- */}
          <div className="absolute bottom-[20mm] left-0 w-full text-center font-song text-sm text-black">
            - {page.pageIndex + 1} -
          </div>

          {/* Visual Divider (Screen only) */}
          <div className="absolute -bottom-[20px] left-0 w-full h-[10px] bg-transparent print:hidden" />
        </div>
      ))}
    </div>
  );
};