import { getGraphqlUrl } from "../config/api";
import { GET_SYSTEM_WALLET, GET_WALLET } from "../graphql/query/wallet";
import type { SystemWallet, Wallet } from "../types/api/wallet";
import type { GraphQLResponse } from "../types/graphql";
import AuthService from "./authService";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract error messages from GraphQL errors array
 */
function extractErrorMessage(errors: Array<{ message?: string }>): string {
    return errors.map((e) => e.message || JSON.stringify(e)).join("; ");
}

/**
 * Generic GraphQL request handler with authentication
 */
async function graphqlRequest<T>(options: {
    query: string;
    variables?: Record<string, any>;
    overrideUrl?: string;
}): Promise<GraphQLResponse<T>> {
    const { query, variables, overrideUrl } = options;
    const url = getGraphqlUrl(overrideUrl);
    const token = await AuthService.getAccessToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let res: Response;

    try {
        res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({ query, variables }),
        });
    } catch (err: any) {
        throw new Error(`Cannot connect to server: ${err?.message || err}`);
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Network error ${res.status}: ${text}`);
    }

    const json = await res.json().catch(() => null);
    if (!json) {
        throw new Error("Invalid JSON from server");
    }

    if (json.errors?.length) {
        throw new Error(extractErrorMessage(json.errors));
    }

    return json;
}

// ============================================================================
// WALLET SERVICE
// ============================================================================

export const WalletService = {
    /**
     * Get wallet by user ID
     */
    async getWallet(userId: string, overrideUrl?: string): Promise<Wallet> {
        if (!userId) {
            throw new Error("User ID is required");
        }

        const response = await graphqlRequest<{ getWallet: Wallet }>({
            query: GET_WALLET,
            variables: { userId },
            overrideUrl,
        });

        const wallet = response.data?.getWallet;
        if (!wallet) {
            throw new Error("Wallet not found");
        }

        return wallet;
    },

    /**
     * Get system wallet (no authentication required for public data)
     */
    async getSystemWallet(overrideUrl?: string): Promise<SystemWallet> {
        const response = await graphqlRequest<{ getSystemWallet: SystemWallet }>({
            query: GET_SYSTEM_WALLET,
            overrideUrl,
        });

        const wallet = response.data?.getSystemWallet;
        if (!wallet) {
            throw new Error("System wallet not found");
        }

        return wallet;
    },
};

export default WalletService;
