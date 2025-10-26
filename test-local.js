import { handler } from './dist/index.js';

// 環境変数を設定
process.env.GITHUB_USERNAME = 'asunaro276';
process.env.S3_BUCKET_NAME = 'grass-canvas-483288316381';
process.env.SSM_GITHUB_TOKEN_PATH = '/grass-canvas/github-token';
process.env.SSM_LINE_CHANNEL_ACCESS_TOKEN_PATH = '/grass-canvas/line-channel-access-token';
process.env.SSM_LINE_USER_ID_PATH = '/grass-canvas/line-user-id';

// Lambda関数を実行
(async () => {
  try {
    console.log('Starting local test...');
    const result = await handler({}, {});
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
