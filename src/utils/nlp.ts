import { mockBeneficiaries, mockAccounts } from '../data/mockData';

export type Intent = 'transfer' | 'block_card' | 'kyc' | 'support' | 'autopay' | 'balance' | 'show_cards' | 'unknown' | 'cancel' | 'pay_bill' | 'faq';

export interface ParsedInput {
  intent: Intent;
  entities: Record<string, any>;
  isCorrection?: boolean;
}

const protectedKeywords = [
  'transfer', 'money', 'payment', 'pay', 'send', 'funds', 'amount', 'bank', 'account', 'transaction', 'rupees', 'rs', 'cash', 'remit', 'deposit', 'move', 'give', 'settle', 'owe'
];

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
  'sau': '100',
  'hazaar': 'thousand',
  'lac': 'lakh'
};

function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();
  Object.keys(typoMap).forEach(typo => {
    normalized = normalized.replace(new RegExp(`\\b${typo}\\b`, 'g'), typoMap[typo]);
  });
  normalized = normalized.replace(/\b(?:one|1)\s*thousand\b/g, '1000');
  normalized = normalized.replace(/\b(?:two|2)\s*thousand\b/g, '2000');
  normalized = normalized.replace(/\b(?:five|5)\s*thousand\b/g, '5000');
  normalized = normalized.replace(/\b(\d+)\s*k\b/g, (_, num) => String(parseInt(num) * 1000));
  normalized = normalized.replace(/\b(\d+)\s*lakh\b/g, (_, num) => String(parseInt(num) * 100000));
  return normalized;
}

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

  if (/\b(actually|no|instead|wait|sorry|correction)\b/i.test(lowerText)) {
    result.isCorrection = true;
  }

  if (/\b(cancel|stop|abort|nevermind|leave it)\b/i.test(lowerText)) {
    result.intent = 'cancel';
    return result;
  }

  if (/\b(charges|fee|cost)\b/i.test(lowerText)) result.entities.faq = 'charges';
  if (/\b(how long|eta|time)\b/i.test(lowerText)) result.entities.faq = 'eta';

  const amountMatch = lowerText.match(/(?:₹|rs\.?|rupees?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs|rupees)?/i);
  if (amountMatch) {
      result.entities.amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);
  }

  const mobileMatch = lowerText.match(/\b([6-9]\d{9})\b/);
  if (mobileMatch) result.entities.mobile = mobileMatch[1];

  const upiMatch = lowerText.match(/\b([\w.-]+@[\w.-]+)\b/);
  if (upiMatch) result.entities.upi = upiMatch[1];

  const acctMatch = lowerText.match(/\b(?:account|acct)?\s*(\d{9,18})\b/i);
  if (acctMatch && !mobileMatch) result.entities.account = acctMatch[1];

  if (/\b(urgent|urgently|now|fast|fastest)\b/.test(lowerText)) result.entities.urgency = 'urgent';
  if (/\b(imps)\b/.test(lowerText)) result.entities.method = 'IMPS';
  if (/\b(neft|cheapest)\b/.test(lowerText)) result.entities.method = 'NEFT';
  if (/\b(upi)\b/.test(lowerText)) result.entities.method = 'UPI';

  const words = lowerText.split(/[\s,]+/);
  let bestDistance = Infinity;

  const benMatches = mockBeneficiaries.filter(b => {
    const nameParts = b.name.toLowerCase().split(' ');
    const cleanWords = words.filter(w => !protectedKeywords.includes(w) && !['to', 'ko', 'hai', 'salary', 'savings', 'current'].includes(w) && isNaN(Number(w)) && !w.includes('@'));
    let isMatch = false;
    for (const part of nameParts) {
       for (const word of cleanWords) {
           if (word.length >= 3) {
               const dist = levenshtein(part, word);
               if (dist <= 2 || part.includes(word)) {
                   isMatch = true;
                   if (dist < bestDistance) {
                       bestDistance = dist;
                   }
               }
           }
       }
    }
    return isMatch;
  });

  if (benMatches.length > 0) {
    if (benMatches.length === 1 || bestDistance <= 1) {
      result.entities.beneficiary = benMatches[0];
    } else {
      result.entities.multipleBeneficiaries = benMatches;
    }
  } else {
     const toMatch = lowerText.match(/(?:to|ko|pay|recipient|name)\s+([a-z]+)/i);
     if (toMatch && !protectedKeywords.includes(toMatch[1])) {
         result.entities.newBeneficiaryName = toMatch[1].charAt(0).toUpperCase() + toMatch[1].slice(1);
     } else if (words.length === 1 && !protectedKeywords.includes(words[0]) && isNaN(Number(words[0])) && words[0].length > 2) {
         result.entities.potentialName = words[0].charAt(0).toUpperCase() + words[0].slice(1);
     }
  }

  if (/\b(salary)\b/.test(lowerText)) result.entities.sourceAccount = 'Salary';
  if (/\b(savings)\b/.test(lowerText)) result.entities.sourceAccount = 'Savings';
  if (/\b(current)\b/.test(lowerText)) result.entities.sourceAccount = 'Current';

  if (/\b(balance|money|funds)\b/.test(lowerText) && !/\b(transfer|send|pay)\b/.test(lowerText)) {
    result.intent = 'balance';
    return result;
  }
  if (/\b(send|transfer|pay|give|bhejna|bhejo|ko|settle|owe|remit|payment|move)\b/.test(lowerText) && result.intent !== 'pay_bill') {
    result.intent = 'transfer';
    return result;
  }
  if (/\b(block|freeze|lost)\b/.test(lowerText)) {
    result.intent = 'block_card';
    return result;
  }
  if (/\b(kyc|aadhaar)\b/.test(lowerText)) {
    result.intent = 'kyc';
    return result;
  }

  if (Object.keys(result.entities).length > 0) {
      result.intent = 'unknown'; 
  }

  return result;
}

export function generateBotResponse(
  parsed: ParsedInput, 
  contextData: any,
  rawText: string
): { text: string; widget?: any; widgetData?: any; updatedContext: any } {
  
  let { intent, entities } = parsed;
  let updatedContext = { ...contextData };

  if (!updatedContext.transfer) {
     updatedContext.transfer = {
        recipient: null,
        amount: null,
        method: 'IMPS',
        sourceAccount: 'Savings',
        stage: 'start',
        entities: {}
     };
  }

  if (intent === 'cancel') {
     updatedContext.transfer = null;
     updatedContext.intent = null;
     return { text: "Transfer cancelled. No money has been sent. How else can I help?", updatedContext };
  }

  const lowerRaw = rawText.toLowerCase().trim();

  // EXPLICIT ACTION HANDLERS
  if (lowerRaw.includes('change method')) {
      return {
          text: "Choose your preferred payment method.",
          widget: 'method_selection',
          widgetData: updatedContext.transfer,
          updatedContext
      };
  }
  if (lowerRaw.includes('change account')) {
      return {
          text: "Choose the account you want to pay from.",
          widget: 'account_selection',
          widgetData: updatedContext.transfer,
          updatedContext
      };
  }
  if (lowerRaw.includes('change recipient')) {
      updatedContext.transfer.recipient = null;
      updatedContext.transfer.stage = 'start';
      return { text: "Who would you like to send money to?", updatedContext };
  }

  const isTransferring = updatedContext.intent === 'transfer' || intent === 'transfer' || (intent === 'unknown' && updatedContext.intent === 'transfer');

  if (isTransferring) {
      const originalIntent = intent;
      intent = 'transfer';
      updatedContext.intent = 'transfer';
      
      const t = updatedContext.transfer;

      if (entities.amount) t.amount = entities.amount;
      if (entities.method) t.method = entities.method;
      if (entities.sourceAccount) t.sourceAccount = entities.sourceAccount;
      if (entities.beneficiary) {
          t.recipient = entities.beneficiary;
          t.stage = 'confirm_recipient';
      } else if (entities.newBeneficiaryName || entities.potentialName) {
          const name = entities.newBeneficiaryName || entities.potentialName;
          t.recipient = { name, isNew: true };
          t.stage = 'verify_new_recipient';
      } else if (entities.multipleBeneficiaries) {
          t.multipleBeneficiaries = entities.multipleBeneficiaries;
          t.stage = 'disambiguate_recipient';
      }
      
      if (entities.mobile || entities.upi || entities.account) {
          t.recipient = { 
            ...t.recipient,
            mobile: entities.mobile, 
            upi: entities.upi, 
            account: entities.account,
            isNew: true 
          };
          t.stage = 'confirm_recipient';
      }

      if (t.stage === 'disambiguate_recipient' && (originalIntent === 'unknown' || originalIntent === 'transfer')) {
         const match = t.multipleBeneficiaries?.find((b: any) => 
            b.name.toLowerCase() === lowerRaw || lowerRaw.includes(b.name.toLowerCase()) || 
            (lowerRaw === '1' || lowerRaw === 'first') && t.multipleBeneficiaries.indexOf(b) === 0
         );
         if (match) {
            t.recipient = match;
            t.multipleBeneficiaries = null;
            t.stage = 'confirm_recipient';
         } else if (/\b(neither|none|other|new)\b/i.test(lowerRaw)) {
            t.stage = 'new_beneficiary_lookup';
         }
      }

      if (t.stage === 'disambiguate_recipient') {
         return {
           text: `I found multiple beneficiaries named ${t.multipleBeneficiaries[0].name.split(' ')[0]}. Please choose.`,
           widget: 'contact_selection',
           widgetData: { contacts: t.multipleBeneficiaries, amount: t.amount },
           updatedContext
         };
      }

      if (!t.recipient) {
         return { text: "Sure — who would you like to send money to?", updatedContext };
      }

      if (t.stage === 'verify_new_recipient' || t.stage === 'new_beneficiary_lookup') {
          return {
              text: `I couldn't find ${t.recipient.name} in your saved beneficiaries. How would you like to find them?`,
              widget: 'new_beneficiary_options',
              widgetData: { name: t.recipient.name, amount: t.amount },
              updatedContext
          };
      }

      if (!t.amount) {
         return { text: `How much would you like to send to ${t.recipient.name}?`, updatedContext };
      }

      const currentBalance = mockAccounts.find(a => a.type === t.sourceAccount)?.balance || 0;
      if (t.amount > currentBalance) {
         const oldAmount = t.amount;
         t.amount = null;
         return {
           text: `Your available balance in ${t.sourceAccount} is ₹${currentBalance.toLocaleString('en-IN')}. Please choose a lower amount than ₹${oldAmount.toLocaleString('en-IN')} or use another account.`,
           updatedContext
         };
      }

      return {
         text: "Please review the transfer details before confirming.",
         widget: 'transfer_summary',
         widgetData: {
            amount: t.amount,
            beneficiary: t.recipient,
            method: t.method,
            sourceAccount: t.sourceAccount,
            arrival: t.method === 'NEFT' ? '~ 30 Mins' : 'Instant'
         },
         updatedContext
      };
  }

  if (intent === 'balance') {
     return { text: `Your Savings Account balance is ₹${mockAccounts[0].balance.toLocaleString('en-IN')}.`, updatedContext };
  }

  return {
    text: "I'm not sure about that. Did you mean to change the payment method, amount, or recipient?",
    updatedContext
  };
}
