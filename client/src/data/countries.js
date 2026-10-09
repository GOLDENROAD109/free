/**
 * Country selector data — mirrors the server-side PPP table
 * (server/utils/ppp.js). Codes are ISO 3166-1 alpha-2, each tagged with its
 * world region so the Courses page can offer an "all regions of the world"
 * dropdown grouped by continent.
 */
export const COUNTRIES = [
  // 🌎 North America
  { code: 'US', name: 'United States', region: 'North America' },
  { code: 'CA', name: 'Canada', region: 'North America' },
  { code: 'MX', name: 'Mexico', region: 'North America' },

  // 🌎 South America
  { code: 'BR', name: 'Brazil', region: 'South America' },
  { code: 'AR', name: 'Argentina', region: 'South America' },
  { code: 'CL', name: 'Chile', region: 'South America' },
  { code: 'CO', name: 'Colombia', region: 'South America' },
  { code: 'PE', name: 'Peru', region: 'South America' },

  // 🌍 Europe
  { code: 'GB', name: 'United Kingdom', region: 'Europe' },
  { code: 'IE', name: 'Ireland', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', region: 'Europe' },
  { code: 'DE', name: 'Germany', region: 'Europe' },
  { code: 'FR', name: 'France', region: 'Europe' },
  { code: 'AT', name: 'Austria', region: 'Europe' },
  { code: 'BE', name: 'Belgium', region: 'Europe' },
  { code: 'FI', name: 'Finland', region: 'Europe' },
  { code: 'ES', name: 'Spain', region: 'Europe' },
  { code: 'IT', name: 'Italy', region: 'Europe' },
  { code: 'PT', name: 'Portugal', region: 'Europe' },
  { code: 'GR', name: 'Greece', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', region: 'Europe' },
  { code: 'NO', name: 'Norway', region: 'Europe' },
  { code: 'SE', name: 'Sweden', region: 'Europe' },
  { code: 'DK', name: 'Denmark', region: 'Europe' },
  { code: 'PL', name: 'Poland', region: 'Europe' },
  { code: 'CZ', name: 'Czechia', region: 'Europe' },
  { code: 'HU', name: 'Hungary', region: 'Europe' },
  { code: 'RO', name: 'Romania', region: 'Europe' },
  { code: 'UA', name: 'Ukraine', region: 'Europe' },
  { code: 'RU', name: 'Russia', region: 'Europe' },

  // 🌍 Africa
  { code: 'ZA', name: 'South Africa', region: 'Africa' },
  { code: 'NG', name: 'Nigeria', region: 'Africa' },
  { code: 'KE', name: 'Kenya', region: 'Africa' },
  { code: 'EG', name: 'Egypt', region: 'Africa' },
  { code: 'GH', name: 'Ghana', region: 'Africa' },

  // 🌏 Asia
  { code: 'SG', name: 'Singapore', region: 'Asia' },
  { code: 'JP', name: 'Japan', region: 'Asia' },
  { code: 'KR', name: 'South Korea', region: 'Asia' },
  { code: 'IL', name: 'Israel', region: 'Asia' },
  { code: 'AE', name: 'United Arab Emirates', region: 'Asia' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Asia' },
  { code: 'KZ', name: 'Kazakhstan', region: 'Asia' },
  { code: 'TR', name: 'Türkiye', region: 'Asia' },
  { code: 'CN', name: 'China', region: 'Asia' },
  { code: 'MY', name: 'Malaysia', region: 'Asia' },
  { code: 'TH', name: 'Thailand', region: 'Asia' },
  { code: 'VN', name: 'Vietnam', region: 'Asia' },
  { code: 'PH', name: 'Philippines', region: 'Asia' },
  { code: 'IN', name: 'India', region: 'Asia' },
  { code: 'PK', name: 'Pakistan', region: 'Asia' },
  { code: 'BD', name: 'Bangladesh', region: 'Asia' },
  { code: 'LK', name: 'Sri Lanka', region: 'Asia' },
  { code: 'NP', name: 'Nepal', region: 'Asia' },
  { code: 'MM', name: 'Myanmar', region: 'Asia' },

  // 🌏 Oceania
  { code: 'AU', name: 'Australia', region: 'Oceania' },
  { code: 'NZ', name: 'New Zealand', region: 'Oceania' },
];

/** Display order for the region-grouped dropdown. */
export const REGION_ORDER = [
  'North America',
  'South America',
  'Europe',
  'Africa',
  'Asia',
  'Oceania',
];

/** Small flag-ish emoji per region for the dropdown groups. */
export const REGION_EMOJI = {
  'North America': '🌎',
  'South America': '🌎',
  Europe: '🌍',
  Africa: '🌍',
  Asia: '🌏',
  Oceania: '🌏',
};

/**
 * Groups every country by world region, in REGION_ORDER.
 * @returns {Array<{ region: string, countries: Array }>}
 */
export function countriesByRegion() {
  return REGION_ORDER.map((region) => ({
    region,
    countries: COUNTRIES.filter((c) => c.region === region),
  })).filter((group) => group.countries.length > 0);
}

/** Best-effort country guess from the browser timezone (dropdown default). */
export function guessCountryCode() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const map = [
      ['Kolkata', 'IN'],
      ['Calcutta', 'IN'],
      ['Karachi', 'PK'],
      ['Dhaka', 'BD'],
      ['Lahore', 'PK'],
      ['Sao_Paulo', 'BR'],
      ['Rio', 'BR'],
      ['Mexico', 'MX'],
      ['Bogota', 'CO'],
      ['Lima', 'PE'],
      ['Santiago', 'CL'],
      ['Buenos_Aires', 'AR'],
      ['Johannesburg', 'ZA'],
      ['Cairo', 'EG'],
      ['Lagos', 'NG'],
      ['Nairobi', 'KE'],
      ['Accra', 'GH'],
      ['Istanbul', 'TR'],
      ['Kyiv', 'UA'],
      ['Kiev', 'UA'],
      ['Jakarta', 'ID'],
      ['Bangkok', 'TH'],
      ['Ho_Chi_Minh', 'VN'],
      ['Manila', 'PH'],
      ['Kuala_Lumpur', 'MY'],
      ['Singapore', 'SG'],
      ['Hong_Kong', 'CN'],
      ['Shanghai', 'CN'],
      ['Taipei', 'KR'],
      ['Tokyo', 'JP'],
      ['Seoul', 'KR'],
      ['Sydney', 'AU'],
      ['Auckland', 'NZ'],
      ['London', 'GB'],
      ['Dublin', 'IE'],
      ['Berlin', 'DE'],
      ['Munich', 'DE'],
      ['Paris', 'FR'],
      ['Madrid', 'ES'],
      ['Rome', 'IT'],
      ['Lisbon', 'PT'],
      ['Amsterdam', 'NL'],
      ['Brussels', 'BE'],
      ['Vienna', 'AT'],
      ['Zurich', 'CH'],
      ['Stockholm', 'SE'],
      ['Oslo', 'NO'],
      ['Copenhagen', 'DK'],
      ['Helsinki', 'FI'],
      ['Warsaw', 'PL'],
      ['Prague', 'CZ'],
      ['Budapest', 'HU'],
      ['Bucharest', 'RO'],
      ['Tel_Aviv', 'IL'],
      ['Dubai', 'AE'],
      ['Riyadh', 'SA'],
      ['Almaty', 'KZ'],
      ['Toronto', 'CA'],
      ['Vancouver', 'CA'],
      ['New_York', 'US'],
      ['Chicago', 'US'],
      ['Los_Angeles', 'US'],
      ['Denver', 'US'],
    ];
    for (const [needle, code] of map) {
      if (tz.includes(needle)) return code;
    }
  } catch {
    /* fall through */
  }
  return 'US';
}
