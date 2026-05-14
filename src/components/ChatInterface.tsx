import { useEffect, useRef, useState } from 'react';
import { useChat } from '../store/ChatContext';
import { WidgetRenderer } from './Widgets';
import { Mic, Send, MoreVertical, Accessibility, Plus } from 'lucide-react';

export const Header = () => {
  const { toggleAccessibilityMode, isAccessibilityMode } = useChat();
  return (
    <header className="app-header">
      <div className="header-title">
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg" alt="HDFC Bank" height="18" />
        <span className="ai-badge">Eva AI</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="icon-btn" onClick={toggleAccessibilityMode} aria-label="Toggle Accessibility" style={{ color: isAccessibilityMode ? 'var(--color-primary)' : 'var(--color-accent)' }}>
          <Accessibility size={24} />
        </button>
        <button className="icon-btn" aria-label="More">
          <MoreVertical size={24} color="var(--color-text-main)" />
        </button>
      </div>
    </header>
  );
};

export const MessageList = () => {
  const { messages, isTyping } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="chat-area scroll-container">
      {messages.map((msg) => (
        <div key={msg.id} className={`message ${msg.sender}`}>
          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
          {msg.widget && (
            <WidgetRenderer type={msg.widget} data={msg.widgetData} />
          )}
          <div className="message-time">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="message bot">
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      )}
      <div ref={bottomRef} style={{ height: '1px' }} />
    </div>
  );
};

export const InputArea = () => {
  const [text, setText] = useState('');
  const { sendMessage, addBotMessage } = useChat();
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const textRef = useRef('');
  const lastSubmissionRef = useRef<{ text: string, time: number }>({ text: '', time: 0 });

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed) {
      const now = Date.now();
      if (trimmed === lastSubmissionRef.current.text && (now - lastSubmissionRef.current.time) < 2500) {
        return; 
      }
      
      lastSubmissionRef.current = { text: trimmed, time: now };
      sendMessage(trimmed);
      setText('');
      textRef.current = '';
      if (recognitionRef.current) recognitionRef.current.stop();
      inputRef.current?.focus();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addBotMessage("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    
    textRef.current = '';
    setText('');
    setIsProcessing(false);
    
    const resetSilenceTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current) recognitionRef.current.stop();
      }, 5000);
    };

    recognition.onstart = () => {
      setIsListening(true);
      resetSilenceTimer();
    };
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      const currentInterim = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((r: any) => !r.isFinal)
        .map((r: any) => r[0].transcript)
        .join('');

      if (finalTranscript) {
         textRef.current += finalTranscript + ' ';
      }
      
      setText(textRef.current + currentInterim);
      resetSilenceTimer();
    };
    
    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      const finalVal = textRef.current.trim() || text.trim();
      if (finalVal) {
        setIsProcessing(true);
        setTimeout(() => {
            handleSend();
            setIsProcessing(false);
        }, 400);
      } else {
        setTimeout(() => {
            if (!textRef.current && !text) {
                addBotMessage("I couldn't hear anything. Please try again.");
            }
        }, 200);
      }
    };
    
    try {
      recognition.start();
    } catch (e) {
      addBotMessage("Please allow microphone permissions.");
    }
  };

  return (
    <div className="input-area">
      <button className="icon-btn" aria-label="Add attachment">
        <Plus size={24} />
      </button>
      <div className="input-container">
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder={isListening ? "Listening..." : "Type or speak..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isProcessing}
        />
        <button 
          className={`icon-btn ${isListening ? 'listening' : ''}`} 
          onClick={handleVoiceToggle}
          disabled={isProcessing}
        >
          {isListening ? (
             <div style={{ display: 'flex', gap: '2px', height: '14px' }}>
                <div className="voice-bar" style={{ animationDelay: '0s' }}></div>
                <div className="voice-bar" style={{ animationDelay: '0.2s' }}></div>
                <div className="voice-bar" style={{ animationDelay: '0.4s' }}></div>
             </div>
          ) : (
            <Mic size={22} />
          )}
        </button>
      </div>
      <button 
        className="icon-btn primary" 
        onClick={handleSend}
        disabled={!text.trim() || isProcessing}
      >
        <Send size={20} />
      </button>
    </div>
  );
};

export const ChatInterface = () => {
  return (
    <div className="app-container">
      <Header />
      <MessageList />
      <InputArea />
    </div>
  );
};
