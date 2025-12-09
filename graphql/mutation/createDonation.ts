export const CREATE_DONATION_MUTATION = `
mutation($input: CreateDonationInput!) {
  createDonation(input: $input) {
    amount
    bankAccountName
    bankFullName
    bankLogo
    bankName
    bankNumber
    description
    donationId
    qrCode
  }
}
`;
