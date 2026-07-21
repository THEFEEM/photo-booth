export const PRICE_PER_PHOTO_THB = 15;
export const MIN_PHOTOS = 1;
export const MAX_PHOTOS = 3;
export const MIN_PARTY = 1;
export const MAX_PARTY = 10;

export function calcAmountThb(photoCount: number): number {
  if (!Number.isInteger(photoCount) || photoCount < MIN_PHOTOS || photoCount > MAX_PHOTOS) {
    throw new Error("จำนวนรูปไม่ถูกต้อง");
  }
  return photoCount * PRICE_PER_PHOTO_THB;
}
