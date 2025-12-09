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
