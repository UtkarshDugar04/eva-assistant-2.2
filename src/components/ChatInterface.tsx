import { useEffect, useRef, useState } from 'react';
import { useChat } from '../store/ChatContext';
import { WidgetRenderer } from './Widgets';
import { Mic, Send, MoreVertical, Accessibility, Plus } from 'lucide-react';

export const Header = () => {
  const { toggleAccessibilityMode, isAccessibilityMode } = useChat();
  return (
    <header className="app-header">
      <div className="header-title">
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg" alt="HDFC Bank" height="24" />
        <span className="ai-badge">Eva Assistant</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="icon-btn" onClick={toggleAccessibilityMode} aria-label="Toggle Accessibility Mode" style={{ color: isAccessibilityMode ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
          <Accessibility size={24} />
        </button>
        <button className="icon-btn" aria-label="More options">
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
      <div ref={bottomRef} />
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
      // Duplicate Submission Guard
      const now = Date.now();
      if (trimmed === lastSubmissionRef.current.text && (now - lastSubmissionRef.current.time) < 2500) {
        return; 
      }
      
      lastSubmissionRef.current = { text: trimmed, time: now };
      sendMessage(trimmed);
      setText('');
      textRef.current = '';
      if (recognitionRef.current) {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
      }
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
      addBotMessage("Voice input is limited on this browser. You can still use your keyboard or device dictation.");
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
      }, 5000); // 5s silence before auto-stop
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
    
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      console.error('Speech error:', event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      const finalVal = textRef.current.trim();
      if (finalVal) {
        setIsProcessing(true);
        setTimeout(() => {
            sendMessage(finalVal);
            setText('');
            textRef.current = '';
            setIsProcessing(false);
        }, 300);
      } else {
        setTimeout(() => {
            if (!textRef.current && !text) {
                addBotMessage("I couldn't hear anything. Please try again.");
            }
        }, 100);
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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="input-area">
        <button className="icon-btn" aria-label="Add attachment">
          <Plus size={24} />
        </button>
        <div className="input-container" style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder={isListening ? "Listening..." : (isProcessing ? "Processing..." : "Type or speak naturally...")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isProcessing}
          />
          <button 
            className={`icon-btn ${isListening ? 'listening' : ''}`} 
            aria-label="Voice input" 
            style={{ marginRight: '-8px' }} 
            onClick={handleVoiceToggle}
            disabled={isProcessing}
          >
            {isListening ? (
              <div style={{ display: 'flex', gap: '2px', alignItems: 'center', height: '16px' }}>
                <div className="voice-bar" style={{ animationDelay: '0s' }}></div>
                <div className="voice-bar" style={{ animationDelay: '0.2s' }}></div>
                <div className="voice-bar" style={{ animationDelay: '0.4s' }}></div>
              </div>
            ) : (
              <Mic size={20} color={isProcessing ? "var(--color-primary)" : "var(--color-text-muted)"} />
            )}
          </button>
        </div>
        <button 
          className={`icon-btn ${text.trim() ? 'primary' : ''}`} 
          onClick={handleSend}
          disabled={!text.trim() || isProcessing}
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
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
