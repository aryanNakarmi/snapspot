import { isAllowedImageUrl } from '../lib/safeImageUrl';

describe('isAllowedImageUrl', () => {
  it('should accept valid Cloudinary HTTPS URLs', () => {
    expect(isAllowedImageUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg')).toBe(true);
  });

  it('should reject HTTP URLs', () => {
    expect(isAllowedImageUrl('http://res.cloudinary.com/demo/image/upload/sample.jpg')).toBe(false);
  });

  it('should reject non-Cloudinary domains', () => {
    expect(isAllowedImageUrl('https://evil.com/image.jpg')).toBe(false);
  });

  it('should reject internal network URLs', () => {
    expect(isAllowedImageUrl('http://192.168.1.1/admin')).toBe(false);
  });

  it('should reject localhost URLs', () => {
    expect(isAllowedImageUrl('http://localhost:3000/api/secret')).toBe(false);
  });

  it('should reject invalid URLs', () => {
    expect(isAllowedImageUrl('not-a-url')).toBe(false);
  });
});
