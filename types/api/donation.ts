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
