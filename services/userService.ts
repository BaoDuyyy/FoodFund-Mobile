import { getGraphqlUrl } from "../config/api";
import { GENERATE_AVATAR_UPLOAD_URL } from "../graphql/mutation/generateAvatarUploadUrl";
import { UPDATE_MY_PROFILE } from "../graphql/mutation/updateMyProfile";
import { GET_MY_PROFILE_QUERY } from "../graphql/query/getMyProfile";
import type {
  GenerateAvatarUploadUrlInput,
  GenerateAvatarUploadUrlPayload,
  GenerateAvatarUploadUrlResult,
  GetMyProfileResponse,
  UpdateMyProfileInput,
  UpdateMyProfilePayload,
  UpdateMyProfileResult,
  UserProfile,
} from "../types/api/user";
import type { GraphQLResponse } from "../types/graphql";
import AuthService from "./authService";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract error message from GraphQL errors array
 */
function extractErrorMessage(errors: Array<{ message?: string }> | undefined): string | null {
  if (!errors || errors.length === 0) return null;
  return errors.map((e) => e.message || JSON.stringify(e)).join("; ");
}

/**
 * Generic GraphQL request handler for UserService
 * Includes authentication token in requests
 */
async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  overrideUrl?: string
): Promise<GraphQLResponse<T>> {
  const url = getGraphqlUrl(overrideUrl);
  const token = await AuthService.getAccessToken();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Cannot connect to server: ${message}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Network error ${res.status}: ${text}`);
  }

  const json = await res.json().catch(() => null);
  if (!json) {
    throw new Error("Invalid JSON from server");
  }

  return json as GraphQLResponse<T>;
}

// =============================================================================
// USER SERVICE
// =============================================================================

export const UserService = {
  /**
   * Get the current user's profile
   */
  async getMyProfile(overrideUrl?: string): Promise<UserProfile> {
    const response = await graphqlRequest<GetMyProfileResponse>(
      GET_MY_PROFILE_QUERY,
      {},
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.getMyProfile?.userProfile;
    if (!payload) {
      throw new Error("Empty or invalid profile response");
    }

    return payload;
  },

  /**
   * Generate a presigned URL for avatar upload
   */
  async generateAvatarUploadUrl(
    input: GenerateAvatarUploadUrlInput,
    overrideUrl?: string
  ): Promise<GenerateAvatarUploadUrlResult> {
    const response = await graphqlRequest<GenerateAvatarUploadUrlPayload>(
      GENERATE_AVATAR_UPLOAD_URL,
      { input },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.generateAvatarUploadUrl;
    if (!payload) {
      throw new Error("Empty generateAvatarUploadUrl response");
    }

    return payload;
  },

  /**
   * Upload avatar file to presigned S3 URL with public-read ACL
   */
  async uploadAvatarToSignedUrl(
    uploadUrl: string,
    file: Blob | ArrayBuffer,
    contentType = "application/octet-stream"
  ): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "x-amz-acl": "public-read",
      },
      body: file,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Avatar upload failed ${res.status}: ${text}`);
    }
  },

  /**
   * Update the current user's profile
   */
  async updateMyProfile(
    input: UpdateMyProfileInput,
    overrideUrl?: string
  ): Promise<UpdateMyProfileResult> {
    const response = await graphqlRequest<UpdateMyProfilePayload>(
      UPDATE_MY_PROFILE,
      { input },
      overrideUrl
    );

    // Handle GraphQL errors
    const errorMsg = extractErrorMessage(response.errors);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    const payload = response.data?.updateMyProfile;
    if (!payload) {
      throw new Error("Empty updateMyProfile response");
    }

    return payload;
  },
};

export default UserService;
