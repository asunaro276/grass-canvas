declare module 'canvas' {
  export interface Canvas {
    width: number;
    height: number;
    getContext(contextId: '2d'): CanvasRenderingContext2D;
    toBuffer(mimeType?: string, config?: any): Buffer;
  }

  export interface CanvasRenderingContext2D {
    fillStyle: string | CanvasGradient | CanvasPattern;
    strokeStyle: string | CanvasGradient | CanvasPattern;
    fillRect(x: number, y: number, w: number, h: number): void;
    strokeRect(x: number, y: number, w: number, h: number): void;
    clearRect(x: number, y: number, w: number, h: number): void;
    beginPath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    closePath(): void;
    fill(): void;
    stroke(): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
    rect(x: number, y: number, w: number, h: number): void;
    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    strokeText(text: string, x: number, y: number, maxWidth?: number): void;
    measureText(text: string): TextMetrics;
    font: string;
    textAlign: string;
    textBaseline: string;
    lineWidth: number;
    lineCap: string;
    lineJoin: string;
    save(): void;
    restore(): void;
    translate(x: number, y: number): void;
    rotate(angle: number): void;
    scale(x: number, y: number): void;
  }

  export interface TextMetrics {
    width: number;
  }

  export interface CanvasGradient {}
  export interface CanvasPattern {}

  export function createCanvas(width: number, height: number, type?: 'PDF' | 'SVG'): Canvas;
}
