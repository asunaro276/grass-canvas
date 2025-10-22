import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import { ContributionData } from './types.js';

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
   * コントリビューションデータから草画像を生成
   */
  generateImage(data: ContributionData): Buffer {
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
    this.drawTitle(ctx, data.totalContributions);

    // 曜日ラベルを描画
    this.drawDayLabels(ctx);

    // 月ラベルを描画
    this.drawMonthLabels(ctx, weeks);

    // 草（コントリビューション）を描画
    this.drawContributions(ctx, weeks);

    return canvas.toBuffer('image/png');
  }

  /**
   * タイトルを描画
   */
  private drawTitle(ctx: CanvasRenderingContext2D, totalContributions: number) {
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(
      `GitHub Contributions: ${totalContributions} total`,
      this.PADDING,
      this.PADDING
    );
  }

  /**
   * 曜日ラベルを描画（月、水、金のみ）
   */
  private drawDayLabels(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#767676';
    ctx.font = '10px sans-serif';

    const labelIndices = [1, 3, 5]; // 月、水、金
    labelIndices.forEach((dayIndex, i) => {
      const y =
        this.PADDING +
        this.MONTH_LABEL_HEIGHT +
        dayIndex * (this.CELL_SIZE + this.CELL_SPACING) +
        this.CELL_SIZE / 2 +
        4;
      ctx.fillText(
        this.WEEKDAY_LABELS[i],
        this.PADDING,
        y
      );
    });
  }

  /**
   * 月ラベルを描画
   */
  private drawMonthLabels(ctx: CanvasRenderingContext2D, weeks: any[]) {
    ctx.fillStyle = '#767676';
    ctx.font = '10px sans-serif';

    let currentMonth = -1;
    weeks.forEach((week, weekIndex) => {
      const firstDay = week.days[0];
      if (!firstDay) return;

      const date = new Date(firstDay.date);
      const month = date.getMonth();

      if (month !== currentMonth && weekIndex > 0) {
        currentMonth = month;
        const x =
          this.PADDING +
          this.DAY_LABEL_WIDTH +
          weekIndex * (this.CELL_SIZE + this.CELL_SPACING);
        const y = this.PADDING + this.MONTH_LABEL_HEIGHT - 5;
        ctx.fillText(`${month + 1}月`, x, y);
      }
    });
  }

  /**
   * コントリビューション（草）を描画
   */
  private drawContributions(ctx: CanvasRenderingContext2D, weeks: any[]) {
    weeks.forEach((week, weekIndex) => {
      week.days.forEach((day: any, dayIndex: number) => {
        const x =
          this.PADDING +
          this.DAY_LABEL_WIDTH +
          weekIndex * (this.CELL_SIZE + this.CELL_SPACING);
        const y =
          this.PADDING +
          this.MONTH_LABEL_HEIGHT +
          dayIndex * (this.CELL_SIZE + this.CELL_SPACING);

        // セルを描画
        ctx.fillStyle = this.COLORS[day.level as keyof typeof this.COLORS];
        ctx.fillRect(x, y, this.CELL_SIZE, this.CELL_SIZE);

        // 枠線を描画
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, this.CELL_SIZE, this.CELL_SIZE);
      });
    });
  }
}
