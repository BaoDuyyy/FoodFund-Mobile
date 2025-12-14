/**
 * Wallet API Types
 */

export interface Wallet {
    id: string;
    userId: string;
    walletType: string;
    balance: string | number;
    totalIncome: string | number;
    totalExpense: string | number;
    created_at: string;
    updated_at: string;
}

export interface SystemWallet extends Wallet {
    // System wallet has the same structure as regular wallet
}
