/**
 * 読了時間を計算するユーティリティ関数
 */

// 日本語の読書速度（文字/分）
const JAPANESE_READING_SPEED = 600;
// 英語の読書速度（単語/分）
const ENGLISH_READING_SPEED = 200;

/**
 * テキストから読了時間を計算
 * @param text - 記事のテキスト
 * @returns 読了時間（分）
 */
export function calculateReadingTime(text: string): number {
  if (!text) return 0;

  // HTMLタグを除去
  const plainText = text.replace(/<[^>]*>/g, '');
  
  // 日本語文字数をカウント（ひらがな、カタカナ、漢字）
  const japaneseCharCount = (plainText.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
  
  // 英語の単語数をカウント（空白で区切られた単語）
  const englishText = plainText.replace(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, ' ');
  const englishWordCount = englishText.split(/\s+/).filter(word => word.length > 0).length;
  
  // 読了時間を計算
  const japaneseReadingTime = japaneseCharCount / JAPANESE_READING_SPEED;
  const englishReadingTime = englishWordCount / ENGLISH_READING_SPEED;
  
  const totalReadingTime = japaneseReadingTime + englishReadingTime;
  
  // 最小1分、小数点以下切り上げ
  return Math.max(1, Math.ceil(totalReadingTime));
}

/**
 * 読了時間を表示用文字列に変換
 * @param minutes - 読了時間（分）
 * @returns 表示用文字列
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return '1分未満';
  if (minutes === 1) return '約1分';
  return `約${minutes}分`;
}