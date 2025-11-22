export const SIGNUP_MUTATION = `
mutation($signUpInput2: SignUpInput!) {
  signUp(input: $signUpInput2) {
    emailSent
    message
    userSub
  }
}
`;
