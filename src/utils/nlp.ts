import { mockBeneficiaries, mockCards, mockAccount, mockAutopays } from '../data/mockData';

export type Intent = 'transfer' | 'block_card' | 'kyc' | 'support' | 'autopay' | 'balance' | 'show_cards' | 'unknown';

export interface ParsedInput {
  intent: Intent;
  entities: Record<string, any>;
}

// Simple typo mapping
const typoMap: Record<string, string> = {
  'suhni': 'suhani',
  'autpay': 'autopay',
  'balnce': 'balance',
  'blok': 'block',
  'updte': 'update'
};

function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();
  
  // Apply typo corrections
  Object.keys(typoMap).forEach(typo => {
    normalized = normalized.replace(new RegExp(`\\b${typo}\\b`, 'g'), typoMap[typo]);
  });
  
  // Replace "five hundred" with "500" etc.
  normalized = normalized.replace(/five hundred/g, '500');
  normalized = normalized.replace(/one thousand/g, '1000');
  normalized = normalized.replace(/fifty/g, '50');
  
  return normalized;
}

export function parseUserInput(text: string): ParsedInput {
  const lowerText = normalizeText(text);
  const result: ParsedInput = { intent: 'unknown', entities: {} };

  // Always attempt to extract amount
  const amountMatch = lowerText.match(/(?:₹|rs\.?|rupees?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:rs|rupees)?/i);
  if (amountMatch) {
      result.entities.amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);
  }

  // 1. Exact match in the mock database (highest priority)
  const exactMatch = mockBeneficiaries.find(b => lowerText.includes(b.name.toLowerCase()));
  
  if (exactMatch) {
    result.entities.beneficiaryId = exactMatch.id;
    result.entities.beneficiaryName = exactMatch.name;
    result.entities.beneficiaryObj = exactMatch;
  } else {
    // 2. Fuzzy matching if no exact match
    const words = lowerText.split(/[\s,]+/);
    const benMatches = mockBeneficiaries.filter(b => {
      const nameParts = b.name.toLowerCase().split(' ');
      return nameParts.some(part => words.includes(part) || words.some(w => part.includes(w) && w.length >= 4));
    });

    if (benMatches.length > 0) {
      if (benMatches.length === 1) {
        result.entities.beneficiaryId = benMatches[0].id;
        result.entities.beneficiaryName = benMatches[0].name;
        result.entities.beneficiaryObj = benMatches[0];
      } else {
        result.entities.multipleBeneficiaries = benMatches;
      }
    }
  }

  // Balance intent
  if (lowerText.includes('balance') || lowerText.includes('how much money')) {
    result.intent = 'balance';
    return result;
  }

  // Active Cards intent
  if (lowerText.includes('show my cards') || lowerText.includes('active cards') || lowerText.includes('my debit card') || lowerText.includes('my credit card')) {
    result.intent = 'show_cards';
    return result;
  }

  // Block card intent
  if (lowerText.includes('block') || lowerText.includes('freeze') || lowerText.includes('lost')) {
    result.intent = 'block_card';
    if (lowerText.includes('debit')) result.entities.cardType = 'Debit';
    if (lowerText.includes('credit')) result.entities.cardType = 'Credit';
    return result;
  }

  // Autopay intent
  if (lowerText.includes('autopay') || lowerText.includes('recurring') || lowerText.includes('subscription') || lowerText.includes('mandate')) {
    result.intent = 'autopay';
    if (lowerText.includes('netflix')) result.entities.merchant = 'Netflix';
    else if (lowerText.includes('show') || lowerText.includes('my')) result.entities.listAll = true;
    return result;
  }

  // Transfer intent
  if (lowerText.includes('send') || lowerText.includes('transfer') || lowerText.includes('pay') || lowerText.includes('give')) {
    result.intent = 'transfer';
    return result;
  }

  // Support / Dispute intent
  if (lowerText.includes('failed') || lowerText.includes('deducted') || lowerText.includes('issue') || lowerText.includes('human') || lowerText.includes('agent') || lowerText.includes('customer care') || lowerText.includes('support') || lowerText.includes('talk') || lowerText.includes('call') || lowerText.includes('complaint')) {
    result.intent = 'support';
    if (lowerText.includes('human') || lowerText.includes('agent') || lowerText.includes('customer care') || lowerText.includes('support') || lowerText.includes('talk') || lowerText.includes('call') || lowerText.includes('complaint')) {
      result.entities.escalate = true;
    }
    return result;
  }
  
  // KYC intent
  if (lowerText.includes('kyc') || lowerText.includes('aadhaar') || lowerText.includes('address')) {
    result.intent = 'kyc';
    return result;
  }

  // If there's an amount or a beneficiary detected, we assume it might be related to a pending transfer
  // We keep intent as 'unknown' so it merges with context
  return result;
}

export function generateBotResponse(
  parsed: ParsedInput, 
  contextData: any,
  rawText: string
): { text: string; widget?: any; widgetData?: any; updatedContext: any } {
  
  let { intent, entities } = parsed;
  let updatedContext = { ...contextData };

  // Handling interruptions: if a new explicit intent is detected, push current to stack, unless it's unknown
  if (intent !== 'unknown' && intent !== updatedContext.intent && updatedContext.intent) {
    if (!updatedContext.stack) updatedContext.stack = [];
    updatedContext.stack.push({ intent: updatedContext.intent, entities: { ...updatedContext.entities } });
    updatedContext.intent = intent;
    updatedContext.entities = { ...entities };
  } else if (intent === 'unknown' && updatedContext.intent) {
    // If unknown intent but we have context, merge entities (slot filling)
    intent = updatedContext.intent;
    
    // Check if they clarified from a multiple choice list
    if (updatedContext.entities.multipleBeneficiaries) {
      const lowerRaw = rawText.toLowerCase().trim();
      const exactContextMatch = updatedContext.entities.multipleBeneficiaries.find((b: any) => 
         b.name.toLowerCase() === lowerRaw || lowerRaw.includes(b.name.toLowerCase()) || 
         lowerRaw === 'first one' && updatedContext.entities.multipleBeneficiaries.indexOf(b) === 0 ||
         lowerRaw === 'option 1' && updatedContext.entities.multipleBeneficiaries.indexOf(b) === 0 ||
         lowerRaw === 'option 2' && updatedContext.entities.multipleBeneficiaries.indexOf(b) === 1
      );
      
      if (exactContextMatch) {
        entities.beneficiaryId = exactContextMatch.id;
        entities.beneficiaryName = exactContextMatch.name;
        entities.beneficiaryObj = exactContextMatch;
        entities.multipleBeneficiaries = undefined; // Cleared!
      }
    }

    if (parsed.entities.beneficiaryName) {
       entities.multipleBeneficiaries = undefined; // They provided a specific one via exact match
    }

    entities = { ...updatedContext.entities, ...entities };
    updatedContext.entities = entities;
  } else if (intent !== 'unknown') {
    updatedContext.intent = intent;
    updatedContext.entities = { ...updatedContext.entities, ...entities };
    entities = updatedContext.entities;
  } else if (intent === 'unknown' && Object.keys(entities).length > 0 && !updatedContext.intent) {
     // Default to transfer if entities were detected out of the blue
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
      if (popped.intent === 'transfer') {
        resumeText = `\n\nWould you still like to proceed with your transfer?`;
      } else if (popped.intent === 'block_card') {
        resumeText = `\n\nReturning to your card blocking request...`;
      }
      return currentText + resumeText;
    }
    // Clear context if task is done and no stack
    updatedContext = { stack: [] };
    return currentText;
  };

  switch (intent) {
    case 'transfer':
      if (entities.amount && entities.amount > (updatedContext.balance ?? mockAccount.balance)) {
         return {
           text: `Insufficient balance.\n\nAvailable balance: ₹${(updatedContext.balance ?? mockAccount.balance).toLocaleString('en-IN')}\nRequested transfer: ₹${entities.amount.toLocaleString('en-IN')}\n\nWould you like to send a smaller amount or cancel?`,
           updatedContext: { ...updatedContext, entities: { ...entities, amount: null } } // Reset amount so user can input again
         };
      }

      if (entities.amount && entities.beneficiaryName) {
        return {
          text: `Confirm transfer details below.`,
          widget: 'transfer_summary',
          widgetData: { amount: entities.amount, beneficiary: mockBeneficiaries.find(b => b.id === entities.beneficiaryId) },
          updatedContext // Keep context active in case they interrupt before clicking confirm
        };
      } else if (entities.amount && entities.multipleBeneficiaries) {
        return { 
          text: `I found ${entities.multipleBeneficiaries.length} matching contacts. Please choose one:`, 
          widget: 'contact_selection',
          widgetData: { contacts: entities.multipleBeneficiaries, amount: entities.amount },
          updatedContext 
        };
      } else if (entities.amount) {
        return { text: `Who would you like to send ₹${entities.amount} to?`, updatedContext };
      } else if (entities.beneficiaryName) {
        return { text: `How much would you like to send to ${entities.beneficiaryName}?`, updatedContext };
      } else if (entities.multipleBeneficiaries) {
        return { 
          text: `I found ${entities.multipleBeneficiaries.length} matching contacts. Please choose one:`, 
          widget: 'contact_selection',
          widgetData: { contacts: entities.multipleBeneficiaries },
          updatedContext 
        };
      }
      return { text: 'Who would you like to send money to, and how much?', updatedContext };

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
      if (updatedContext.kycDone) {
        return { text: checkStackForResume('Your KYC has already been successfully updated and is currently under review.'), updatedContext };
      }
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
          // Extracted an entity but no intent.
          return { text: "I captured that, but I'm not sure what you want to do with it. Try saying 'Send money' or 'Block card'.", updatedContext };
      }
      return {
        text: "I didn't quite catch that. You can ask me to send money, show autopays, or check your balance.",
        updatedContext
      };
  }
}
