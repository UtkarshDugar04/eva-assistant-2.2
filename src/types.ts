export type MessageSender = 'user' | 'bot';

export type WidgetType = 'transfer_summary' | 'card_controls' | 'transaction_list' | 'kyc_status' | 'autopay_summary' | 'autopay_list' | 'auth_sheet' | 'success_status' | 'contact_selection' | 'support_ticket' | 'welcome_actions' | 'fallback_widget';

export interface Message {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  widget?: WidgetType;
  widgetData?: any;
}

export interface Beneficiary {
  id: string;
  name: string;
  accountEnding: string;
  bank: string;
  phone?: string;
}

export interface BankAccount {
  id: string;
  type: 'Savings' | 'Current';
  balance: number;
  numberEnding: string;
}

export interface BankCard {
  id: string;
  type: 'Credit' | 'Debit';
  name: string;
  numberEnding: string;
  status: 'Active' | 'Blocked' | 'Frozen';
  network: 'Visa' | 'Mastercard' | 'RuPay';
}

export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  merchant: string;
  status: 'Success' | 'Failed' | 'Pending';
  type: 'Debit' | 'Credit';
}

export interface AutopayMandate {
  id: string;
  merchant: string;
  amount: number;
  nextDate: Date;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly';
  status: 'Active' | 'Paused' | 'Completed';
}
