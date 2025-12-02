export const CAMPAIGN_CATEGORIES_STATS_QUERY = `
  query CampaignCategoriesStats {
    campaignCategoriesStats {
      id
      title
      description
      campaignCount
      created_at
      updated_at
    }
  }
`;
