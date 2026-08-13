import type { RunResult } from "@/types";

export interface ShareCardOptions {
  result: RunResult;
  username?: string;
  heading?: string;
  rank?: number;
}

const WIDTH = 1200;
const HEIGHT = 630;

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function label(context: CanvasRenderingContext2D, text: string, x: number, y: number) {
  context.fillStyle = "#777777";
  context.font = "600 18px monospace";
  context.letterSpacing = "3px";
  context.fillText(text.toUpperCase(), x, y);
  context.letterSpacing = "0px";
}

function drawLogo(context: CanvasRenderingContext2D) {
  const x = 72;
  const y = 58;
  const size = 66;
  roundedRect(context, x, y, size, size, 18);
  context.fillStyle = "#f0f0f0";
  context.fill();
  context.strokeStyle = "#333333";
  context.lineWidth = 4;
  roundedRect(context, x + 12, y + 13, 42, 40, 9);
  context.stroke();
  context.beginPath();
  context.moveTo(x + 13, y + 25);
  context.lineTo(x + 53, y + 25);
  context.stroke();
  context.fillStyle = "#111111";
  context.font = "800 20px monospace";
  context.fillText("CY", x + 19, y + 48);
}

function drawTrend(context: CanvasRenderingContext2D, values: number[], x: number, y: number, width: number, height: number) {
  if (values.length < 2) {
    context.strokeStyle = "#333333";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(x, y + height / 2);
    context.lineTo(x + width, y + height / 2);
    context.stroke();
    return;
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = Math.max(max - min, 10);
  context.beginPath();
  values.forEach((value, index) => {
    const pointX = x + (index / (values.length - 1)) * width;
    const pointY = y + height - ((value - min) / range) * height;
    if (index === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  });
  context.strokeStyle = "#e8e8e8";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke();
}

export async function createResultCard({ result, username, heading, rank }: ShareCardOptions): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");

  const background = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, "#202020");
  background.addColorStop(0.52, "#0f0f0f");
  background.addColorStop(1, "#050505");
  context.fillStyle = background;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.save();
  context.globalAlpha = 0.035;
  context.fillStyle = "#ffffff";
  context.font = "800 96px monospace";
  context.rotate(-0.08);
  context.fillText("{ }  </>  fn()  =>  const", -30, 245);
  context.fillText("async  []  ::  return  01", 100, 480);
  context.restore();

  drawLogo(context);
  context.fillStyle = "#f4f4f4";
  context.font = "800 32px monospace";
  context.fillText("Codey_", 158, 98);
  context.fillStyle = "#777777";
  context.font = "500 18px monospace";
  context.textAlign = "right";
  context.fillText(username ? `@${username}` : "type real code, get faster", 1128, 98);
  context.textAlign = "left";

  label(context, heading ?? (rank ? `Leaderboard rank #${rank}` : "Typing result"), 72, 178);
  context.fillStyle = "#f5f5f5";
  context.font = "800 122px monospace";
  context.fillText(result.wpm.toFixed(1), 65, 315);
  context.fillStyle = "#a0a0a0";
  context.font = "700 30px monospace";
  context.fillText("WPM", 405, 305);

  roundedRect(context, 72, 365, 680, 172, 24);
  context.fillStyle = "rgba(255,255,255,0.045)";
  context.fill();
  context.strokeStyle = "#292929";
  context.lineWidth = 2;
  context.stroke();
  label(context, "Speed trace", 104, 410);
  drawTrend(context, result.wpmSnapshots ?? [], 104, 442, 616, 62);

  roundedRect(context, 790, 160, 338, 377, 28);
  context.fillStyle = "rgba(255,255,255,0.055)";
  context.fill();
  context.strokeStyle = "#303030";
  context.stroke();

  const stats = [
    ["Accuracy", `${result.accuracy.toFixed(1)}%`],
    ["Consistency", `${result.consistency.toFixed(1)}%`],
    ["Language", result.language],
    ["Mode", result.mode === "timed" ? `${Math.round(result.duration / 1000)}s timed` : result.mode === "snippet" && result.snippetLength ? `${result.snippetLength} snippet` : result.mode],
  ];
  stats.forEach(([name, value], index) => {
    const y = 210 + index * 78;
    label(context, name, 826, y);
    context.fillStyle = "#eeeeee";
    context.font = `${index < 2 ? "800 30px" : "700 24px"} monospace`;
    context.fillText(value, 826, y + 37);
  });

  context.fillStyle = "#666666";
  context.font = "500 15px monospace";
  const footer = result.sourceType === "custom" ? "LOCAL PRACTICE · NOT RANKED" : rank ? `GLOBAL COMMUNITY RANK #${rank}` : `${result.totalErrors} ERRORS · ${result.charsTyped} KEYSTROKES · COMMUNITY RUN`;
  context.fillText(footer, 72, 590);
  context.textAlign = "right";
  context.fillText(window.location.host, 1128, 590);

  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Unable to generate image")), "image/png", 1));
}
