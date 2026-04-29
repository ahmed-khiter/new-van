import { getFileUrl } from "@/utils/helper";

/**
 * Resolve stored image path: absolute URL as-is, otherwise S3 key via getFileUrl.
 */
export function resolveHomepageMediaUrl(value) {
  if (!value || typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return v;
  return getFileUrl(v) || v;
}

/**
 * @param {object|null|undefined} filter - { onlyIn?: string[], excludeIn?: string[] }
 * @param {object|null|undefined} selectedLocation - { code?: string }
 */
export function passesHomepageLocationFilter(filter, selectedLocation) {
  if (!filter || typeof filter !== "object") return true;
  const code = selectedLocation?.code;
  const onlyIn = Array.isArray(filter.onlyIn) ? filter.onlyIn : null;
  const excludeIn = Array.isArray(filter.excludeIn) ? filter.excludeIn : null;
  if (onlyIn?.length) {
    if (!code || !onlyIn.includes(code)) return false;
  }
  if (excludeIn?.length && code && excludeIn.includes(code)) return false;
  return true;
}

/**
 * Map Prisma `services` row to the shape expected by `ServicesFilter` / homepage (legacy helper shape).
 */
export function mapDbServiceToFrontendShape(row) {
  const id = row.legacyKey;
  if (!id) return null;

  const displayName = row.cardTitle?.trim() || row.name;
  const listImg =
    resolveHomepageMediaUrl(row.listImage) ||
    resolveHomepageMediaUrl(row.sliderImage) ||
    "/assets/img/categories/all.png";
  const sliderImg =
    resolveHomepageMediaUrl(row.sliderImage) ||
    resolveHomepageMediaUrl(row.listImage) ||
    listImg;
  const previewVideo = row.previewVideo
    ? resolveHomepageMediaUrl(row.previewVideo)
    : undefined;
  const previewPoster = row.previewPoster
    ? resolveHomepageMediaUrl(row.previewPoster)
    : undefined;

  const images = {
    background: sliderImg,
    slider: sliderImg,
    list_service_img: listImg,
  };
  if (previewVideo) images.preview_video = previewVideo;
  if (previewPoster) images.preview_poster = previewPoster;

  return {
    id,
    dbId: row.id,
    name: displayName,
    description: row.description || "",
    basePrice: row.base_price != null ? Number(row.base_price) : 0,
    images,
    routeHref: row.routeHref?.trim() || undefined,
    locationFilter: row.locationFilter ?? undefined,
  };
}

export function filterHomepageServicesByLocation(services, selectedLocation) {
  return services.filter((s) =>
    passesHomepageLocationFilter(s.locationFilter, selectedLocation)
  );
}
