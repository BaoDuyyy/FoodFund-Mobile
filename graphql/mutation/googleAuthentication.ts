export const GOOGLE_AUTHENTICATION_MUTATION = `
mutation($input: GoogleAuthInput!) {
  googleAuthentication(input: $input) {
    accessToken
    idToken
    isNewUser
    message
    refreshToken
    user {
      createdAt
      email
      emailVerified
      id
      name
      phoneNumber
      provider
      updatedAt
      username
    }
  }
}
`;
