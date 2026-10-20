import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Coffee,
  Settings,
  Plus,
  Volume2,
  Check,
} from 'lucide-react';
import { PomodoroMode, PomodoroSettings } from '../types';
import { PomodoroSettingsModal } from './PomodoroSettingsModal';
import { playMinimalPomodoroSound } from '../utils/pomodoroAudio';

interface PomodoroViewProps {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  completedCount: number;
  settings: PomodoroSettings;
  sessionElapsedSeconds?: number;
  onSwitchMode: (newMode: PomodoroMode) => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onFinalizeEarly?: () => void;
  onAddTime: (minutes: number) => void;
  onUpdateSettings: (newSettings: PomodoroSettings) => void;
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({
  mode,
  timeLeft,
  isRunning,
  completedCount,
  settings,
  sessionElapsedSeconds = 0,
  onSwitchMode,
  onTogglePlay,
  onReset,
  onFinalizeEarly,
  onAddTime,
  onUpdateSettings,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const getModeTotalSeconds = (currentMode: PomodoroMode): number => {
    switch (currentMode) {
      case 'focus':
        return settings.focusDuration * 60;
      case 'short-break':
        return settings.shortBreakDuration * 60;
      case 'long-break':
        return settings.longBreakDuration * 60;
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = getModeTotalSeconds(mode);
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  const elapsedMins = Math.round(sessionElapsedSeconds / 60);
  const hasElapsedProgress = sessionElapsedSeconds >= 60;

  const soundNameMap: Record<string, string> = {
    crystal: 'کریستالی مینیمال',
    zen: 'ناقوس ذن',
    marimba: 'ماریمبا چوبی',
    bell: 'زنگ ملایم',
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-neutral-50/50 select-none overflow-y-auto">
      {/* Settings Modal */}
      <PomodoroSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={onUpdateSettings}
      />

      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center relative animate-ios-jelly">
        {/* Top Header Row with Settings Trigger */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-800">تایمر تمرکز پومودورو</span>
            {isRunning && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl cursor-pointer shadow-2xs ios-spring-btn"
            title="تنظیمات زمان‌های دلخواه و صدا"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>تنظیمات</span>
          </button>
        </div>

        {/* Mode Selector Tabs with Customized Times */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-2xl mb-8 w-full">
          <button
            onClick={() => onSwitchMode('focus')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl cursor-pointer text-center flex flex-col sm:flex-row items-center justify-center gap-1 ios-spring-btn ${
              mode === 'focus'
                ? 'bg-white text-neutral-900 shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>مطالعه</span>
            <span className="text-[10px] font-mono text-neutral-400 font-normal">
              ({settings.focusDuration}m)
            </span>
          </button>
          <button
            onClick={() => onSwitchMode('short-break')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl cursor-pointer text-center flex flex-col sm:flex-row items-center justify-center gap-1 ios-spring-btn ${
              mode === 'short-break'
                ? 'bg-white text-neutral-900 shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>استراحت کوتاه</span>
            <span className="text-[10px] font-mono text-neutral-400 font-normal">
              ({settings.shortBreakDuration}m)
            </span>
          </button>
          <button
            onClick={() => onSwitchMode('long-break')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl cursor-pointer text-center flex flex-col sm:flex-row items-center justify-center gap-1 ios-spring-btn ${
              mode === 'long-break'
                ? 'bg-white text-neutral-900 shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <span>استراحت طولانی</span>
            <span className="text-[10px] font-mono text-neutral-400 font-normal">
              ({settings.longBreakDuration}m)
            </span>
          </button>
        </div>

        {/* Big Tabular Timer */}
        <div className="text-center mb-6">
          <div className="text-7xl sm:text-8xl font-mono font-bold tracking-tight text-neutral-900 tabular-nums">
            {formattedTime}
          </div>
          <p className="text-xs text-neutral-400 mt-3 flex items-center justify-center gap-1.5">
            {mode === 'focus' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>جلسه تمرکز روی جزوه و کتاب ({settings.focusDuration} دقیقه)</span>
              </>
            ) : mode === 'short-break' ? (
              <>
                <Coffee className="w-3.5 h-3.5 text-emerald-600" />
                <span>تنفس کوتاه، نوشیدن آب و بازیابی انرژی ({settings.shortBreakDuration} دقیقه)</span>
              </>
            ) : (
              <>
                <Coffee className="w-3.5 h-3.5 text-indigo-600" />
                <span>استراحت طولانی و عمیق ({settings.longBreakDuration} دقیقه)</span>
              </>
            )}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full transition-all duration-300 ${
              mode === 'focus'
                ? 'bg-neutral-900'
                : mode === 'short-break'
                ? 'bg-emerald-600'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quick Add Time Chips */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => onAddTime(1)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer ios-spring-btn"
            title="افزودن ۱ دقیقه"
          >
            <Plus className="w-3 h-3" />
            <span>1+ دقیقه</span>
          </button>
          <button
            onClick={() => onAddTime(5)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer ios-spring-btn"
            title="افزودن ۵ دقیقه"
          >
            <Plus className="w-3 h-3" />
            <span>5+ دقیقه</span>
          </button>
        </div>

        {/* Real-time Recorded Study Indicator */}
        {hasElapsedProgress && (
          <div
            className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 mb-5 rounded-2xl text-xs transition-all duration-200 border ${
              isRunning
                ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span className="font-semibold">
                {isRunning ? 'در حال ثبت در این نشست:' : 'ثبت‌شده در آمار و تحلیل:'}
              </span>
              <span className="font-bold font-mono text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                {elapsedMins} دقیقه
              </span>
            </div>
            {!isRunning && (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                ذخیره شد ✓
              </span>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="w-full flex items-center justify-center flex-wrap gap-3 mb-6">
          {/* Button 1: Play / Stop (Pause) */}
          <button
            onClick={onTogglePlay}
            className={`px-6 py-3.5 font-bold text-sm rounded-2xl cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ios-spring-btn ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>استپ (توقف)</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {hasElapsedProgress
                    ? 'ادامه مطالعه'
                    : mode === 'focus'
                    ? 'شروع مطالعه'
                    : 'شروع استراحت'}
                </span>
              </>
            )}
          </button>

          {/* Button 2: Dedicated Finish & Record Session */}
          <button
            onClick={() => {
              if (onFinalizeEarly && (hasElapsedProgress || isRunning)) {
                onFinalizeEarly();
              }
            }}
            disabled={!hasElapsedProgress && !isRunning}
            className={`px-5 py-3.5 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ios-spring-btn ${
              hasElapsedProgress || isRunning
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/20'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-60'
            }`}
            title={
              hasElapsedProgress || isRunning
                ? 'پایان دادن به این نشست و ثبت قطعی در تاریخچه و آمار عملکرد'
                : 'پس از شروع جلسه برای ثبت فعال می‌شود'
            }
          >
            <Check className="w-4 h-4" />
            <span>
              {hasElapsedProgress ? `پایان و ثبت (${elapsedMins} دقیقه)` : 'پایان و ثبت'}
            </span>
          </button>

          {/* Button 3: Reset Timer */}
          <button
            onClick={onReset}
            className="p-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 rounded-2xl cursor-pointer transition-colors ios-spring-tool"
            title="بازنشانی تایمر به مقدار اولیه"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Info Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 font-mono tabular-nums pt-4 border-t border-neutral-100 w-full">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تکمیل‌شده امروز: {completedCount} دوره</span>
          </div>

          <div
            onClick={() => playMinimalPomodoroSound(settings.soundType, settings.soundVolume)}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-700 cursor-pointer text-[11px]"
            title="کلیک برای تست صدای آلارم"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>صدای آلارم: {soundNameMap[settings.soundType] || 'کریستالی'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
