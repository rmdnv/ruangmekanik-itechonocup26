export function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }

      const maxSize = Math.max(image.width, image.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

      canvas.width = safeArea;
      canvas.height = safeArea;

      ctx.translate(safeArea / 2, safeArea / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-safeArea / 2, -safeArea / 2);

      ctx.drawImage(image, (safeArea - image.width) / 2, (safeArea - image.height) / 2);

      const data = ctx.getImageData(
        safeArea / 2 - pixelCrop.width / 2,
        safeArea / 2 - pixelCrop.height / 2,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx.putImageData(data, 0, 0);

      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    };
    image.src = imageSrc;
  });
}
