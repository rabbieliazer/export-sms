
export interface SMSMessage {
  id: string;
  address: string;
  body: string;
  date: number;
  type: 'sent' | 'received';
  contactName?: string;
}

export interface ChatThread {
  address: string;
  contactName: string;
  messages: SMSMessage[];
  lastMessageDate: number;
}

export interface AIAnalysisResult {
  summary: string;
  sentiment: string;
  keyDates: string[];
  tone: string;
}
