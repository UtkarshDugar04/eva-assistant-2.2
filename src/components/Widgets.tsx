import { useState, useEffect } from 'react';
import { useChat } from '../store/ChatContext';
import { CheckCircle2, ShieldAlert, CreditCard, ChevronRight, Fingerprint, Lock } from 'lucide-react';

export const TransferWidget = ({ data }: { data: any }) => {
  const { addBotMessage, setContextData } = useChat();
  const [status, setStatus] = useState<'pending' | 'authenticating' | 'success'>('pending');
  const [pin, setPin] = useState('');

  const handleConfirm = () => {
    setStatus('authenticating');
  };

  const handlePinAuth = () => {
    if (pin.length === 4) {
      setStatus('success');
      setTimeout(() => {
        setContextData((prev: any) => ({
          ...prev,
          balance: prev.balance - data.amount,
          transactions: [{
            id: `txn_${Date.now()}`,
            date: new Date(),
            amount: data.amount,
            merchant: data.beneficiary.name,
            status: 'Success',
            type: 'Debit'
          }, ...prev.transactions],
          stack: []
        }));
        addBotMessage(`Transfer of ₹${data.amount} to ${data.beneficiary.name} was successful. Reference ID: HDFC${Math.floor(Math.random() * 100000000)}`, 'success_status', { type: 'success', title: 'Transfer Successful', message: `₹${data.amount} sent to ${data.beneficiary.name}` });
      }, 1000);
    }
  };

  if (status === 'success') return null; // Will show success message in chat

  return (
    <div className="banking-widget">
      <div className="widget-header">
        <span>Transfer Summary</span>
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg" alt="HDFC" height="16" />
      </div>
      <div className="widget-content">
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
           <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{data.beneficiary?.name}</div>
           <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>📱 {data.beneficiary?.phone || 'N/A'}</div>
        </div>
        <div className="data-row">
          <span className="data-label">Via</span>
          <span className="data-value">UPI</span>
        </div>
        <div className="data-row">
          <span className="data-label">From Account</span>
          <span className="data-value">Savings ending 1423</span>
        </div>
        <div className="data-row" style={{ marginTop: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border)' }}>
          <span className="data-label">Amount</span>
          <span className="data-value amount" style={{ fontSize: '1.25rem' }}>₹{data.amount?.toLocaleString('en-IN')}</span>
        </div>
      </div>
      
      {status === 'pending' && (
        <div className="widget-footer">
          <button className="btn btn-outline" onClick={() => addBotMessage('Transfer cancelled.')}>Cancel</button>
          <button className="btn btn-primary" onClick={handleConfirm}>Confirm & Pay</button>
        </div>
      )}

      {status === 'authenticating' && (
        <div className="auth-overlay">
          <div className="auth-sheet">
            <div style={{ textAlign: 'center' }}>
              <Lock size={32} color="var(--color-primary)" />
              <h3 style={{ marginTop: 'var(--spacing-sm)' }}>Enter UPI PIN</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>For payment of ₹{data.amount} to {data.beneficiary?.name}</p>
            </div>
            
            <div className="pin-dots">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`pin-dot ${pin.length >= i ? 'filled' : ''}`} />
              ))}
            </div>

            <div className="keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((key) => (
                <button
                  key={key}
                  className="keypad-btn"
                  onClick={() => {
                    if (key === 'C') setPin('');
                    else if (key === 'OK') handlePinAuth();
                    else if (pin.length < 4) setPin(pin + key);
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CardControlsWidget = ({ data }: { data: any }) => {
  const { addBotMessage, setContextData } = useChat();
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  if (selectedCard) {
    if (data.viewOnly) {
       return (
         <div className="banking-widget">
           <div className="widget-header">
             <span>{selectedCard.name} •••• {selectedCard.numberEnding}</span>
             <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>{selectedCard.status}</span>
           </div>
           <div className="widget-content" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
             <button className="btn btn-outline" style={{ flex: '1 1 45%' }} onClick={() => addBotMessage(`I'll help you freeze your ${selectedCard.type} card ending in ${selectedCard.numberEnding}.`, 'card_controls', { cards: [selectedCard] })}>Freeze</button>
             <button className="btn btn-outline" style={{ flex: '1 1 45%' }} onClick={() => addBotMessage(`Let's change the PIN for your card ending in ${selectedCard.numberEnding}.`)}>Change PIN</button>
             <button className="btn btn-outline" style={{ flex: '1 1 45%' }} onClick={() => addBotMessage(`Let's manage limits for your card ending in ${selectedCard.numberEnding}.`)}>Limits</button>
             <button className="btn btn-outline" style={{ flex: '1 1 45%' }} onClick={() => addBotMessage(`International usage for ${selectedCard.numberEnding} is currently disabled. Would you like to enable it?`)}>Intl Usage</button>
           </div>
           <div className="widget-footer">
             <button className="btn btn-secondary btn-full" onClick={() => setSelectedCard(null)}>Back to Cards</button>
           </div>
         </div>
       );
    }

    return (
      <div className="banking-widget">
        <div className="widget-header" style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={16}/> Warning</span>
        </div>
        <div className="widget-content" style={{ textAlign: 'center' }}>
          <p>Are you sure you want to permanently block your {selectedCard.type} Card ending in {selectedCard.numberEnding}?</p>
        </div>
        <div className="widget-footer">
          <button className="btn btn-secondary" onClick={() => setSelectedCard(null)} disabled={isBlocking}>Cancel</button>
          <button className="btn btn-primary" style={{ backgroundColor: 'var(--color-primary)' }} disabled={isBlocking} onClick={() => { 
            setIsBlocking(true);
            setTimeout(() => {
              setContextData((prev: any) => ({
                ...prev,
                cards: prev.cards.map((c: any) => c.id === selectedCard.id ? { ...c, status: 'Blocked' } : c),
                stack: []
              }));
              addBotMessage(`Your ${selectedCard.type} card ending in ${selectedCard.numberEnding} has been permanently blocked. A replacement card has been initiated.`, 'success_status', { type: 'success', title: 'Card Blocked', message: `Card ${selectedCard.numberEnding} blocked successfully.` }); 
            }, 1000);
          }}>
            {isBlocking ? <span className="loader"></span> : 'Confirm Block'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="banking-widget">
      <div className="widget-header">
        <span>{data.viewOnly ? 'Your Active Cards' : 'Select Card to Block'}</span>
      </div>
      <div className="widget-content" style={{ padding: 0 }}>
        {data.cards?.map((card: any) => (
          <div key={card.id} style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setSelectedCard(card)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div style={{ padding: 'var(--spacing-sm)', backgroundColor: 'var(--color-bg-main)', borderRadius: 'var(--radius-sm)' }}>
                <CreditCard color="var(--color-accent)" />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{card.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{card.type} •••• {card.numberEnding}</div>
              </div>
            </div>
            <ChevronRight size={20} color="var(--color-text-muted)" />
          </div>
        ))}
      </div>
    </div>
  );
};

const Confetti = () => {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    const colors = ['#004C8F', '#EE3124', '#F4A018', '#00904C'];
    for (let i = 0; i < 50; i++) {
      const p = document.createElement('div');
      p.style.position = 'absolute';
      p.style.width = '8px';
      p.style.height = '8px';
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = '50%';
      p.style.top = '40%';
      p.style.opacity = '1';
      p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 200;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity - 100;
      const rot = Math.random() * 360;
      
      p.style.transition = 'all 1.5s cubic-bezier(0.1, 0.8, 0.3, 1)';
      container.appendChild(p);
      
      requestAnimationFrame(() => {
        p.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(0)`;
        p.style.opacity = '0';
      });
    }

    setTimeout(() => {
      document.body.removeChild(container);
    }, 1500);
  }, []);

  return null;
};

export const SuccessStatusWidget = ({ data }: { data: any }) => {
  return (
    <div className="banking-widget" style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
      {data.type === 'success' && <Confetti />}
      {data.type === 'success' ? (
        <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto var(--spacing-md)' }} className={window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'pulse' : ''} />
      ) : (
        <ShieldAlert size={48} color="var(--color-warning)" style={{ margin: '0 auto var(--spacing-md)' }} />
      )}
      <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>{data.title}</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{data.message}</p>
    </div>
  );
};

export const TransactionListWidget = ({ data }: { data: any }) => {
  const { addBotMessage } = useChat();
  return (
    <div className="banking-widget">
      <div className="widget-header">Recent Transactions</div>
      <div className="widget-content" style={{ padding: 0 }}>
        {data.transactions?.slice(0, 5).map((txn: any) => (
          <div key={txn.id} style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={() => addBotMessage(`Viewing details for ₹${txn.amount} to ${txn.merchant}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600 }}>{txn.merchant}</span>
              <span style={{ fontWeight: 600 }}>₹{txn.amount?.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              <span>{new Date(txn.date).toLocaleDateString()}</span>
              <span style={{ color: txn.status === 'Success' ? 'var(--color-success)' : 'var(--color-primary)' }}>{txn.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const KYCStatusWidget = () => {
  const { addBotMessage, setContextData } = useChat();
  const [step, setStep] = useState(1);

  if (step === 1) {
    return (
      <div className="banking-widget">
        <div className="widget-content" style={{ textAlign: 'center' }}>
          <Fingerprint size={48} color="var(--color-accent)" style={{ margin: '0 auto var(--spacing-md)' }} />
          <h3>Aadhaar Verification</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
            We will send an OTP to your Aadhaar linked mobile number ending in 98**
          </p>
          <button className="btn btn-primary btn-full" onClick={() => setStep(2)}>Generate OTP</button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="banking-widget">
        <div className="widget-content" style={{ textAlign: 'center' }}>
          <h3>Enter OTP</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
            Sent to mobile ending in 98**
          </p>
          <input 
            type="text" 
            placeholder="XXXXXX" 
            style={{ width: '100%', padding: 'var(--spacing-sm)', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--spacing-md)' }}
            maxLength={6}
            onChange={(e) => {
              if (e.target.value.length === 6) {
                setStep(3);
                setTimeout(() => {
                  setContextData({ stack: [] });
                  addBotMessage('Your KYC has been updated successfully. It is currently under review and will be approved within 24 hours.', 'success_status', { type: 'success', title: 'KYC Submitted', message: 'Aadhaar verification successful.' });
                }, 1000);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return null;
};

export const AutopayWidget = ({ data }: { data: any }) => {
  const { addBotMessage, setContextData } = useChat();
  return (
    <div className="banking-widget">
      <div className="widget-header">Setup Autopay</div>
      <div className="widget-content">
        <div className="data-row">
          <span className="data-label">Merchant</span>
          <span className="data-value">{data.merchant}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Frequency</span>
          <span className="data-value">Monthly</span>
        </div>
        <div className="data-row">
          <span className="data-label">Max Limit</span>
          <span className="data-value amount">₹1,000</span>
        </div>
      </div>
      <div className="widget-footer">
        <button className="btn btn-outline" onClick={() => { setContextData({ stack: [] }); addBotMessage('Autopay setup cancelled.'); }}>Cancel</button>
        <button className="btn btn-primary" onClick={() => { setContextData({ stack: [] }); addBotMessage(`Autopay mandate for ${data.merchant} has been set up successfully.`, 'success_status', { type: 'success', title: 'Autopay Active', message: `Mandate approved for ${data.merchant}` }); }}>Authorize</button>
      </div>
    </div>
  );
};

export const AutopayListWidget = ({ data }: { data: any }) => {
  const { addBotMessage, setContextData } = useChat();
  const [activeTab, setActiveTab] = useState<'Active' | 'Paused' | 'Completed'>('Active');
  const [selected, setSelected] = useState<any>(null);

  const filtered = data.mandates?.filter((m: any) => m.status === activeTab) || [];

  if (selected) {
    return (
      <div className="banking-widget">
        <div className="widget-header">
          <span>{selected.merchant} Autopay</span>
          <span style={{ fontSize: '0.75rem', color: selected.status === 'Active' ? 'var(--color-success)' : 'var(--color-warning)' }}>{selected.status}</span>
        </div>
        <div className="widget-content">
          <div className="data-row"><span className="data-label">Amount</span><span className="data-value amount">₹{selected.amount}</span></div>
          <div className="data-row"><span className="data-label">Frequency</span><span className="data-value">{selected.frequency}</span></div>
          <div className="data-row"><span className="data-label">Next Date</span><span className="data-value">{selected.nextDate.toLocaleDateString()}</span></div>
        </div>
        <div className="widget-footer" style={{ flexWrap: 'wrap' }}>
          {selected.status === 'Active' ? (
            <button className="btn btn-outline" onClick={() => { 
              setContextData((prev: any) => ({ ...prev, autopays: prev.autopays.map((a: any) => a.id === selected.id ? { ...a, status: 'Paused' } : a) }));
              setSelected(null); 
              addBotMessage(`Paused autopay for ${selected.merchant}.`); 
            }}>Pause</button>
          ) : (
             <button className="btn btn-outline" onClick={() => { 
               setContextData((prev: any) => ({ ...prev, autopays: prev.autopays.map((a: any) => a.id === selected.id ? { ...a, status: 'Active' } : a) }));
               setSelected(null); 
               addBotMessage(`Resumed autopay for ${selected.merchant}.`); 
             }}>Resume</button>
          )}
          <button className="btn btn-outline" style={{color: 'var(--color-primary)', borderColor: 'var(--color-primary)'}} onClick={() => { 
            setContextData((prev: any) => ({ ...prev, autopays: prev.autopays.map((a: any) => a.id === selected.id ? { ...a, status: 'Completed' } : a) }));
            setSelected(null); 
            addBotMessage(`Cancelled autopay for ${selected.merchant}.`); 
          }}>Cancel</button>
          <button className="btn btn-secondary" onClick={() => setSelected(null)}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="banking-widget">
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
        {['Active', 'Paused', 'Completed'].map(tab => (
          <button 
            key={tab} 
            style={{ flex: 1, padding: 'var(--spacing-sm)', fontWeight: activeTab === tab ? 600 : 400, borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : 'none' }}
            onClick={() => setActiveTab(tab as any)}
          >{tab}</button>
        ))}
      </div>
      <div className="widget-content" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
           <div style={{ padding: 'var(--spacing-md)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No {activeTab.toLowerCase()} mandates.</div>
        ) : filtered.map((m: any) => (
          <div key={m.id} style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} onClick={() => setSelected(m)}>
             <div>
                <div style={{ fontWeight: 600 }}>{m.merchant}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>₹{m.amount} • {m.frequency}</div>
             </div>
             <ChevronRight size={20} color="var(--color-text-muted)" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ContactSelectionWidget = ({ data }: { data: any }) => {
  const { addBotMessage, setContextData } = useChat();
  return (
    <div className="banking-widget">
      <div className="widget-header">
        <span>Select Contact</span>
      </div>
      <div className="widget-content" style={{ padding: 0 }}>
        {data.contacts?.map((contact: any) => (
          <button 
            key={contact.id} 
            className="contact-card"
            style={{ width: '100%', padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', background: 'none', border: 'none' }} 
            onClick={() => {
              setContextData((prev: any) => ({
                ...prev,
                entities: { ...prev.entities, beneficiaryId: contact.id, beneficiaryName: contact.name, beneficiaryObj: contact, multipleBeneficiaries: undefined }
              }));
              if (data.amount) {
                addBotMessage(`Confirm transfer details below.`, 'transfer_summary', { amount: data.amount, beneficiary: contact });
              } else {
                addBotMessage(`How much would you like to send to ${contact.name}?`);
              }
            }}
            aria-label={`Select recipient ${contact.name} phone number ending ${contact.phone?.slice(-4) || ''} button`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 600 }}>
                {contact.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{contact.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>📱 {contact.phone || 'N/A'}</div>
              </div>
            </div>
            <ChevronRight size={20} color="var(--color-text-muted)" />
          </button>
        ))}
      </div>
    </div>
  );
};

export const SupportTicketWidget = () => {
  const { addBotMessage } = useChat();
  const [ticketState, setTicketState] = useState<'initial' | 'chatting' | 'callback' | 'describe' | 'cancelled'>('initial');
  
  if (ticketState === 'chatting') {
    return (
      <div className="banking-widget">
        <div className="widget-content" style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          <p>You are now connected with <strong>Priya</strong> from HDFC Support.</p>
          <button className="btn btn-outline" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => setTicketState('initial')}>End Chat</button>
        </div>
      </div>
    );
  }

  return (
    <div className="banking-widget">
      <div className="widget-header" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <span>HDFC Customer Care</span>
      </div>
      <div className="widget-content">
        <div className="data-row"><span className="data-label">Ticket ID</span><span className="data-value">HDFC-20482</span></div>
        <div className="data-row"><span className="data-label">Issue Type</span><span className="data-value">General Support</span></div>
        <div className="data-row"><span className="data-label">Priority</span><span className="data-value">Standard</span></div>
        <div style={{ marginTop: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--color-warning)', fontWeight: 600 }}>Estimated wait time: 3 mins</div>
      </div>
      <div className="widget-footer" style={{ flexDirection: 'column', gap: '8px' }}>
         <button className="btn btn-primary btn-full" aria-label="Chat with Agent button" onClick={() => { setTicketState('chatting'); addBotMessage('Connecting agent...'); }}>Chat with Agent</button>
         <button className="btn btn-outline btn-full" aria-label="Request Callback button" onClick={() => { addBotMessage('When would you like us to call you?', 'success_status', { type: 'support', title: 'Schedule Callback', message: 'Options: Call now, Within 15 mins, Evening' }); setTicketState('callback'); }}>Request Callback</button>
         <button className="btn btn-outline btn-full" aria-label="Describe Issue button" onClick={() => addBotMessage('Please type your issue below and I will attach it to the ticket.')}>Describe My Issue</button>
         <button className="btn btn-secondary btn-full" aria-label="Cancel Ticket button" onClick={() => { addBotMessage('Support ticket cancelled.'); setTicketState('cancelled'); }}>Cancel Ticket</button>
      </div>
    </div>
  );
};

export const WelcomeActionsWidget = () => {
  const { sendMessage } = useChat();
  return (
    <div className="welcome-actions fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
      <button className="btn btn-outline" style={{ justifyContent: 'flex-start', background: 'var(--color-bg-main)' }} onClick={() => sendMessage('Send money')}>💸 Send Money</button>
      <button className="btn btn-outline" style={{ justifyContent: 'flex-start', background: 'var(--color-bg-main)' }} onClick={() => sendMessage('Check balance')}>🏦 Check Balance</button>
      <button className="btn btn-outline" style={{ justifyContent: 'flex-start', background: 'var(--color-bg-main)' }} onClick={() => sendMessage('View statements')}>📄 View Statements</button>
      <button className="btn btn-outline" style={{ justifyContent: 'flex-start', background: 'var(--color-bg-main)' }} onClick={() => sendMessage('Connect to customer care')}>🎫 Customer Care</button>
      <button className="btn btn-outline" style={{ justifyContent: 'flex-start', background: 'var(--color-bg-main)' }} onClick={() => sendMessage('Manage cards')}>💳 Manage Cards</button>
    </div>
  );
};

export const FallbackWidget = () => {
  const { sendMessage } = useChat();
  return (
    <div className="banking-widget" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => sendMessage('Connect me to Customer Care')}>Yes, Connect Me</button>
        <button className="btn btn-outline" style={{ background: 'var(--color-bg-main)' }} onClick={() => sendMessage('No, I\'ll Retry')}>No, I'll Retry</button>
      </div>
    </div>
  );
};

export const WidgetRenderer = ({ type, data }: { type: string; data: any }) => {
  switch (type) {
    case 'transfer_summary': return <TransferWidget data={data} />;
    case 'card_controls': return <CardControlsWidget data={data} />;
    case 'success_status': return <SuccessStatusWidget data={data} />;
    case 'transaction_list': return <TransactionListWidget data={data} />;
    case 'kyc_status': return <KYCStatusWidget />;
    case 'autopay_summary': return <AutopayWidget data={data} />;
    case 'autopay_list': return <AutopayListWidget data={data} />;
    case 'contact_selection': return <ContactSelectionWidget data={data} />;
    case 'support_ticket': return <SupportTicketWidget />;
    case 'welcome_actions': return <WelcomeActionsWidget />;
    case 'fallback_widget': return <FallbackWidget />;
    default: return null;
  }
};
