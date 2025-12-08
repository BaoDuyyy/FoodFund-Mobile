export type CreateDonationInput = {
  amount: number;
  campaignId: string;
  isAnonymous?: boolean;
  description?: string;
  // Add other fields if needed
};

export type CreateDonationResult = {
  amount: number;
  bankAccountName?: string;
  bankFullName?: string;
  bankLogo?: string;
  bankName?: string;
  bankNumber?: string;
  description?: string;
  donationId: string;
  qrCode?: string;
};

// Input type for searching donation statements
export type SearchDonationStatementsInput = {
  campaignId: string;
  limit?: number;
  maxAmount?: number | null;
  minAmount?: number | null;
  page?: number;
  query?: string | null;
  sortBy?: string | null;
};

// Response type for searching donation statements
export type DonationStatement = {
  no: number;
  donorName: string;
  receivedAmount: string;
  transactionDateTime: string;
  isAnonymous?: boolean;
  description?: string;
};

export type SearchDonationStatementsResult = {
  transactions: DonationStatement[];
  totalDonations: number;
  totalReceived: string;
};

export type SearchDonationStatementsResponse = {
  searchDonationStatements: SearchDonationStatementsResult;
};

// Options for getMyDonations
export type GetMyDonationsOptions = {
  skip?: number;
  take?: number;
};

// Response type for getMyDonations
export type MyDonation = {
  orderCode?: string;
  amount?: number;
  receivedAmount?: number;
  transactionStatus?: string;
  paymentAmountStatus?: string;
  donation?: {
    campaignId?: string;
    isAnonymous?: boolean;
    donorName?: string;
    transactionDatetime?: string;
  };
};

export type GetMyDonationsResult = {
  totalAmount: number;
  donations: MyDonation[];
};

export type GetMyDonationsResponse = {
  getMyDonations: GetMyDonationsResult;
};
