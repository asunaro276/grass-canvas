import { Client, ClientConfig } from '@line/bot-sdk';

export class LineService {
  private client: Client;
  private userId: string;

  constructor(channelAccessToken: string, userId: string) {
    const config: ClientConfig = {
      channelAccessToken,
    };
    this.client = new Client(config);
    this.userId = userId;
  }

  /**
   * 画像メッセージを送信
   */
  async sendImageMessage(imageUrl: string, message: string): Promise<void> {
    try {
      await this.client.pushMessage(this.userId, [
        {
          type: 'text',
          text: message,
        },
        {
          type: 'image',
          originalContentUrl: imageUrl,
          previewImageUrl: imageUrl,
        },
      ]);

      console.log('LINE message sent successfully');
    } catch (error) {
      console.error('Failed to send LINE message:', error);
      throw new Error('Failed to send LINE message');
    }
  }

  /**
   * テキストメッセージのみを送信
   */
  async sendTextMessage(message: string): Promise<void> {
    try {
      await this.client.pushMessage(this.userId, {
        type: 'text',
        text: message,
      });

      console.log('LINE text message sent successfully');
    } catch (error) {
      console.error('Failed to send LINE text message:', error);
      throw new Error('Failed to send LINE text message');
    }
  }
}
