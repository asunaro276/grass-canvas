import { Octokit } from '@octokit/rest';
import { subDays, format } from 'date-fns';
import { ContributionData, ContributionDay, ContributionWeek } from './types.js';

export class GitHubService {
  private octokit: Octokit;
  private username: string;

  constructor(username: string, token?: string) {
    this.username = username;
    this.octokit = new Octokit({
      auth: token,
    });
  }

  /**
   * GitHubのコントリビューションデータを取得
   * GraphQL APIを使用して過去1年分のデータを取得
   */
  async getContributions(): Promise<ContributionData> {
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  contributionLevel
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response: any = await this.octokit.graphql(query, {
        username: this.username,
      });

      const calendar = response.user.contributionsCollection.contributionCalendar;

      // データを整形
      const weeks: ContributionWeek[] = calendar.weeks.map((week: any) => ({
        days: week.contributionDays.map((day: any) => ({
          date: day.date,
          count: day.contributionCount,
          level: this.mapContributionLevel(day.contributionLevel),
        })),
      }));

      return {
        weeks,
        totalContributions: calendar.totalContributions,
      };
    } catch (error) {
      console.error('Failed to fetch GitHub contributions:', error);
      throw new Error('Failed to fetch GitHub contributions');
    }
  }

  /**
   * GitHubのコントリビューションレベルを0-4の数値にマッピング
   */
  private mapContributionLevel(level: string): 0 | 1 | 2 | 3 | 4 {
    const levelMap: { [key: string]: 0 | 1 | 2 | 3 | 4 } = {
      NONE: 0,
      FIRST_QUARTILE: 1,
      SECOND_QUARTILE: 2,
      THIRD_QUARTILE: 3,
      FOURTH_QUARTILE: 4,
    };
    return levelMap[level] || 0;
  }
}
