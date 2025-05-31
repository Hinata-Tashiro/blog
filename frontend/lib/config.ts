// デフォルトアイキャッチ画像の設定
export const DEFAULT_FEATURED_IMAGE = {
  light: '/images/default-featured-light.svg',
  dark: '/images/default-featured-dark.svg'
};

// サムネイルサイズの設定
export const THUMBNAIL_SIZES = {
  small: '_small',   // 150x150
  medium: '_medium', // 300x300
  large: '_large'    // 800x800
};

// 画像URLヘルパー関数
export function getThumbnailUrl(filename: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  // 現時点ではサムネイル生成が既存画像に対して実行されていないため、
  // オリジナル画像を返す
  // 開発環境ではNginx（ポート80）から画像を取得
  const baseUrl = typeof window !== 'undefined' && window.location.port === '3000' 
    ? 'http://localhost' 
    : '';
  return `${baseUrl}/uploads/images/${filename}`;
  
  // 将来的にサムネイルが生成されたら以下を使用
  // const basePath = '/uploads/images/thumbnails/';
  // const extension = filename.split('.').pop();
  // const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  // return `${baseUrl}${basePath}${nameWithoutExt}${THUMBNAIL_SIZES[size]}.${extension}`;
}