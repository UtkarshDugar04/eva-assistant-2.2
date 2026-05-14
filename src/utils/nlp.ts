import { mockBeneficiaries, mockCards, mockAccount, mockAutopays } from '../data/mockData';

export type Intent = 'transfer' | 'block_card' | 'kyc' | 'support' | 'autopay' | 'balance' | 'show_cards' | 'unknown' | 'cancel' | 'pay_bill';

export interface ParsedInput {
  intent: Intent;
  entities: Record<string, any>;
  isCorrection?: boolean;
}

// Typo mapping & synonyms
const typoMap: Record<string, string> = {
  'suhni': 'suhani',
  'suhaani': 'suhani',
  'rahool': 'rahul',
  'prya': 'priya',
  'autpay': 'autopay',
  'balnce': 'balance',
  'blok': 'block',
  'updte': 'update',
  'bhejo': 'send',
  'karo': 'do',
  'karna hai': 'do',
  'ko': 'to',
  'paanch': '5',
  'hazaar': 'thousand',
  'lac': 'lakh'
};

function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();
  
  // Apply typo corrections
  Object.keys(typoMap).forEach(typo => {
    normalized = normalized.replace(new RegExp(`\\b${typo}\\b`, 'g'), typoMap[typo]);
  });
  
  // Replace text numbers
  normalized = normalized.replace(/\b(?:one|1)\s*thousand\b/g, '1000');
  normalized = normalized.replace(/\b(?:two|2)\s*thousand\b/g, '2000');
  normalized = normalized.replace(/\b(?:five|5)\s*thousand\b/g, '5000');
  normalized = normalized.replace(/\b(\d+)\s*k\b/g, (_, num) => String(parseInt(num) * 1000));
  normalized = normalized.replace(/\b(\d+)\s*lakh\b/g, (_, num) => String(parseInt(num) * 100000));
  normalized = normalized.replace(/\bfifty\b/g, '50');
  
  return normalized;
}

// Basic Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

export function parseUserInput(text: string): ParsedInput {
  const lowerText = normalizeText(text);
  const result: ParsedInput = { intent: 'unknown', entities: {} };

  // 1. Correction Signals
  if (/\b(actually|no|instead|wait|sorry|correction)\b/i.test(lowerText)) {
    result.isCorrection = true;
  }

  // 2. Cancellation
  if (/\b(cancel|stop|abort|nevermind)\b/i.test(lowerText)) {
    result.intent = 'cancel';
    return result;
  }

  // 3. Amount Extraction (handles ₹1000, 1000, 5000 rs, etc.)
  const amountMatch = lowerText.match(/(?:₹|rs\.?|rupees?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs|rupees)?/i);
  if (amountMatch) {
      result.entities.amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);
  }

  // 4. Urgency & Method Extraction
  if (/\b(urgent|urgently|now|immediately|fast)\b/.test(lowerText)) result.entities.urgency = 'urgent';
  if (/\b(imps)\b/.test(lowerText)) result.entities.method = 'IMPS';
  if (/\b(neft)\b/.test(lowerText)) result.entities.method = 'NEFT';
  if (/\b(upi)\b/.test(lowerText)) result.entities.method = 'UPI';
  
  if (result.entities.urgency === 'urgent' && !result.entities.method) {
      result.entities.method = 'IMPS'; // Default urgent to IMPS
  }

  // 5. Beneficiary Extraction
  const words = lowerText.split(/[\s,]+/);
  let bestMatch = null;
  let bestDistance = Infinity;

  // Exact or fuzzy match on known beneficiaries
  const benMatches = mockBeneficiaries.filter(b => {
    const nameParts = b.name.toLowerCase().split(' ');
    const cleanWords = words.filter(w => !['send', 'transfer', 'pay', 'to', 'ko', 'rupees', 'rs', 'imps', 'neft', 'upi', 'bhejna', 'hai'].includes(w) && isNaN(Number(w)));
    
    let isMatch = false;
    for (const part of nameParts) {
       for (const word of cleanWords) {
           if (word.length >= 3) {
               const dist = levenshtein(part, word);
               if (dist <= 2 || part.includes(word)) {
                   isMatch = true;
                   if (dist < bestDistance) {
                       bestDistance = dist;
                       bestMatch = b;
                   }
               }
           }
       }
    }
    return isMatch;
  });

  if (benMatches.length > 0) {
    if (benMatches.length === 1 || (bestDistance <= 1 && bestMatch)) {
      const match = bestDistance <= 1 && bestMatch ? bestMatch : benMatches[0];
      result.entities.beneficiaryId = match.id;
      result.entities.beneficiaryName = match.name;
      result.entities.beneficiaryObj = match;
    } else {
      result.entities.multipleBeneficiaries = benMatches;
    }
  } else {
     // Check for new beneficiary
     const toMatch = lowerText.match(/(?:to|ko|pay)\s+([a-z]+)/i);
     if (toMatch && !['my', 'the', 'bill', 'credit'].includes(toMatch[1])) {
         result.entities.newBeneficiaryName = toMatch[1].charAt(0).toUpperCase() + toMatch[1].slice(1);
     }
  }

  // 6. Intent Classification
  if (/\b(balance|how much money|kitna paisa)\b/.test(lowerText)) {
    result.intent = 'balance';
    return result;
  }
  if (/\b(show my cards|active cards|debit card|credit card list)\b/.test(lowerText)) {
    result.intent = 'show_cards';
    return result;
  }
  if (/\b(block|freeze|lost)\b/.test(lowerText)) {
    result.intent = 'block_card';
    if (lowerText.includes('debit')) result.entities.cardType = 'Debit';
    if (lowerText.includes('credit')) result.entities.cardType = 'Credit';
    return result;
  }
  if (/\b(bill|electricity|water|recharge)\b/.test(lowerText)) {
    result.intent = 'pay_bill';
    if (lowerText.includes('electricity')) result.entities.biller = 'Electricity';
    if (lowerText.includes('credit card')) result.entities.biller = 'Credit Card';
    return result;
  }
  if (/\b(autopay|recurring|subscription|mandate)\b/.test(lowerText)) {
    result.intent = 'autopay';
    if (lowerText.includes('netflix')) result.entities.merchant = 'Netflix';
    else if (lowerText.includes('show') || lowerText.includes('my')) result.entities.listAll = true;
    return result;
  }
  if (/\b(send|transfer|pay|give|bhejna|bhejo|ko|settle|owe)\b/.test(lowerText) && result.intent !== 'pay_bill') {
    result.intent = 'transfer';
    return result;
  }
  if (/\b(failed|deducted|issue|human|agent|customer care|support|talk|call|complaint)\b/.test(lowerText)) {
    result.intent = 'support';
    if (/\b(human|agent|customer care|support|talk|call|complaint)\b/.test(lowerText)) {
      result.entities.escalate = true;
    }
    return result;
  }
  if (/\b(kyc|aadhaar|address)\b/.test(lowerText)) {
    result.intent = 'kyc';
    return result;
  }

  // Fallback
  if (result.entities.amount || result.entities.beneficiaryName || result.entities.newBeneficiaryName) {
      result.intent = 'unknown'; 
  }

  return result;
}

export function generateBotResponse(
  parsed: ParsedInput, 
  contextData: any,
  rawText: string
): { text: string; widget?: any; widgetData?: any; updatedContext: any } {
  
  let { intent, entities, isCorrection } = parsed;
  let updatedContext = { ...contextData };

  if (intent === 'cancel') {
     return { text: "No problem, I've cancelled that request. What else can I help you with?", updatedContext: { ...updatedContext, intent: null, entities: {} } };
  }

  if (isCorrection && updatedContext.intent) {
      entities = { ...updatedContext.entities, ...entities };
      intent = updatedContext.intent;
      updatedContext.entities = entities;
  } else if (intent !== 'unknown' && intent !== updatedContext.intent && updatedContext.intent) {
    if (!updatedContext.stack) updatedContext.stack = [];
    updatedContext.stack.push({ intent: updatedContext.intent, entities: { ...updatedContext.entities } });
    updatedContext.intent = intent;
    updatedContext.entities = { ...entities };
  } else if (intent === 'unknown' && updatedContext.intent) {
    intent = updatedContext.intent;
    if (updatedContext.entities.multipleBeneficiaries) {
      const lowerRaw = rawText.toLowerCase().trim();
      const exactContextMatch = updatedContext.entities.multipleBeneficiaries.find((b: any) => 
         b.name.toLowerCase() === lowerRaw || lowerRaw.includes(b.name.toLowerCase()) || 
         (lowerRaw === 'first one' || lowerRaw === 'option 1' || lowerRaw === '1') && updatedContext.entities.multipleBeneficiaries.indexOf(b) === 0 ||
         (lowerRaw === 'option 2' || lowerRaw === '2') && updatedContext.entities.multipleBeneficiaries.indexOf(b) === 1
      );
      if (exactContextMatch) {
        entities.beneficiaryId = exactContextMatch.id;
        entities.beneficiaryName = exactContextMatch.name;
        entities.beneficiaryObj = exactContextMatch;
        entities.multipleBeneficiaries = undefined;
      }
    }
    if (parsed.entities.beneficiaryName || parsed.entities.newBeneficiaryName) {
       entities.multipleBeneficiaries = undefined; 
    }
    entities = { ...updatedContext.entities, ...entities };
    updatedContext.entities = entities;
  } else if (intent !== 'unknown') {
    updatedContext.intent = intent;
    updatedContext.entities = { ...updatedContext.entities, ...entities };
    entities = updatedContext.entities;
  } else if (intent === 'unknown' && Object.keys(entities).length > 0 && !updatedContext.intent) {
     intent = 'transfer';
     updatedContext.intent = 'transfer';
     updatedContext.entities = { ...entities };
  }

  const checkStackForResume = (currentText: string) => {
    if (updatedContext.stack && updatedContext.stack.length > 0) {
      const popped = updatedContext.stack.pop();
      updatedContext.intent = popped.intent;
      updatedContext.entities = popped.entities;
      let resumeText = '';
      if (popped.intent === 'transfer') resumeText = `\n\nWould you still like to proceed with your transfer?`;
      else if (popped.intent === 'block_card') resumeText = `\n\nReturning to your card blocking request...`;
      return currentText + resumeText;
    }
    updatedContext = { ...updatedContext, intent: null, entities: {} };
    return currentText;
  };

  switch (intent) {
    case 'transfer':
      if (entities.amount && entities.amount > (updatedContext.balance ?? mockAccount.balance)) {
         return {
           text: `Your available balance is ₹${(updatedContext.balance ?? mockAccount.balance).toLocaleString('en-IN')}. Would you like to send a lower amount or use another account?`,
           updatedContext: { ...updatedContext, entities: { ...entities, amount: null } }
         };
      }

      if (entities.amount && (entities.beneficiaryName || entities.newBeneficiaryName)) {
        if (entities.newBeneficiaryName && !entities.beneficiaryName) {
            return {
                text: `I don't see ${entities.newBeneficiaryName} saved. How would you like to find them?`,
                widget: 'new_beneficiary_options',
                widgetData: { name: entities.newBeneficiaryName, amount: entities.amount },
                updatedContext
            };
        }

        const methodStr = entities.method ? ` through ${entities.method}` : '';
        const prefix = isCorrection ? 'Got it, updated.' : 'Got it —';
        return {
          text: `${prefix} You are sending ₹${entities.amount.toLocaleString('en-IN')} to ${entities.beneficiaryName}${methodStr} from Savings Account ending ${mockAccount.numberEnding}.`,
          widget: 'transfer_summary',
          widgetData: { amount: entities.amount, beneficiary: mockBeneficiaries.find(b => b.id === entities.beneficiaryId), method: entities.method || 'IMPS' },
          updatedContext 
        };
      } else if (entities.amount && entities.multipleBeneficiaries) {
        return { 
          text: `I found ${entities.multipleBeneficiaries.length} ${entities.multipleBeneficiaries[0].name.split(' ')[0]}s. Which one would you like?`, 
          widget: 'contact_selection',
          widgetData: { contacts: entities.multipleBeneficiaries, amount: entities.amount },
          updatedContext 
        };
      } else if (entities.amount) {
        return { text: `Who would you like to send ₹${entities.amount.toLocaleString('en-IN')} to?`, updatedContext };
      } else if (entities.beneficiaryName) {
        return { text: `Sure, how much would you like to send to ${entities.beneficiaryName}?`, updatedContext };
      } else if (entities.multipleBeneficiaries) {
        return { 
          text: `I found ${entities.multipleBeneficiaries.length} matches. Which one would you like?`, 
          widget: 'contact_selection',
          widgetData: { contacts: entities.multipleBeneficiaries },
          updatedContext 
        };
      } else if (entities.newBeneficiaryName) {
        return {
           text: `I don't have ${entities.newBeneficiaryName} saved. Would you like to find them using mobile number, UPI ID, or account number?`,
           widget: 'new_beneficiary_options',
           widgetData: { name: entities.newBeneficiaryName },
           updatedContext
        };
      }
      return { text: 'I can help with that. Who would you like to pay?', updatedContext };

    case 'block_card':
      const cardTypeStr = entities.cardType ? entities.cardType + ' ' : '';
      return {
        text: `I understand you want to block a ${cardTypeStr}card. Which card should I block?`,
        widget: 'card_controls',
        widgetData: { cards: updatedContext.cards ?? mockCards, filterType: entities.cardType },
        updatedContext
      };

    case 'show_cards':
      return {
        text: checkStackForResume('Here are your active cards.'),
        widget: 'card_controls', 
        widgetData: { cards: updatedContext.cards ?? mockCards, viewOnly: true },
        updatedContext
      };

    case 'autopay':
      if (entities.listAll || !entities.merchant) {
        return {
          text: checkStackForResume('Here are your autopay mandates.'),
          widget: 'autopay_list',
          widgetData: { mandates: updatedContext.autopays ?? mockAutopays },
          updatedContext
        };
      }
      return {
        text: `Let's set up an autopay for ${entities.merchant}.`,
        widget: 'autopay_summary',
        widgetData: { merchant: entities.merchant },
        updatedContext
      };

    case 'kyc':
      return {
        text: 'I can help you update your KYC. We will need to verify your Aadhaar via OTP. Would you like to proceed?',
        widget: 'kyc_status',
        updatedContext
      };

    case 'support':
      if (entities.escalate) {
        return {
          text: checkStackForResume('Connecting you to HDFC Customer Care.'),
          widget: 'support_ticket',
          updatedContext
        };
      }
      return {
        text: checkStackForResume('I see you have an issue. Here are your recent transactions. Please select the one you have an issue with.'),
        widget: 'transaction_list',
        updatedContext
      };

    case 'balance':
      return {
        text: checkStackForResume(`Your current Savings Account balance is ₹${(updatedContext.balance ?? mockAccount.balance).toLocaleString('en-IN')}.`),
        updatedContext
      };

    default:
      if (Object.keys(entities).length > 0) {
          return { text: "I captured that, but I'm not sure what you want to do with it. Try saying 'Send money' or 'Block card'.", updatedContext };
      }
      return {
        text: "I didn't quite catch that. You can ask me to send money, show autopays, or check your balance.",
        updatedContext
      };
  }
}
