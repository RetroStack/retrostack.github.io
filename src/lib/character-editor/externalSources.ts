/**
 * Character ROM Editor - External Character Set Sources
 *
 * Configuration for loading character sets from external URLs.
 * Each URL should point to a JSON file containing an array of ChargenSourceData objects.
 */

export interface ExternalCharsetSource {
  /** Unique identifier for this source */
  id: string;
  /** Display name for this source */
  name: string;
  /** URL to fetch the character set data from (JSON format) */
  url: string;
  /** Whether this source is enabled */
  enabled: boolean;
}

/**
 * List of external URLs to load character sets from.
 * Each URL should return a JSON array of ChargenSourceData objects.
 *
 * Example JSON format:
 * [
 *   {
 *     "id": "example-charset",
 *     "name": "Example Character Set",
 *     "description": "A sample character set",
 *     "source": "https://example.com",
 *     "width": 8,
 *     "height": 8,
 *     "length": 256,
 *     "manufacturer": "Example Corp",
 *     "system": "Example System",
 *     "chip": "EX-001",
 *     "locale": "English",
 *     "bitDirection": "ltr",
 *     "bitPadding": "right",
 *     "data": [[0, 1, 2, ...], ...]
 *   }
 * ]
 */
export const externalCharsetSources: ExternalCharsetSource[] = [
  // Add external sources here, for example:
  // {
  //   id: "community-charsets",
  //   name: "Community Character Sets",
  //   url: "https://example.com/charsets.json",
  //   enabled: true,
  // },
];

/**
 * Get all enabled external sources
 */
export function getEnabledExternalSources(): ExternalCharsetSource[] {
  return externalCharsetSources.filter((source) => source.enabled);
}
