import { S3Client, PutObjectCommand, PutObjectCommandOutput, GetObjectCommand, GetObjectCommandOutput, DeleteObjectCommandOutput, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const uploadImageToAws = async (fileName: string, image: string, contentType?: string): Promise<string> => {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_REGION, AWS_BUCKET_NAME } = process.env;

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_BUCKET_REGION || !AWS_BUCKET_NAME) {
        throw new Error('AWS credentials are not set');
    }

    const s3 = new S3Client({
        region: AWS_BUCKET_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
    });

    const command = new PutObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: fileName,
        Body: Buffer.from(image, 'base64'),
        ContentType: contentType || 'image/jpeg',
        // ACL removed - bucket policy handles public access
    });

    const response = await s3.send(command);

    // Check if upload was successful
    if (response.$metadata.httpStatusCode !== 200) {
        throw new Error('Failed to upload image to S3');
    }

    // Construct and return the S3 URL (PutObjectCommand doesn't return the URL)
    return `https://${AWS_BUCKET_NAME}.s3.${AWS_BUCKET_REGION}.amazonaws.com/${fileName}`;
};

// export const getImageFromAws = async (fileName: string): Promise<string | undefined> => {
//     const s3 = new S3Client({
//         region: process.env.AWS_BUCKET_REGION as string,
//     });
//     const command = new GetObjectCommand({
//         Bucket: process.env.AWS_BUCKET_NAME as string,
//         Key: fileName,
//     });
//     const response = await s3.send(command);
//     return response.Body as ReadableStream<any> & { $metadata: GetObjectCommandOutput['$metadata'] } | undefined;
// };

// export const deleteImageFromAws = async (fileName: string): Promise<DeleteObjectCommandOutput> => {
//     const s3 = new S3Client({
//         region: process.env.AWS_BUCKET_REGION as string,
//     });
//     const command = new DeleteObjectCommand({
//         Bucket: process.env.AWS_BUCKET_NAME as string,
//         Key: fileName,
//     });
//     const response = await s3.send(command);
//     return response;
// };