export const GET_CAMPAIGN_DONATION_STATEMENT = `
query GetCampaignDonationStatement($campaignId: String!) {
  getCampaignDonationStatement(campaignId: $campaignId) {
    campaignId
    campaignTitle
    totalReceived
    totalDonations
    generatedAt
    transactions {
      donationId
      transactionDateTime
      donorName
      amount
      receivedAmount
      transactionStatus
      paymentStatus
      gateway
      orderCode
      bankAccountNumber
      bankName
      description
    }
  }
}
`;
