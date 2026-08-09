/**
 * Shared helper for server-side image fetching.
 *
 * The /api/moderate and /api/analyze routes fetch an image URL server-side
 * and send it to third-party AI services. Without restrictions, any caller
 * could point those routes at arbitrary internal/external URLs (SSRF) and
 * burn the API quota. We therefore only allow HTTPS URLs from Cloudinary —
 * the only source of images in this app.
 */

const ALLOWED_HOSTS = ['res.cloudinary.com'];

export function isAllowedImageUrl(imageUrl: string): boolean {
  try {
    const parsed = new URL(imageUrl);
    return (
      parsed.protocol === 'https:' &&
      ALLOWED_HOSTS.includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}
