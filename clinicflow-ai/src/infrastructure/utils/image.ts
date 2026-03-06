const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo procesar la imagen"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });

export const compressImageToTarget = async (
  file: File,
  maxBytes = 80 * 1024,
  maxDimension = 640,
): Promise<File> => {
  const image = await loadImage(file);
  let { width, height } = image;
  const maxSide = Math.max(width, height);
  const scale = maxSide > maxDimension ? maxDimension / maxSide : 1;
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar la imagen");
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  let quality = 0.85;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > maxBytes && quality > 0.5) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  while (blob.size > maxBytes) {
    width = Math.round(width * 0.9);
    height = Math.round(height * 0.9);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    quality = 0.75;
    blob = await canvasToBlob(canvas, quality);
    if (width < 240 || height < 240) break;
  }

  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
    type: blob.type,
  });
};
