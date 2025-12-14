
export const GET_WALLET = `
  query GetWallet($userId: String!) {
    getWallet(userId: $userId) {
      balance
      created_at
      id
      updated_at
      userId
      walletType
      totalExpense
      totalIncome
    }
  }
`;

export const GET_SYSTEM_WALLET = `
  query GetSystemWallet {
    getSystemWallet {
      balance
      created_at
      id
      updated_at
      userId
      walletType
      totalExpense
      totalIncome
    }
  }
`;
