import { useEffect, useRef, useState } from 'react';
import { useChat } from '../store/ChatContext';
import { WidgetRenderer } from './Widgets';
import { Mic, Send, MoreVertical, Accessibility, Plus } from 'lucide-react';

export const Header = () => {
  const { toggleAccessibilityMode, isAccessibilityMode } = useChat();
  return (
    <header className="app-header">
      <div className="header-title">
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg" alt="HDFC Bank" height="20" />
        <span className="ai-badge">Eva AI</span>
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button className="icon-btn" onClick={toggleAccessibilityMode} aria-label="Accessibility Settings" style={{ color: isAccessibilityMode ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
          <Accessibility size={22} />
        </button>
        <button className="icon-btn" aria-label="Menu">
          <MoreVertical size={22} />
        </button>
      </div>
    </header>
  );
};

export const MessageList = () => {
  const { messages, isTyping } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Immediate scroll on new messages
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="chat-area scroll-container">
      {messages.map((msg) => (
        <div key={msg.id} className={`message ${msg.sender}`}>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{msg.text}</div>
          {msg.widget && (
            <WidgetRenderer type={msg.widget} data={msg.widgetData} />
          )}
          <div className="message-time">
            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="message bot" style={{ padding: '12px 16px' }}>
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      )}
      <div ref={bottomRef} style={{ height: '1px', flexShrink: 0 }} />
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
      addBotMessage("Voice input is limited on this browser. You can still use your device's dictation.");
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
    
    recognition.onerror = () => {
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
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
      console.error(e);
      addBotMessage("Please allow microphone permissions to use voice banking.");
    }
  };

  return (
    <div className="input-area">
      <button className="icon-btn" aria-label="Add file">
        <Plus size={24} />
      </button>
      <div className="input-container">
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder={isListening ? "Listening..." : (isProcessing ? "Processing..." : "Message Eva...")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isProcessing}
          aria-label="Chat input"
        />
        <button 
          className={`icon-btn ${isListening ? 'listening' : ''}`} 
          style={{ marginRight: '-4px' }} 
          onClick={handleVoiceToggle}
          disabled={isProcessing}
          aria-label="Voice command"
        >
          {isListening ? (
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <div className="voice-bar" style={{ animationDelay: '0s', width: '3px', height: '12px' }}></div>
              <div className="voice-bar" style={{ animationDelay: '0.2s', width: '3px', height: '12px' }}></div>
              <div className="voice-bar" style={{ animationDelay: '0.4s', width: '3px', height: '12px' }}></div>
            </div>
          ) : (
            <Mic size={22} color={isProcessing ? "var(--color-primary)" : "var(--color-text-muted)"} />
          )}
        </button>
      </div>
      <button 
        className={`icon-btn ${text.trim() ? 'primary' : ''}`} 
        onClick={handleSend}
        disabled={!text.trim() || isProcessing}
        aria-label="Send"
        style={{ color: text.trim() ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
      >
        <Send size={22} />
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
