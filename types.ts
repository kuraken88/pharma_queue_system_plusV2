export type QueueStatus = 'waiting' | 'called' | 'done';

export interface QueueItem {
  id: string;
  number: string;
  comment: string;
  status: QueueStatus;
  timestamp: number;
}

export interface QueueState {
  queue: QueueItem[];
  currentNumber: QueueItem | null;
  blinkingNumberId: string | null;
  soundEnabled: boolean;
}

export interface QueueContextType extends QueueState {
  addNumber: (number: string, comment: string) => void;
  updateComment: (id: string, comment: string) => void;
  callNumber: (id: string) => void;
  startBlink: (id: string) => void;
  stopBlink: () => void;
  completeNumber: (id: string) => void;
  deleteNumber: (id: string) => void;
  clearAll: () => void;
  toggleSound: () => void;
}