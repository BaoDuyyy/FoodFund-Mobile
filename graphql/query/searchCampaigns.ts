export const SEARCH_CAMPAIGNS_QUERY = /* GraphQL */ `
  query ($input: SearchCampaignInput!) {
    searchCampaigns(input: $input) {
      items {
        id
        title
        coverImage
        status
        targetAmount
        donationCount
        receivedAmount
        fundraisingStartDate
        fundraisingEndDate
        fundingProgress
        daysRemaining
        creator {
          id
          full_name
        }
        category {
          id
          title
        }
        phases {
          location
        }
      }
      limit
      page
      total
      totalPages
    }
  }
`;
