import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import { ContributionData, ContributionWeek } from './types.js';

export class GrassCanvas {
  private readonly CELL_SIZE = 12;
  private readonly CELL_SPACING = 3;
  private readonly PADDING = 20;
  private readonly MONTH_LABEL_HEIGHT = 20;
  private readonly DAY_LABEL_WIDTH = 30;

  // GitHubの草の色
  private readonly COLORS = {
    0: '#ebedf0', // レベル0（コントリビューションなし）
    1: '#9be9a8', // レベル1
    2: '#40c463', // レベル2
    3: '#30a14e', // レベル3
    4: '#216e39', // レベル4
  };

  private readonly WEEKDAY_LABELS = ['月', '水', '金'];

  /**
   * 年間のコントリビューションデータから草画像を生成
   */
  generateYearlyImage(data: ContributionData): Buffer {
    const weeks = data.weeks;
    const width =
      this.PADDING * 2 +
      this.DAY_LABEL_WIDTH +
      weeks.length * (this.CELL_SIZE + this.CELL_SPACING);
    const height =
      this.PADDING * 2 +
      this.MONTH_LABEL_HEIGHT +
      7 * (this.CELL_SIZE + this.CELL_SPACING);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 背景を白に
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // タイトルを描画
    this.drawYearlyTitle(ctx, data.totalContributions);

    // 曜日ラベルを描画
    this.drawDayLabels(ctx, this.PADDING, this.PADDING + this.MONTH_LABEL_HEIGHT);

    // 月ラベルを描画
    this.drawMonthLabels(ctx, weeks, this.PADDING + this.DAY_LABEL_WIDTH, this.PADDING);

    // 草（コントリビューション）を描画
    this.drawContributions(ctx, weeks, this.PADDING + this.DAY_LABEL_WIDTH, this.PADDING + this.MONTH_LABEL_HEIGHT);

    return canvas.toBuffer('image/png');
  }

  /**
   * 直近2ヶ月のコントリビューションデータから画像を生成
   */
  generateRecentImage(data: ContributionData, todayContributions: number): Buffer {
    const recentWeeks = data.weeks.slice(-9); // 過去9週間分を直近とする

    const width = 250;
    const height = 220;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 背景を白に
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // タイトルを描画
    this.drawRecentTitle(ctx, todayContributions);

    const graphXOffset = this.PADDING;
    const graphYOffset = 80;

    // 曜日ラベルを描画
    this.drawDayLabels(ctx, graphXOffset, graphYOffset + this.MONTH_LABEL_HEIGHT);

    // 月ラベルを描画
    this.drawMonthLabels(ctx, recentWeeks, graphXOffset + this.DAY_LABEL_WIDTH, graphYOffset);

    // 草（コントリビューション）を描画
    this.drawContributions(ctx, recentWeeks, graphXOffset + this.DAY_LABEL_WIDTH, graphYOffset + this.MONTH_LABEL_HEIGHT);

    return canvas.toBuffer('image/png');
  }

  /**
   * 年間グラフのタイトルを描画
   */
  private drawYearlyTitle(ctx: CanvasRenderingContext2D, totalContributions: number) {
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px "Noto Sans CJK JP", sans-serif';
    ctx.fillText(
      `GitHub Contributions: ${totalContributions} total`,
      this.PADDING,
      this.PADDING
    );
  }

  /**
   * 直近グラフのタイトルを描画
   */
  private drawRecentTitle(ctx: CanvasRenderingContext2D, todayContributions: number) {
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px "Noto Sans CJK JP", sans-serif';
    ctx.fillText('Recent Contributions', this.PADDING, this.PADDING + 10);

    const todayStatus = todayContributions > 0 ? '✅' : '❌';
    ctx.font = '14px "Noto Sans CJK JP", "Noto Color Emoji", sans-serif';
    ctx.fillText(`Today's Contributions:${todayContributions}${todayStatus}`, this.PADDING, this.PADDING + 40);
  }

  /**
   * 曜日ラベルを描画（月、水、金のみ）
   */
  private drawDayLabels(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#767676';
    ctx.font = '10px "Noto Sans CJK JP", sans-serif';

    const labelIndices = [1, 3, 5]; // 月、水、金
    labelIndices.forEach((dayIndex, i) => {
      ctx.fillText(
        this.WEEKDAY_LABELS[i],
        x,
        y + dayIndex * (this.CELL_SIZE + this.CELL_SPACING) + this.CELL_SIZE / 2 + 4
      );
    });
  }

  /**
   * 月ラベルを描画
   */
  private drawMonthLabels(ctx: CanvasRenderingContext2D, weeks: ContributionWeek[], x: number, y: number) {
    ctx.fillStyle = '#767676';
    ctx.font = '10px "Noto Sans CJK JP", sans-serif';

    let currentMonth = -1;
    weeks.forEach((week, weekIndex) => {
      const firstDay = week.days[0];
      if (!firstDay) return;

      const date = new Date(firstDay.date);
      const month = date.getMonth();

      // 月が変わったとき
      if (month !== currentMonth) {
        currentMonth = month;
        ctx.fillText(`${month + 1}月`, x + weekIndex * (this.CELL_SIZE + this.CELL_SPACING), y + this.MONTH_LABEL_HEIGHT - 10);
      }
    });
  }

  /**
   * コントリビューション（草）を描画
   */
  private drawContributions(ctx: CanvasRenderingContext2D, weeks: ContributionWeek[], x: number, y: number) {
    weeks.forEach((week, weekIndex) => {
      week.days.forEach((day: any, dayIndex: number) => {
        const cellX = x + weekIndex * (this.CELL_SIZE + this.CELL_SPACING);
        const cellY = y + dayIndex * (this.CELL_SIZE + this.CELL_SPACING);

        ctx.fillStyle = this.COLORS[day.level as keyof typeof this.COLORS];
        ctx.fillRect(cellX, cellY, this.CELL_SIZE, this.CELL_SIZE);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX, cellY, this.CELL_SIZE, this.CELL_SIZE);
      });
    });
  }
}
