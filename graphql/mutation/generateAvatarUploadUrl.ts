export const GENERATE_AVATAR_UPLOAD_URL = `
mutation GenerateAvatarUploadUrl($input: GenerateAvatarUploadUrlInput!) {
  generateAvatarUploadUrl(input: $input) {
    instructions
    message
    success
    uploadUrl {
      cdnUrl
      expiresAt
      fileKey
      fileType
      uploadUrl
    }
  }
}
`;
