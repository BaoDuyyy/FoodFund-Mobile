import { useCallback, useEffect, useState } from "react";
import CampaignService from "../services/campaignService";
import type {
    CampaignDetail,
    CampaignItem,
    ListCampaignsVars,
    SearchCampaignInput,
} from "../types/api/campaign";

// =============================================================================
// TYPES
// =============================================================================

export type UseCampaignsState = {
    /** List of campaigns */
    campaigns: CampaignItem[];
    /** Whether data is being loaded */
    loading: boolean;
    /** Error message, if any */
    error: string | null;
};

export type UseCampaignsReturn = UseCampaignsState & {
    /** Refetch campaigns with current options */
    refetch: () => Promise<void>;
    /** Search campaigns with new filters */
    search: (input: SearchCampaignInput) => Promise<void>;
};

export type UseCampaignState = {
    /** Campaign detail */
    campaign: CampaignDetail | null;
    /** Whether data is being loaded */
    loading: boolean;
    /** Error message, if any */
    error: string | null;
};

export type UseCampaignReturn = UseCampaignState & {
    /** Refetch campaign detail */
    refetch: () => Promise<void>;
};

// =============================================================================
// useCampaigns - List campaigns
// =============================================================================

/**
 * Custom hook for fetching and managing a list of campaigns.
 * Provides loading/error states and refetch functionality.
 *
 * @param options - Optional filter/pagination options
 *
 * @example
 * ```tsx
 * function CampaignList() {
 *   const { campaigns, loading, error, refetch } = useCampaigns({
 *     filter: { status: ["ACTIVE"] },
 *     limit: 10,
 *   });
 *
 *   if (loading) return <ActivityIndicator />;
 *   if (error) return <Text>Error: {error}</Text>;
 *
 *   return (
 *     <FlatList
 *       data={campaigns}
 *       renderItem={({ item }) => <CampaignCard campaign={item} />}
 *       onRefresh={refetch}
 *     />
 *   );
 * }
 * ```
 */
export function useCampaigns(options?: Partial<ListCampaignsVars>): UseCampaignsReturn {
    const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await CampaignService.listCampaigns(options);
            setCampaigns(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(options)]); // Stringify to compare deep equality

    const search = useCallback(async (input: SearchCampaignInput) => {
        setLoading(true);
        setError(null);

        try {
            const data = await CampaignService.searchCampaigns(input);
            setCampaigns(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    return {
        campaigns,
        loading,
        error,
        refetch: fetchCampaigns,
        search,
    };
}

// =============================================================================
// useCampaign - Single campaign detail
// =============================================================================

/**
 * Custom hook for fetching a single campaign by ID.
 * Provides loading/error states and refetch functionality.
 *
 * @param id - Campaign ID to fetch
 *
 * @example
 * ```tsx
 * function CampaignDetailScreen({ id }: { id: string }) {
 *   const { campaign, loading, error } = useCampaign(id);
 *
 *   if (loading) return <ActivityIndicator />;
 *   if (error) return <Text>Error: {error}</Text>;
 *   if (!campaign) return <Text>Not found</Text>;
 *
 *   return (
 *     <View>
 *       <Text>{campaign.title}</Text>
 *       <Text>{campaign.description}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useCampaign(id: string | undefined): UseCampaignReturn {
    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCampaign = useCallback(async () => {
        if (!id) {
            setCampaign(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await CampaignService.getCampaign(id);
            setCampaign(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCampaign();
    }, [fetchCampaign]);

    return {
        campaign,
        loading,
        error,
        refetch: fetchCampaign,
    };
}

export default useCampaigns;
