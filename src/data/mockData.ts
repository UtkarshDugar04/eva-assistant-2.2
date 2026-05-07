import type { BankAccount, BankCard, Beneficiary, Transaction, AutopayMandate } from '../types';

export const mockAccount: BankAccount = {
  id: 'acc_1',
  type: 'Savings',
  balance: 48230.50,
  numberEnding: '1423'
};

export const mockBeneficiaries: Beneficiary[] = [
  { id: 'ben_1', name: 'Ravi Kumar', accountEnding: '9921', bank: 'HDFC Bank' },
  { id: 'ben_2', name: 'Ravi Sharma', accountEnding: '3421', bank: 'ICICI Bank' },
  { id: 'ben_3', name: 'Priya Sharma', accountEnding: '8822', bank: 'SBI', phone: '+91 98765 11111' },
  { id: 'ben_4', name: 'Suhani Sharma', accountEnding: '4512', bank: 'HDFC Bank', phone: '+91 98765 43210' },
  { id: 'ben_6', name: 'Suhani Gupta', accountEnding: '1122', bank: 'ICICI Bank', phone: '+91 99887 65432' },
  { id: 'ben_5', name: 'Netflix', accountEnding: 'N/A', bank: 'Merchant', phone: 'N/A' }
];

export const mockCards: BankCard[] = [
  { id: 'card_1', type: 'Credit', name: 'Regalia Gold', numberEnding: '4821', status: 'Active', network: 'Visa' },
  { id: 'card_2', type: 'Debit', name: 'Platinum', numberEnding: '9923', status: 'Active', network: 'Mastercard' }
];

export const mockTransactions: Transaction[] = [
  { id: 'txn_1', date: new Date(Date.now() - 3600000 * 2), amount: 1500, merchant: 'Swiggy', status: 'Success', type: 'Debit' },
  { id: 'txn_2', date: new Date(Date.now() - 3600000 * 24), amount: 499, merchant: 'Netflix', status: 'Failed', type: 'Debit' },
  { id: 'txn_3', date: new Date(Date.now() - 3600000 * 48), amount: 5000, merchant: 'Salary', status: 'Success', type: 'Credit' }
];

export const mockAutopays: AutopayMandate[] = [
  { id: 'auto_1', merchant: 'Netflix', amount: 649, nextDate: new Date(Date.now() + 86400000 * 5), frequency: 'Monthly', status: 'Active' },
  { id: 'auto_2', merchant: 'Spotify', amount: 119, nextDate: new Date(Date.now() + 86400000 * 12), frequency: 'Monthly', status: 'Active' },
  { id: 'auto_3', merchant: 'Gym Membership', amount: 2500, nextDate: new Date(Date.now() + 86400000 * 3), frequency: 'Monthly', status: 'Paused' }
];
