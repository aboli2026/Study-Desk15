import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  StickyNote,
  FileText,
  ArrowLeft,
  Copy,
  Check,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { StudyFile, StickyNoteItem, NoteItem } from '../types';

export interface FileQuickNotesContextMenuProps {
  file: StudyFile;
  position?: { x: number; y: number } | null;
  onClose: () => void;
  notes: NoteItem[];
  onOpenFile: (file: StudyFile) => void;
  onOpenFileAtPage?: (file: StudyFile, pageNumber: number) => void;
  onSwitchToNotes?: (noteId?: string) => void;
}

export const FileQuickNotesContextMenu: React.FC<FileQuickNotesContextMenuProps> = ({
  file,
  onClose,
  notes,
  onOpenFile,
  onOpenFileAtPage,
  onSwitchToNotes,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'sticky' | 'notebook' | 'all'>('sticky');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-focus search on open for instant finding
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation & Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Clean file title
  const cleanFileName = (name?: string): string => {
    if (!name) return 'فایل مطالعه';
    return name.replace(/\.pdf$/i, '').trim() || name;
  };

  // Sticky notes of this file
  const stickyNotes = useMemo(() => {
    const list = [...(file.stickyNotes || [])];
    // Sort by page number
    return list.sort((a, b) => (a.pageNumber || 1) - (b.pageNumber || 1));
  }, [file.stickyNotes]);

  // Attached notebook notes of this file
  const attachedNotes = useMemo(() => {
    const fileNameClean = (file.name || '').trim().toLowerCase();
    return notes.filter((n) => {
      if (n.attachedFileId && n.attachedFileId === file.id) return true;
      if (n.attachedFileName && n.attachedFileName.trim().toLowerCase() === fileNameClean) return true;
      return false;
    });
  }, [notes, file.id, file.name]);

  // Unified items list
  interface UnifiedNoteItem {
    id: string;
    type: 'sticky' | 'notebook';
    title: string;
    content: string;
    pageNumber?: number;
    color?: string;
    textColor?: string;
    date?: string;
    rawSticky?: StickyNoteItem;
    rawNote?: NoteItem;
  }

  const allNotesList: UnifiedNoteItem[] = useMemo(() => {
    const items: UnifiedNoteItem[] = [];

    stickyNotes.forEach((s) => {
      items.push({
        id: s.id,
        type: 'sticky',
        title: s.title || `استیکی‌نوت صفحه ${s.pageNumber}`,
        content: s.content || '',
        pageNumber: s.pageNumber,
        color: s.color || '#fef08a',
        textColor: s.textColor || '#713f12',
        date: s.createdAt,
        rawSticky: s,
      });
    });

    attachedNotes.forEach((n) => {
      // Strip html tags for search and preview
      const plainText = (n.content || '').replace(/<[^>]*>?/gm, '').trim();
      items.push({
        id: n.id,
        type: 'notebook',
        title: n.title || 'یادداشت متصل',
        content: plainText,
        date: n.updatedAt || n.createdAt,
        rawNote: n,
      });
    });

    return items;
  }, [stickyNotes, attachedNotes]);

  // Filtered by search and category
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allNotesList.filter((item) => {
      // Type filter
      if (filterType === 'sticky' && item.type !== 'sticky') return false;
      if (filterType === 'notebook' && item.type !== 'notebook') return false;

      // Search query
      if (!q) return true;
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchContent = item.content.toLowerCase().includes(q);
      const matchPage = item.pageNumber ? `صفحه ${item.pageNumber}`.includes(q) || String(item.pageNumber) === q : false;
      return matchTitle || matchContent || matchPage;
    });
  }, [allNotesList, searchQuery, filterType]);

  const handleCopy = (text: string, id: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleJumpToPage = (pageNum: number) => {
    onClose();
    if (onOpenFileAtPage) {
      onOpenFileAtPage(file, pageNum);
    } else {
      onOpenFile(file);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-ios-jelly"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="w-full max-w-2xl max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-neutral-200/80 flex flex-col overflow-hidden text-neutral-800"
      >
        {/* Header - Spacious & Clean */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 bg-neutral-50/50 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
                  <StickyNote className="w-3.5 h-3.5 text-amber-700" />
                  <span>دسترسی سریع به یادداشت‌ها</span>
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {allNotesList.length} مورد یافت شد
                </span>
              </div>
              <h2
                className="text-lg sm:text-xl font-bold text-neutral-900 truncate tracking-tight pt-0.5"
                title={file.name}
              >
                {cleanFileName(file.name)}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200/60 rounded-2xl transition-colors cursor-pointer shrink-0"
              title="بستن (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Search Box - Instant Real-Time Filter */}
          <div className="relative w-full">
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در متن یادداشت‌ها، عنوان، یا شماره صفحه..."
              className="w-full pr-10 pl-10 py-3 bg-white border border-neutral-200/90 rounded-2xl text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Clean Filter Tabs - Two Distinct Primary Sections */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setFilterType('sticky')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'sticky'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:bg-amber-50 border border-neutral-200/70'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5" />
              <span>استیکی‌نوت‌ها ({stickyNotes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('notebook')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'notebook'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:bg-blue-50 border border-neutral-200/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>یادداشت‌های دفترچه ({attachedNotes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/70'
              }`}
            >
              همه ({allNotesList.length})
            </button>
          </div>
        </div>

        {/* Content Area - Spacious, Uncluttered, Readable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {filteredNotes.length === 0 ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mb-3">
                <StickyNote className="w-6 h-6 stroke-1" />
              </div>
              <h3 className="text-base font-bold text-neutral-800">
                {searchQuery ? 'یادداشتی با این عبارت پیدا نشد' : 'هیچ یادداشتی در این فایل ثبت نشده'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm leading-relaxed">
                {searchQuery
                  ? 'عبارت دیگری را جستجو کنید یا فیلتر را تغییر دهید.'
                  : 'در حین مطالعه فایل می‌توانید با ابزار استیکی‌نوت نکات مهم را روی صفحات ثبت کنید.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFile(file);
                  }}
                  className="mt-4 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>باز کردن فایل و شروع مطالعه</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredNotes.map((item) => {
                const isSticky = item.type === 'sticky';

                return (
                  <div
                    key={item.id}
                    style={
                      isSticky
                        ? {
                            backgroundColor: item.color || '#fef08a',
                            color: item.textColor || '#713f12',
                          }
                        : undefined
                    }
                    className={`rounded-2xl p-4 sm:p-5 transition-all relative border ${
                      isSticky
                        ? 'border-black/10 shadow-xs'
                        : 'bg-white border-neutral-200/90 hover:border-neutral-300 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Page / Tag Badge + Actions */}
                    <div
                      className={`flex items-center justify-between gap-2 pb-3 mb-3 border-b ${
                        isSticky ? 'border-black/10' : 'border-neutral-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isSticky ? (
                          <button
                            type="button"
                            onClick={() => item.pageNumber && handleJumpToPage(item.pageNumber)}
                            className="px-2.5 py-1 rounded-xl bg-black/10 hover:bg-black/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="پرش مستقیم به این صفحه"
                          >
                            <span>صفحه {item.pageNumber}</span>
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            <span>یادداشت دفترچه</span>
                          </span>
                        )}

                        <span
                          className={`text-sm font-bold truncate ${
                            isSticky ? '' : 'text-neutral-900'
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.content, item.id)}
                          className={`p-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
                            isSticky
                              ? 'hover:bg-black/10'
                              : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
                          }`}
                          title="کپی متن"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[11px] text-emerald-600 font-bold">کپی شد</span>
                            </>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {isSticky && item.pageNumber && (
                          <button
                            type="button"
                            onClick={() => handleJumpToPage(item.pageNumber!)}
                            className="px-3 py-1 bg-black/15 hover:bg-black/25 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>مشاهده در صفحه</span>
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!isSticky && onSwitchToNotes && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSwitchToNotes(item.id);
                            }}
                            className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>ویرایش در دفترچه</span>
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Note Content - Large, Relaxed, Readable */}
                    <div className="select-text">
                      <p
                        className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal ${
                          isSticky ? 'opacity-95' : 'text-neutral-700'
                        }`}
                      >
                        {item.content || 'بدون محتوای متنی'}
                      </p>
                    </div>

                    {/* Footer Date / Metadata */}
                    {item.date && (
                      <div
                        className={`pt-3 mt-3 border-t text-[11px] font-mono flex items-center justify-between ${
                          isSticky ? 'border-black/10 opacity-70' : 'border-neutral-100 text-neutral-400'
                        }`}
                      >
                        <span>تاریخ ثبت: {item.date}</span>
                        {isSticky && (
                          <span className="cursor-pointer hover:underline" onClick={() => item.pageNumber && handleJumpToPage(item.pageNumber)}>
                            کلیک برای باز کردن فایل در صفحه {item.pageNumber}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer - Subtle Action Bar */}
        <div className="p-4 px-6 bg-neutral-50/80 border-t border-neutral-200/70 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span>کلید Esc برای بستن</span>
            <span>·</span>
            <span>کلیک روی «مشاهده در صفحه» برای رفتن به متن پی‌دی‌اف</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenFile(file);
            }}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>مطالعه فایل</span>
          </button>
        </div>
      </div>
    </div>
  );
};
