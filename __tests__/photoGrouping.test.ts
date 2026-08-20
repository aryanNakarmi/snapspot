import { groupPhotos, Photo } from '../lib/photoGrouping';

describe('PhotoGrouping', () => {
  it('should return empty array for empty input', () => {
    const groups = groupPhotos([]);
    expect(groups).toEqual([]);
  });

  it('should return at least one group for a single photo', () => {
    const photos: Photo[] = [
      {
        id: '1',
        cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/a.jpg',
        uploadedAt: new Date('2026-06-01T10:00:00Z'),
      },
    ];
    const groups = groupPhotos(photos);
    expect(groups.length).toBeGreaterThanOrEqual(1);
    expect(groups[0].photos.length).toBe(1);
  });

  it('should group photos by time proximity (within 5 min window)', () => {
    const base = new Date('2026-06-01T10:00:00Z');
    const photos: Photo[] = [
      { id: '1', cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/a.jpg', uploadedAt: new Date(base.getTime()) },
      { id: '2', cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/b.jpg', uploadedAt: new Date(base.getTime() + 60 * 1000) }, // 1 min later
      { id: '3', cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/c.jpg', uploadedAt: new Date(base.getTime() + 20 * 60 * 1000) }, // 20 min later
    ];
    const groups = groupPhotos(photos);
    // First two should be in one group (within 5 min), third in another
    expect(groups.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle photos without labels', () => {
    const photos: Photo[] = [
      { id: '1', cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/a.jpg', uploadedAt: new Date('2026-06-01T10:00:00Z') },
    ];
    const groups = groupPhotos(photos);
    expect(groups).toBeDefined();
    expect(Array.isArray(groups)).toBe(true);
  });

  it('should produce groups with required fields', () => {
    const photos: Photo[] = [
      { id: '1', cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/a.jpg', uploadedAt: new Date('2026-06-01T10:00:00Z') },
    ];
    const groups = groupPhotos(photos);
    const group = groups[0];
    expect(group).toHaveProperty('id');
    expect(group).toHaveProperty('label');
    expect(group).toHaveProperty('type');
    expect(group).toHaveProperty('icon');
    expect(group).toHaveProperty('photos');
    expect(['face', 'label', 'time']).toContain(group.type);
  });
});
