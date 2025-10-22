import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { format } from 'date-fns';

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(bucketName: string) {
    this.bucketName = bucketName;
    this.s3Client = new S3Client({});
  }

  /**
   * 画像をS3にアップロードしてURLを返す
   */
  async uploadImage(imageBuffer: Buffer, username: string): Promise<string> {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
    const key = `grass/${username}/${timestamp}.png`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/png',
    });

    try {
      await this.s3Client.send(command);

      // S3のパブリックURLを生成
      const url = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      console.log('Image uploaded to S3:', url);

      return url;
    } catch (error) {
      console.error('Failed to upload image to S3:', error);
      throw new Error('Failed to upload image to S3');
    }
  }

  /**
   * CloudFront経由でURLを取得する場合（オプション）
   */
  getCloudFrontUrl(key: string, cloudFrontDomain: string): string {
    return `https://${cloudFrontDomain}/${key}`;
  }
}
