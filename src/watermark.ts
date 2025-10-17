export async function addWatermark(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const fontSize = Math.max(12, img.height * 0.03);
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      
      const text = 'teycirbensoltane.tn';
      const padding = 10;
      const x = img.width - ctx.measureText(text).width - padding;
      const y = img.height - padding;
      
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}
