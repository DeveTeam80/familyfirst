export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const params = ['f_auto', 'c_limit', `w_${width}`, `q_${quality || 'auto'}`];
  // Convert basic URL to transformed URL
  // Example input: https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg
  // This logic injects the params after "/upload/"
  if (src.includes('/upload/')) {
      const [base, file] = src.split('/upload/');
      return `${base}/upload/${params.join(',')}/${file}`;
  }
  return src;
}