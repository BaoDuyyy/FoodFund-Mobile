export const LIST_CAMPAIGNS_QUERY = `
query ListCampaigns(
  $filter: CampaignFilterInput,
  $search: String,
  $sortBy: CampaignSortOrder,
  $limit: Int,
  $offset: Int
) {
  campaigns(
    filter: $filter,
    search: $search,
    sortBy: $sortBy,
    limit: $limit,
    offset: $offset
  ) {
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
  }
}
`;

export type { CampaignItem, ListCampaignsResponse, ListCampaignsVars } from "../../types/api/campaign";

