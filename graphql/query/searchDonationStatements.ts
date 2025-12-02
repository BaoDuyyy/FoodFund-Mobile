export const SEARCH_DONATION_STATEMENTS_QUERY = `
query($searchDonationStatementsInput2: SearchDonationInput!) {
  searchDonationStatements(input: $searchDonationStatementsInput2) {
    campaignId
    campaignTitle
    generatedAt
    totalDonations
    totalReceived
    transactions {
      no
      donorName
      receivedAmount
      transactionDateTime
    }
  }
}
`;
