export const LOGIN_MUTATION = `
mutation login($input: SignInInput!) {
  signIn(input: $input) {
    expiresIn
    accessToken
    idToken
    message
    refreshToken
    user {
      id
      name
      email
      username
      provider
      createdAt
    }
  }
}
`;

export type SignInInput = {
  email: string;
  password: string;
};

export type SignInResponse = {
  data?: {
    signIn?: {
      expiresIn?: string | number;
      accessToken?: string;
      idToken?: string;
      message?: string;
      refreshToken?: string;
      user?: {
        id: string;
        name?: string;
        email?: string;
        username?: string;
        provider?: string;
        createdAt?: string;
      } | null;
    } | null;
  };
  errors?: any;
};

/**
 * signIn helper
 * - input: { email, password }
 * - graphqlUrl: optional override (useful in Expo where process.env may not be available)
 */
export async function signIn(input: SignInInput, graphqlUrl?: string) {
  const envUrl =
    typeof process !== "undefined" ? (process.env.GRAPHQL_API_URL as string | undefined) : undefined;
  const url = graphqlUrl ?? envUrl ?? "http://localhost:8000/graphql";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: LOGIN_MUTATION,
      variables: { input },
    }),
  });

  const json: SignInResponse = await res.json();

  if (json.errors && json.errors.length) {
    const msg = json.errors.map((e: any) => e.message || JSON.stringify(e)).join("; ");
    throw new Error(`GraphQL error: ${msg}`);
  }

  if (!json.data || !json.data.signIn) {
    throw new Error("Empty signIn response from server");
  }

  return json.data.signIn;
}

export default signIn;
