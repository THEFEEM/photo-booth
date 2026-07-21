export const PRICE_PER_PHOTO_THB = 15;
export const MIN_PHOTOS = 1;
export const MAX_PHOTOS = 99;
export const MIN_PARTY = 1;
export const MAX_PARTY = 10;

export function calcAmountThb(photoCount: number): number {
  if (!Number.isInteger(photoCount) || photoCount < MIN_PHOTOS || photoCount > MAX_PHOTOS) {
    throw new Error(`จำนวนรูปต้องอยู่ระหว่าง ${MIN_PHOTOS}–${MAX_PHOTOS}`);
  }
  return photoCount * PRICE_PER_PHOTO_THB;
}
