import { Handler } from 'aws-lambda';
import { GitHubService } from './github';
import { GrassCanvas } from './canvas';
import { S3Service } from './s3';
import { LineService } from './line';
import { format } from 'date-fns';

export const handler: Handler = async (event, context) => {
  console.log('Grass Canvas Lambda function started');

  try {
    // 環境変数から設定を取得
    const githubUsername = process.env.GITHUB_USERNAME;
    const githubToken = process.env.GITHUB_TOKEN;
    const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const lineUserId = process.env.LINE_USER_ID;
    const s3BucketName = process.env.S3_BUCKET_NAME;

    // 必須環境変数のチェック
    if (!githubUsername) {
      throw new Error('GITHUB_USERNAME is required');
    }
    if (!lineChannelAccessToken) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN is required');
    }
    if (!lineUserId) {
      throw new Error('LINE_USER_ID is required');
    }
    if (!s3BucketName) {
      throw new Error('S3_BUCKET_NAME is required');
    }

    console.log(`Processing for GitHub user: ${githubUsername}`);

    // 1. GitHubのコントリビューションデータを取得
    const githubService = new GitHubService(githubUsername, githubToken);
    const contributionData = await githubService.getContributions();
    console.log(`Total contributions: ${contributionData.totalContributions}`);

    // 2. Canvasで草画像を生成
    const grassCanvas = new GrassCanvas();
    const imageBuffer = grassCanvas.generateImage(contributionData);
    console.log('Grass image generated');

    // 3. S3に画像をアップロード
    const s3Service = new S3Service(s3BucketName);
    const imageUrl = await s3Service.uploadImage(imageBuffer, githubUsername);
    console.log(`Image uploaded to: ${imageUrl}`);

    // 4. LINEに通知
    const lineService = new LineService(lineChannelAccessToken, lineUserId);
    const currentTime = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const message = `🌱 GitHub草レポート\n\n総コントリビューション: ${contributionData.totalContributions}\n更新時刻: ${currentTime}`;

    await lineService.sendImageMessage(imageUrl, message);
    console.log('LINE notification sent');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully sent GitHub grass notification',
        totalContributions: contributionData.totalContributions,
        imageUrl,
      }),
    };
  } catch (error) {
    console.error('Error in Lambda function:', error);

    // エラーをLINEに通知（可能であれば）
    try {
      const lineChannelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      const lineUserId = process.env.LINE_USER_ID;

      if (lineChannelAccessToken && lineUserId) {
        const lineService = new LineService(lineChannelAccessToken, lineUserId);
        await lineService.sendTextMessage(
          `❌ Grass Canvasでエラーが発生しました\n\n${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to send GitHub grass notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
