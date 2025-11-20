
import React, { useEffect, useRef, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { playChime } from '../utils/sound';
import { Volume2, Maximize } from 'lucide-react';

const DisplayScreen: React.FC = () => {
  const { currentNumber, blinkingNumberId, soundEnabled } = useQueue();
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

  return (
    <div className="w-screen h-screen bg-white flex flex-col items-center justify-center overflow-hidden cursor-none select-none">
      {/* Header Label */}
      <div className="absolute top-8 md:top-12 text-gray-500 text-2xl md:text-4xl font-bold tracking-widest">
        ただいまの番号
      </div>

      {/* Main Number Display */}
      <div className="flex-1 flex items-center justify-center w-full">
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
  );
};

export default DisplayScreen;
