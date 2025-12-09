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
  id: string;
  amount: number;
  createdAt: string;
  donorName?: string;
  isAnonymous: boolean;
  description?: string;
};

export type SearchDonationStatementsResponse = {
  searchDonationStatements: {
    items: DonationStatement[];
    total: number;
  };
};

// Options for getMyDonations
export type GetMyDonationsOptions = {
  skip?: number;
  take?: number;
};

// Response type for getMyDonations
export type MyDonation = {
  id: string;
  amount: number;
  createdAt: string;
  campaign?: {
    id: string;
    title: string;
  };
  isAnonymous: boolean;
  description?: string;
};

export type GetMyDonationsResponse = {
  getMyDonations: MyDonation[];
};
