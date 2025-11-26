import { getGraphqlUrl } from "../config/api";
import { CREATE_DONATION_MUTATION } from "../graphql/mutation/createDonation";
import type { CreateDonationInput, CreateDonationResult } from "../types/api/donation";

export const DonationService = {
  async createDonation(
    input: CreateDonationInput,
    overrideUrl?: string
  ): Promise<CreateDonationResult> {
    const url = getGraphqlUrl(overrideUrl);

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: CREATE_DONATION_MUTATION,
          variables: { input },
        }),
      });
    } catch (err: any) {
      throw new Error(`Cannot connect to server: ${err?.message || err}`);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Network error ${res.status}: ${text}`);
    }

    const json = await res.json().catch(() => null);
    if (!json) throw new Error("Invalid JSON from server");

    if (json.errors?.length) {
      const errMsg = json.errors
        .map((e: any) => e.message || JSON.stringify(e))
        .join("; ");
      throw new Error(errMsg);
    }

    const result: CreateDonationResult | undefined = json.data?.createDonation;
    if (!result) throw new Error("Empty createDonation response");

    return result;
  },
};

export default DonationService;
