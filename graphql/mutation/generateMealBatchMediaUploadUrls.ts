export const GENERATE_MEAL_BATCH_MEDIA_UPLOAD_URLS = `
  mutation GenerateMealBatchMediaUploadUrls(
    $input: GenerateMealBatchMediaUploadUrlsInput!
  ) {
    generateMealBatchMediaUploadUrls(input: $input) {
      success
      uploadUrls {
        uploadUrl
        fileKey
        cdnUrl
        expiresAt
        fileType
      }
    }
  }
`;
