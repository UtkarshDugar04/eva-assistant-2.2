import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Message, WidgetType } from '../types';
import { parseUserInput, generateBotResponse } from '../utils/nlp';
import { mockAccount, mockCards, mockAutopays, mockTransactions } from '../data/mockData';

interface ChatContextType {
  messages: Message[];
  isTyping: boolean;
  sendMessage: (text: string) => void;
  sendAction: (botText: string, updatedContext: any, widget?: WidgetType, widgetData?: any) => void;
  addBotMessage: (text: string, widget?: WidgetType, widgetData?: any) => void;
  isAccessibilityMode: boolean;
  toggleAccessibilityMode: () => void;
  contextData: any;
  setContextData: (data: any) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAccessibilityMode, setIsAccessibilityMode] = useState(false);
  const [contextData, setContextData] = useState<any>({
    balance: mockAccount.balance,
    cards: [...mockCards],
    autopays: [...mockAutopays],
    transactions: [...mockTransactions],
    transactionFinished: false
  });

  const addBotMessage = (text: string, widget?: WidgetType, widgetData?: any) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text,
        sender: 'bot',
        timestamp: new Date(),
        widget,
        widgetData
      }]);
      setIsTyping(false);
    }, 800 + Math.random() * 400); 
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    const parsed = parseUserInput(text);
    const response = generateBotResponse(parsed, contextData, text);
    
    setContextData(response.updatedContext);
    addBotMessage(response.text, response.widget, response.widgetData);
  };

  const sendAction = (botText: string, updatedContext: any, widget?: WidgetType, widgetData?: any) => {
    setContextData(updatedContext);
    addBotMessage(botText, widget, widgetData);
  };

  const toggleAccessibilityMode = () => {
    setIsAccessibilityMode(prev => !prev);
    if (!isAccessibilityMode) {
      document.body.classList.add('accessibility-mode');
    } else {
      document.body.classList.remove('accessibility-mode');
    }
  };

  useEffect(() => {
    if (messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        const hour = new Date().getHours();
        let greeting = 'Good evening, I’m Eva 🌙';
        if (hour < 12) greeting = 'Good morning, I’m Eva ☀️';
        else if (hour < 17) greeting = 'Good afternoon, I’m Eva ☀️';

        setMessages([{
          id: 'welcome',
          text: `Hi, I’m Eva 👋\n${greeting}\nI’m here to help you with any of the following tasks:`,
          sender: 'bot',
          timestamp: new Date(),
          widget: 'welcome_actions'
        }]);
        setIsTyping(false);
      }, 1500);
    }
  }, []);

  return (
    <ChatContext.Provider value={{
      messages,
      isTyping,
      sendMessage,
      sendAction,
      addBotMessage,
      isAccessibilityMode,
      toggleAccessibilityMode,
      contextData,
      setContextData
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
