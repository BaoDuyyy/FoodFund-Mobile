export const GENERATE_EXPENSE_PROOF_UPLOAD_URLS = `
mutation GenerateExpenseProofUploadUrls($input: GenerateExpenseProofUploadUrlsInput!) { 
    generateExpenseProofUploadUrls(input: $input) { 
        success 
        uploadUrls {
            uploadUrl 
            fileKey 
            cdnUrl 
            expiresAt 
            fileType 
        } 
        instructions 
    } 
}
`;
