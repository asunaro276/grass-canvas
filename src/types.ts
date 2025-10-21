export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface ContributionData {
  weeks: ContributionWeek[];
  totalContributions: number;
}

export interface GrassCanvasConfig {
  githubUsername: string;
  githubToken?: string;
  lineChannelAccessToken: string;
  lineUserId: string;
  s3BucketName: string;
}
