export const GET_MY_DONATIONS = `
query GetMyDonations($skip: Float, $take: Float) {
  getMyDonations(skip: $skip, take: $take) {
    donations {
      amount
      orderCode
      donation {
        campaignId
        donorName
        donorId
        id
        isAnonymous
        status
        orderCode
        transactionDatetime
        __typename
      }
      paymentAmountStatus
      receivedAmount
      transactionStatus
      __typename
    }
    totalAmount
    totalSuccessDonations
    totalDonatedCampaigns
    __typename
  }
}
`;
