export type QueueStatus = 'waiting' | 'called' | 'done';

export type Gender = '男性' | '女性';
export type AgeRange =
  | '００代'
  | '１０代'
  | '２０代'
  | '３０代'
  | '４０代'
  | '５０代'
  | '６０代'
  | '７０代'
  | '８０代'
  | '９０代';

export interface QueueItem {
  id: string;
  number: string;
  comment: string;
  status: QueueStatus;
  timestamp: number;
  gender?: Gender;
  ageRange?: AgeRange;
}

export interface QueueState {
  queue: QueueItem[];
  currentNumber: QueueItem | null;
  blinkingNumberId: string | null;
  soundEnabled: boolean;
}

export interface QueueContextType extends QueueState {
  addNumber: (number: string, comment: string, gender: Gender, ageRange: AgeRange) => void;
  updateComment: (id: string, comment: string) => void;
  callNumber: (id: string) => void;
  startBlink: (id: string) => void;
  stopBlink: () => void;
  completeNumber: (id: string) => void;
  deleteNumber: (id: string) => void;
  clearAll: () => void;
  toggleSound: () => void;
}