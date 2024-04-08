import { DetectedObject } from "@tensorflow-models/coco-ssd";
export function drawOnCanvas(
  // mirrored: boolean,
  predictions: DetectedObject[],
  ctx: CanvasRenderingContext2D | null | undefined
) {
  predictions.forEach((detectedObject: DetectedObject) => {
    const { class: name, bbox, score } = detectedObject;
    const [x, y, width, height] = bbox;

    if (ctx) {
      ctx.beginPath();

      // Styling
      ctx.fillStyle = name === "person" ? "#EE6310" : "#BCD96E";
      ctx.globalAlpha = 0.4;

      ctx.roundRect(x, y, width, height, 8);

      // Draw stroke or fill
      ctx.fill();

      // Text styling
      ctx.font = "12px Courier New";
      ctx.fillStyle = "black";
      ctx.globalAlpha = 1;

      ctx.fillText(name, x + 10, y + 20);
    }
  });
}
