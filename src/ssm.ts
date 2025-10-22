import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

export class SSMService {
  private client: SSMClient;

  constructor() {
    this.client = new SSMClient({});
  }

  /**
   * SSM Parameter Store から値を取得
   * @param parameterName パラメータ名（パス）
   * @param required 必須かどうか。falseの場合、パラメータが存在しなくてもundefinedを返す
   * @returns パラメータの値
   */
  async getParameter(parameterName: string, required: boolean = true): Promise<string | undefined> {
    try {
      const command = new GetParameterCommand({
        Name: parameterName,
        WithDecryption: true,
      });

      const response = await this.client.send(command);
      return response.Parameter?.Value;
    } catch (error) {
      if (required) {
        console.error(`Failed to get SSM parameter: ${parameterName}`, error);
        throw new Error(`Failed to get required SSM parameter: ${parameterName}`);
      }
      // オプショナルなパラメータの場合は undefined を返す
      console.warn(`SSM parameter not found (optional): ${parameterName}`);
      return undefined;
    }
  }

  /**
   * 複数のパラメータを一度に取得
   * @param parameters パラメータ名と必須フラグのマップ
   * @returns パラメータ名と値のマップ
   */
  async getParameters(parameters: { [key: string]: boolean }): Promise<{ [key: string]: string | undefined }> {
    const results: { [key: string]: string | undefined } = {};

    for (const [parameterName, required] of Object.entries(parameters)) {
      results[parameterName] = await this.getParameter(parameterName, required);
    }

    return results;
  }
}
