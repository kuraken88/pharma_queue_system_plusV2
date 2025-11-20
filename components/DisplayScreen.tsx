
import React, { useEffect, useRef, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { playChime } from '../utils/sound';
import { Volume2, Maximize } from 'lucide-react';

const DisplayScreen: React.FC = () => {
  const { currentNumber, blinkingNumberId, soundEnabled, queue } = useQueue();
  const prevNumberIdRef = useRef<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Watch for changes in currentNumber to trigger sound
  useEffect(() => {
    if (!currentNumber) {
      prevNumberIdRef.current = null;
      return;
    }

    // If the current number ID has changed (and we have interacted with the DOM)
    if (currentNumber.id !== prevNumberIdRef.current) {
      if (hasInteracted && soundEnabled) {
        playChime();
      }
      prevNumberIdRef.current = currentNumber.id;
    }
  }, [currentNumber, hasInteracted, soundEnabled]);

  // Handler to unlock AudioContext
  const handleStart = () => {
    setHasInteracted(true);
    playChime(); // Play once to initialize/test
    // Optional: try to request fullscreen
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    } catch (e) {
      // Ignore fullscreen errors
    }
  };

  // Interaction Overlay (required for Autoplay policy)
  if (!hasInteracted) {
    return (
      <div 
        onClick={handleStart}
        className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white cursor-pointer z-50 transition-colors hover:bg-slate-800"
      >
        <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm border border-white/20 flex flex-col items-center animate-pulse">
          <Volume2 size={64} className="mb-6" />
          <h1 className="text-4xl font-bold mb-4">画面をタップして開始</h1>
          <p className="text-slate-300 text-lg flex items-center gap-2">
            <Maximize size={20} />
            音声とフルスクリーンを有効にします
          </p>
        </div>
      </div>
    );
  }

  // If blink is active for the current number
  const isBlinking = currentNumber && blinkingNumberId === currentNumber.id;

  // Sort queue newest to oldest
  const sortedQueue = [...queue].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="w-screen h-screen bg-white overflow-hidden cursor-none select-none">
      <div className="w-full h-full grid grid-cols-10">
        {/* Left: 70% - Main current number */}
        <div className="col-span-7 relative flex items-center justify-center">
          {/* Header Labels */}
          <div className="absolute top-6 md:top-10 text-gray-500 font-bold tracking-widest text-center leading-snug">
            <div className="text-2xl md:text-4xl">お薬ができています</div>
            <div className="text-xl md:text-3xl mt-1">ただいまの番号</div>
          </div>

          {/* Main Number Display */}
          <div className="flex items-center justify-center w-full h-full">
            {currentNumber ? (
              <div 
                className={`
                  font-black tracking-tighter leading-none
                  transition-all duration-300
                  ${isBlinking ? 'animate-urgent-blink' : 'text-gray-900'}
                `}
                style={{ 
                  fontSize: 'min(42vw, 650px)', 
                  fontVariantNumeric: 'tabular-nums' 
                }}
              >
                {currentNumber.number}
              </div>
            ) : (
              <div className="text-gray-300 text-4xl md:text-6xl font-bold tracking-widest opacity-50">
                お待ちください
              </div>
            )}
          </div>
        </div>

        {/* Right: 30% - 待ち行列一覧 */}
        <div className="col-span-3 border-l border-gray-200 bg-gray-50 h-full flex flex-col">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-gray-600 text-2xl md:text-3xl font-bold tracking-widest leading-snug">
              以下の番号の方は、もうしばらくお待ちください
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {sortedQueue.length === 0 && (
              <div className="text-gray-300 text-xl md:text-2xl text-center mt-8">
                なし
              </div>
            )}
            {sortedQueue.map(item => (
              <div
                key={item.id}
                className={`
                  w-full bg-white border border-gray-200 rounded-xl
                  px-4 py-3 md:px-5 md:py-4
                  shadow-sm
                  ${currentNumber && item.id === currentNumber.id ? 'ring-2 ring-red-400' : ''}
                `}
              >
                <div
                  className="font-extrabold text-gray-900 tracking-tight"
                  style={{ fontVariantNumeric: 'tabular-nums', fontSize: 'min(6vw, 64px)' }}
                >
                  {item.number}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplayScreen;
