export async function compressImage(file: File, maxBytes = 5 * 1024 * 1024, maxW = 1920) {
  if (file.size <= maxBytes) return file;

  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bmp.width);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);

  let q = 0.9;
  let blob: Blob | null = null;
  while (q >= 0.5) {
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), "image/jpeg", q);
    });
    if (blob.size <= maxBytes) break;
    q -= 0.1;
  }

  return new File([blob!], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}
