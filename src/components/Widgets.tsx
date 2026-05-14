import { useState } from 'react';
import { useChat } from '../store/ChatContext';
import { CheckCircle2, CreditCard, ChevronRight, Lock, Zap, Building2, Share2, ArrowRight } from 'lucide-react';
import { mockAccounts } from '../data/mockData';

export const TransferWidget = ({ data }: { data: any }) => {
  const { sendMessage, setContextData } = useChat();
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
          transfer: null, 
          intent: null,
          entities: {}
        }));
      }, 1500);
    }
  };

  if (status === 'success') {
     return (
        <div className="banking-widget success-receipt fade-in">
           <div className="widget-content" style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
              <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto var(--spacing-md)' }} />
              <h3 style={{ color: 'var(--color-success)' }}>Transfer Successful</h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: 'var(--spacing-sm) 0' }}>₹{data.amount.toLocaleString('en-IN')}</div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Sent to {data.beneficiary.name}</p>
              
              <div className="receipt-details" style={{ marginTop: 'var(--spacing-lg)', textAlign: 'left', borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
                 <div className="data-row"><span className="data-label">Ref ID</span><span className="data-value">HDFC{Math.floor(Math.random()*100000000)}</span></div>
                 <div className="data-row"><span className="data-label">Method</span><span className="data-value">{data.method}</span></div>
                 <div className="data-row"><span className="data-label">Date</span><span className="data-value">{new Date().toLocaleDateString()}</span></div>
              </div>
           </div>
           <div className="widget-footer" style={{ gap: '8px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }}><Share2 size={16}/> Share</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => sendMessage('Done')}>Done</button>
           </div>
        </div>
     );
  }

  return (
    <div className="banking-widget">
      <div className="widget-header">
        <span>Transfer Summary</span>
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg" alt="HDFC" height="16" />
      </div>
      <div className="widget-content">
        <div style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
           <div style={{ fontWeight: 600, fontSize: '1.25rem' }}>{data.beneficiary?.name}</div>
           <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{data.beneficiary?.bank || 'Verified Account'} •••• {data.beneficiary?.accountEnding || 'XXXX'}</div>
        </div>
        <div className="data-row">
          <span className="data-label">Method</span>
          <span className="data-value">{data.method || 'IMPS'}</span>
        </div>
        <div className="data-row">
          <span className="data-label">From Account</span>
          <span className="data-value">{data.sourceAccount || 'Savings'} •••• {mockAccounts.find(a => a.type === (data.sourceAccount || 'Savings'))?.numberEnding || '3122'}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Arrival</span>
          <span className="data-value">{data.arrival || 'Instant'}</span>
        </div>
        <div className="data-row" style={{ marginTop: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border)' }}>
          <span className="data-label">Amount</span>
          <span className="data-value amount" style={{ fontSize: '1.25rem' }}>₹{data.amount?.toLocaleString('en-IN')}</span>
        </div>
      </div>
      
      {status === 'pending' && (
        <div className="widget-footer" style={{ flexDirection: 'column', gap: '8px' }}>
          <div className="summary-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
            <button className="btn btn-outline" onClick={() => sendMessage('Change method')}>Change Method</button>
            <button className="btn btn-outline" onClick={() => sendMessage('Change account')}>Change Account</button>
          </div>
          <button className="btn btn-secondary btn-full" style={{ border: 'none', color: 'var(--color-primary)', fontWeight: 500 }} onClick={() => sendMessage('Cancel transfer')}>Cancel Transfer</button>
          <button className="btn btn-primary btn-full" style={{ height: '48px', fontSize: '1rem', marginTop: 'var(--spacing-xs)' }} onClick={handleConfirm}>Confirm & Authenticate <ArrowRight size={18} style={{marginLeft: '8px'}}/></button>
        </div>
      )}

      {status === 'authenticating' && (
        <div className="auth-overlay">
          <div className="auth-sheet">
            <div style={{ textAlign: 'center' }}>
              <Lock size={32} color="var(--color-primary)" />
              <h3 style={{ marginTop: 'var(--spacing-sm)' }}>Secure Authentication</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Enter MPIN to send ₹{data.amount?.toLocaleString('en-IN')} to {data.beneficiary?.name}</p>
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

export const MethodSelectionWidget = ({ data }: { data: any }) => {
  const { sendMessage, setContextData } = useChat();
  const methods = [
    { id: 'IMPS', icon: <Zap size={20} />, title: 'IMPS', desc: 'Instant bank transfer, available 24x7. Best for urgent payments.', arrival: 'Instant' },
    { id: 'NEFT', icon: <Building2 size={20} />, title: 'NEFT', desc: 'Standard bank transfer. Good for regular payments.', arrival: '~ 30 Mins' }
  ];

  const handleSelect = (method: any) => {
    setContextData((prev: any) => ({
      ...prev,
      transfer: { ...prev.transfer, method: method.id }
    }));
    sendMessage(`Use ${method.id}`);
  };

  return (
    <div className="banking-widget">
      <div className="widget-header">Choose Payment Method</div>
      <div className="widget-content" style={{ padding: 0 }}>
        {methods.map(m => (
          <div key={m.id} className={`selection-card ${data.method === m.id ? 'active' : ''}`} onClick={() => handleSelect(m)}>
            <div className="selection-card-icon">{m.icon}</div>
            <div className="selection-card-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>{m.title}</span>
                {data.method === m.id && <span className="recommendation-badge" style={{ backgroundColor: 'var(--color-primary)' }}>Currently Selected</span>}
              </div>
              <div className="selection-card-desc">{m.desc}</div>
            </div>
            {data.method === m.id && <CheckCircle2 size={18} color="var(--color-primary)" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export const AccountSelectionWidget = ({ data }: { data: any }) => {
  const { sendMessage, setContextData } = useChat();
  
  const handleSelect = (account: any) => {
    setContextData((prev: any) => ({
      ...prev,
      transfer: { ...prev.transfer, sourceAccount: account.type }
    }));
    sendMessage(`Use ${account.type} account`);
  };

  return (
    <div className="banking-widget">
      <div className="widget-header">Choose Account to Pay From</div>
      <div className="widget-content" style={{ padding: 0 }}>
        {mockAccounts.map(acc => (
          <div key={acc.id} className={`selection-card ${data.sourceAccount === acc.type ? 'active' : ''}`} onClick={() => handleSelect(acc)}>
            <div className="selection-card-icon"><CreditCard size={20} /></div>
            <div className="selection-card-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>{acc.type} •••• {acc.numberEnding}</span>
                {data.sourceAccount === acc.type && <span className="recommendation-badge" style={{ backgroundColor: 'var(--color-primary)' }}>Selected</span>}
              </div>
              <div className="selection-card-desc">Available Balance: ₹{acc.balance.toLocaleString('en-IN')}</div>
            </div>
            {data.sourceAccount === acc.type && <CheckCircle2 size={18} color="var(--color-primary)" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ContactSelectionWidget = ({ data }: { data: any }) => {
  const { sendMessage, setContextData } = useChat();
  return (
    <div className="banking-widget">
      <div className="widget-header">Select Recipient</div>
      <div className="widget-content" style={{ padding: 0 }}>
        {data.contacts?.map((contact: any) => (
          <div key={contact.id} className="selection-card" onClick={() => {
            setContextData((prev: any) => ({
              ...prev,
              transfer: { ...prev.transfer, recipient: contact, multipleBeneficiaries: null, stage: 'confirm_recipient' }
            }));
            sendMessage(contact.name);
          }}>
            <div className="selection-card-icon" style={{ borderRadius: '50%', fontWeight: 700 }}>{contact.name.charAt(0)}</div>
            <div className="selection-card-info">
              <div style={{ fontWeight: 600 }}>{contact.name}</div>
              <div className="selection-card-desc">{contact.bank} • {contact.phone || contact.accountEnding}</div>
            </div>
            <ChevronRight size={18} color="var(--color-text-muted)" />
          </div>
        ))}
        <div className="selection-card" style={{ backgroundColor: 'var(--color-bg-main)' }} onClick={() => sendMessage('Add new recipient')}>
           <div className="selection-card-icon" style={{ color: 'var(--color-primary)' }}>+</div>
           <div className="selection-card-info">
              <div style={{ fontWeight: 600 }}>None of these</div>
              <div className="selection-card-desc">Add a new beneficiary</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export const NewBeneficiaryOptionsWidget = ({ data }: { data: any }) => {
  const { sendMessage } = useChat();
  return (
    <div className="banking-widget">
      <div className="widget-header">How to find {data.name}?</div>
      <div className="widget-content" style={{ padding: 0 }}>
         <button className="selection-card" style={{ width: '100%', textAlign: 'left' }} onClick={() => sendMessage('Via Mobile Number')}>
           <div className="selection-card-icon">📱</div>
           <div className="selection-card-info">
              <div style={{ fontWeight: 600 }}>Mobile Number</div>
              <div className="selection-card-desc">Lookup by phone number linked to bank</div>
           </div>
           <ChevronRight size={18} color="var(--color-text-muted)" />
         </button>
         <button className="selection-card" style={{ width: '100%', textAlign: 'left' }} onClick={() => sendMessage('Via UPI ID')}>
           <div className="selection-card-icon">🔗</div>
           <div className="selection-card-info">
              <div style={{ fontWeight: 600 }}>UPI ID</div>
              <div className="selection-card-desc">Lookup by VPA (e.g. name@bank)</div>
           </div>
           <ChevronRight size={18} color="var(--color-text-muted)" />
         </button>
         <button className="selection-card" style={{ width: '100%', textAlign: 'left' }} onClick={() => sendMessage('Via Account Number')}>
           <div className="selection-card-icon">🏦</div>
           <div className="selection-card-info">
              <div style={{ fontWeight: 600 }}>Account Number + IFSC</div>
              <div className="selection-card-desc">Traditional bank details lookup</div>
           </div>
           <ChevronRight size={18} color="var(--color-text-muted)" />
         </button>
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
      <button className="btn btn-outline" style={{ justifyContent: 'flex-start', background: 'var(--color-bg-main)' }} onClick={() => sendMessage('Support')}>🎫 Customer Care</button>
    </div>
  );
};

export const SuccessStatusWidget = ({ data }: { data: any }) => {
  return (
    <div className="banking-widget" style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
      <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto var(--spacing-md)' }} />
      <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>{data.title}</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{data.message}</p>
    </div>
  );
};

export const WidgetRenderer = ({ type, data }: { type: string; data: any }) => {
  switch (type) {
    case 'transfer_summary': return <TransferWidget data={data} />;
    case 'success_status': return <SuccessStatusWidget data={data} />;
    case 'contact_selection': return <ContactSelectionWidget data={data} />;
    case 'welcome_actions': return <WelcomeActionsWidget />;
    case 'new_beneficiary_options': return <NewBeneficiaryOptionsWidget data={data} />;
    case 'method_selection': return <MethodSelectionWidget data={data} />;
    case 'account_selection': return <AccountSelectionWidget data={data} />;
    default: return null;
  }
};
