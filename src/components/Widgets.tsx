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
      setContextData((prev: any) => ({
        ...prev,
        transactionFinished: true
      }));
    }
  };

  if (status === 'success') {
     return (
        <div className="banking-widget success-receipt fade-in">
           <div className="widget-content" style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
              <CheckCircle2 size={48} color="var(--color-success)" style={{ margin: '0 auto var(--spacing-md)' }} />
              <h3 style={{ color: 'var(--color-success)' }}>Transfer Successful</h3>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: 'var(--spacing-sm) 0', color: 'var(--color-primary)' }}>₹{data.amount.toLocaleString('en-IN')}</div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>Sent to {data.beneficiary.name}</p>
              
              <div className="receipt-details" style={{ marginTop: 'var(--spacing-lg)', textAlign: 'left', borderTop: '1px dashed var(--color-border)', paddingTop: 'var(--spacing-md)' }}>
                 <div className="data-row"><span className="data-label">Ref ID</span><span className="data-value">HDFC{Math.floor(Math.random()*100000000)}</span></div>
                 <div className="data-row"><span className="data-label">Method</span><span className="data-value">{data.method}</span></div>
                 <div className="data-row"><span className="data-label">Date</span><span className="data-value">{new Date().toLocaleDateString()}</span></div>
              </div>
           </div>
           <div className="widget-footer" style={{ flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-primary btn-full" onClick={() => sendMessage('Done')}>Done</button>
              <button className="btn btn-outline btn-full" onClick={() => sendMessage('Share')}><Share2 size={18}/> Share Receipt</button>
           </div>
        </div>
     );
  }

  const selectedAcc = mockAccounts.find(a => a.id === data.sourceAccountId) || mockAccounts[0];

  return (
    <div className="banking-widget">
      <div className="widget-header">
        <span>Review Transfer</span>
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg" alt="HDFC" height="14" />
      </div>
      <div className="widget-content">
        <div style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
           <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-text-main)' }}>{data.beneficiary?.name}</div>
           <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{data.beneficiary?.bank || 'Verified Account'} •••• {data.beneficiary?.accountEnding || 'XXXX'}</div>
        </div>
        
        <div className="receipt-details" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div className="data-row">
              <span className="data-label">Amount</span>
              <span className="data-value amount">₹{data.amount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="data-row">
              <span className="data-label">From</span>
              <span className="data-value">{selectedAcc.type} •••• {selectedAcc.numberEnding}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Method</span>
              <span className="data-value">{data.method || 'IMPS'}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Arrival</span>
              <span className="data-value">{data.arrival || 'Instant'}</span>
            </div>
        </div>
      </div>
      
      {status === 'pending' && (
        <div className="widget-footer" style={{ flexDirection: 'column', gap: '10px' }}>
          <button className="btn btn-primary btn-full" style={{ height: '52px', fontSize: '1rem' }} onClick={handleConfirm}>Confirm & Authenticate <ArrowRight size={20} style={{marginLeft: '8px'}}/></button>
          <div className="summary-actions-grid">
            <button className="btn btn-outline" onClick={() => sendMessage('Change method')}>Change Method</button>
            <button className="btn btn-outline" onClick={() => sendMessage('Change account')}>Change Account</button>
          </div>
          <button className="btn" style={{ background: 'transparent', color: 'var(--color-secondary)', fontSize: '0.875rem' }} onClick={() => sendMessage('Cancel transfer')}>Cancel Transfer</button>
        </div>
      )}

      {status === 'authenticating' && (
        <div className="auth-overlay">
          <div className="auth-sheet">
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(0, 76, 143, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-md)' }}>
                <Lock size={28} color="var(--color-primary)" />
              </div>
              <h3 style={{ marginBottom: '4px' }}>Secure PIN Required</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>Authenticating ₹{data.amount?.toLocaleString('en-IN')} to {data.beneficiary?.name}</p>
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
            <button className="btn btn-full" style={{ marginTop: 'var(--spacing-lg)', color: 'var(--color-text-muted)' }} onClick={() => setStatus('pending')}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
};

export const MethodSelectionWidget = ({ data }: { data: any }) => {
  const { sendAction, contextData } = useChat();
  const methods = [
    { id: 'IMPS', icon: <Zap size={20} />, title: 'IMPS', desc: 'Instant bank transfer, 24x7. Best for urgent payments.', arrival: 'Instant' },
    { id: 'NEFT', icon: <Building2 size={20} />, title: 'NEFT', desc: 'Standard bank transfer. Good for regular payments.', arrival: '~ 30 Mins' }
  ];

  const handleSelect = (method: any) => {
    const updatedContext = {
      ...contextData,
      transfer: { ...contextData.transfer, method: method.id }
    };
    const widgetData = {
      ...updatedContext.transfer,
      beneficiary: updatedContext.transfer.recipient,
      arrival: method.arrival
    };
    sendAction(
      `Payment method changed to ${method.id}.`,
      updatedContext,
      'transfer_summary',
      widgetData
    );
  };

  return (
    <div className="banking-widget fade-in-up">
      <div className="widget-header">Select Payment Method</div>
      <div className="widget-content" style={{ padding: 0 }}>
        {methods.map(m => (
          <div key={m.id} className={`selection-card ${data.method === m.id ? 'active' : ''}`} onClick={() => handleSelect(m)}>
            <div className="selection-card-icon">{m.icon}</div>
            <div className="selection-card-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600 }}>{m.title}</span>
                {data.method === m.id && <span className="recommendation-badge">Active</span>}
              </div>
              <div className="selection-card-desc">{m.desc}</div>
            </div>
            {data.method === m.id && <CheckCircle2 size={20} color="var(--color-success)" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export const AccountSelectionWidget = ({ data }: { data: any }) => {
  const { sendAction, contextData } = useChat();
  
  const handleSelect = (account: any) => {
    const updatedContext = {
      ...contextData,
      transfer: { ...contextData.transfer, sourceAccountId: account.id }
    };
    const widgetData = {
      ...updatedContext.transfer,
      beneficiary: updatedContext.transfer.recipient,
      arrival: updatedContext.transfer.method === 'NEFT' ? '~ 30 Mins' : 'Instant'
    };
    sendAction(
      `Source account changed to ${account.type} •••• ${account.numberEnding}.`,
      updatedContext,
      'transfer_summary',
      widgetData
    );
  };

  return (
    <div className="banking-widget fade-in-up">
      <div className="widget-header">Select Source Account</div>
      <div className="widget-content" style={{ padding: 0 }}>
        {mockAccounts.map(acc => (
          <div key={acc.id} className={`selection-card ${data.sourceAccountId === acc.id ? 'active' : ''}`} onClick={() => handleSelect(acc)}>
            <div className="selection-card-icon"><CreditCard size={20} /></div>
            <div className="selection-card-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600 }}>{acc.type} •••• {acc.numberEnding}</span>
                {data.sourceAccountId === acc.id && <span className="recommendation-badge">Active</span>}
              </div>
              <div className="selection-card-desc">Bal: ₹{acc.balance.toLocaleString('en-IN')}</div>
            </div>
            {data.sourceAccountId === acc.id && <CheckCircle2 size={20} color="var(--color-success)" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ContactSelectionWidget = ({ data }: { data: any }) => {
  const { sendMessage, setContextData } = useChat();
  return (
    <div className="banking-widget fade-in-up">
      <div className="widget-header">Select Beneficiary</div>
      <div className="widget-content" style={{ padding: 0 }}>
        {data.contacts?.map((contact: any) => (
          <div key={contact.id} className="selection-card" onClick={() => {
            setContextData((prev: any) => ({
              ...prev,
              transfer: { ...prev.transfer, recipient: contact, multipleBeneficiaries: null, stage: 'confirm_recipient' }
            }));
            sendMessage(contact.name);
          }}>
            <div className="selection-card-icon" style={{ borderRadius: '50%', fontWeight: 700, backgroundColor: 'rgba(0, 76, 143, 0.1)' }}>{contact.name.charAt(0)}</div>
            <div className="selection-card-info">
              <div style={{ fontWeight: 600 }}>{contact.name}</div>
              <div className="selection-card-desc">{contact.bank} • {contact.phone || contact.accountEnding}</div>
            </div>
            <ChevronRight size={20} color="var(--color-text-muted)" />
          </div>
        ))}
        <div className="selection-card" style={{ backgroundColor: 'var(--color-bg-main)' }} onClick={() => sendMessage('Add new recipient')}>
           <div className="selection-card-icon" style={{ color: 'var(--color-primary)' }}>+</div>
           <div className="selection-card-info">
              <div style={{ fontWeight: 600 }}>New Beneficiary</div>
              <div className="selection-card-desc">Add manually or via mobile</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export const NewBeneficiaryOptionsWidget = ({ data }: { data: any }) => {
  const { sendMessage } = useChat();
  return (
    <div className="banking-widget fade-in-up">
      <div className="widget-header">Search for {data.name}</div>
      <div className="widget-content" style={{ padding: 0 }}>
         {[
           { id: 'mobile', icon: '📱', title: 'Mobile Number', desc: 'Find via bank-linked phone' },
           { id: 'upi', icon: '🔗', title: 'UPI ID', desc: 'Find via VPA (name@bank)' },
           { id: 'acct', icon: '🏦', title: 'Account Number', desc: 'Direct Account + IFSC' }
         ].map(opt => (
            <button key={opt.id} className="selection-card" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--color-border)' }} onClick={() => sendMessage(`Via ${opt.title}`)}>
              <div className="selection-card-icon" style={{ fontSize: '1.25rem' }}>{opt.icon}</div>
              <div className="selection-card-info">
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{opt.title}</div>
                  <div className="selection-card-desc">{opt.desc}</div>
              </div>
              <ChevronRight size={20} color="var(--color-text-muted)" />
            </button>
         ))}
      </div>
    </div>
  );
};

export const WelcomeActionsWidget = () => {
  const { sendMessage } = useChat();
  return (
    <div className="welcome-actions fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
      {[
        { label: 'Send Money', icon: '💸', text: 'Send money' },
        { label: 'Check Balance', icon: '🏦', text: 'Check balance' },
        { label: 'Customer Care', icon: '🎫', text: 'Support' }
      ].map(act => (
        <button key={act.label} className="btn btn-outline btn-full" style={{ justifyContent: 'flex-start', background: 'var(--color-bg-card)', padding: '16px' }} onClick={() => sendMessage(act.text)}>
            <span style={{ fontSize: '1.25rem', marginRight: '8px' }}>{act.icon}</span>
            <span style={{ flex: 1, textAlign: 'left' }}>{act.label}</span>
            <ChevronRight size={18} color="var(--color-text-muted)" />
        </button>
      ))}
    </div>
  );
};

export const SuccessStatusWidget = ({ data }: { data: any }) => {
  return (
    <div className="banking-widget fade-in-up" style={{ textAlign: 'center', padding: 'var(--spacing-xl) var(--spacing-lg)' }}>
      <CheckCircle2 size={64} color="var(--color-success)" style={{ margin: '0 auto var(--spacing-md)' }} />
      <h2 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-main)' }}>{data.title}</h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}>{data.message}</p>
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
