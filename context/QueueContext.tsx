
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { QueueItem, QueueContextType, QueueState, Gender, AgeRange } from '../types';
import { playChime } from '../utils/sound';

const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Initial dummy data for demonstration
const INITIAL_QUEUE: QueueItem[] = [
  { id: '1', number: '101', comment: '佐藤さん', status: 'waiting', timestamp: Date.now() },
  { id: '2', number: '102', comment: '内科', status: 'waiting', timestamp: Date.now() + 1000 },
];

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or use initial
  const [state, setState] = useState<QueueState>(() => {
    const saved = localStorage.getItem('pharmacy_queue_state');
    return saved ? JSON.parse(saved) : {
      queue: INITIAL_QUEUE,
      currentNumber: null,
      blinkingNumberId: null,
      soundEnabled: true,
    };
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('pharmacy_queue_state', JSON.stringify(state));
  }, [state]);

  // Sync across tabs (simulating Socket.IO for this single-browser-instance demo)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pharmacy_queue_state' && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addNumber = useCallback((number: string, comment: string, gender: Gender, ageRange: AgeRange) => {
    setState(prev => ({
      ...prev,
      queue: [
        ...prev.queue,
        {
          id: crypto.randomUUID(),
          number,
          comment,
          status: 'waiting',
          timestamp: Date.now(),
          gender,
          ageRange,
        }
      ]
    }));
  }, []);

  const updateComment = useCallback((id: string, comment: string) => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.map(item => item.id === id ? { ...item, comment } : item),
      currentNumber: prev.currentNumber?.id === id ? { ...prev.currentNumber, comment } : prev.currentNumber
    }));
  }, []);

  const callNumber = useCallback((id: string) => {
    setState(prev => {
      const target = prev.queue.find(q => q.id === id);
      if (!target) return prev;

      // Play sound immediately if enabled (side effect, but acceptable for immediate feedback in Admin UI)
      if (prev.soundEnabled) {
        setTimeout(() => playChime(), 0);
      }
      
      const updatedQueue = prev.queue.map(item => 
        item.id === id ? { ...item, status: 'called' as const } : item
      );

      return {
        ...prev,
        queue: updatedQueue,
        currentNumber: { ...target, status: 'called' as const },
        blinkingNumberId: null // Reset blink on new call
      };
    });
  }, []);

  const startBlink = useCallback((id: string) => {
    setState(prev => ({ ...prev, blinkingNumberId: id }));
  }, []);

  const stopBlink = useCallback(() => {
    setState(prev => ({ ...prev, blinkingNumberId: null }));
  }, []);

  const completeNumber = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.filter(item => item.id !== id),
      currentNumber: prev.currentNumber?.id === id ? null : prev.currentNumber,
      blinkingNumberId: prev.blinkingNumberId === id ? null : prev.blinkingNumberId
    }));
  }, []);

  const deleteNumber = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.filter(item => item.id !== id),
      currentNumber: prev.currentNumber?.id === id ? null : prev.currentNumber
    }));
  }, []);

  const clearAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      queue: [],
      currentNumber: null,
      blinkingNumberId: null
    }));
  }, []);

  const toggleSound = useCallback(() => {
    setState(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  return (
    <QueueContext.Provider value={{
      ...state,
      addNumber,
      updateComment,
      callNumber,
      startBlink,
      stopBlink,
      completeNumber,
      deleteNumber,
      clearAll,
      toggleSound
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
