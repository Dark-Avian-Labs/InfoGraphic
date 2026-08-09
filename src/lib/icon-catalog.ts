export interface IconCatalogEntry {
  slug: string;
  title: string;
  hex: string;
}

let catalogCache: IconCatalogEntry[] | null = null;

export async function loadIconCatalog(): Promise<IconCatalogEntry[]> {
  if (catalogCache) return catalogCache;

  const icons = await import('simple-icons');
  const entries: IconCatalogEntry[] = [];

  for (const [key, value] of Object.entries(icons)) {
    if (
      !key.startsWith('si') ||
      key.endsWith('Hex') ||
      typeof value !== 'object' ||
      value === null
    ) {
      continue;
    }

    const icon = value as { slug?: string; title?: string; hex?: string };
    if (!icon.slug || !icon.title || !icon.hex) continue;

    entries.push({ slug: icon.slug, title: icon.title, hex: `#${icon.hex}` });
  }

  entries.sort((a, b) => a.title.localeCompare(b.title));
  catalogCache = entries;
  return entries;
}

export const HOMELAB_ICON_SLUGS = [
  'proxmox',
  'docker',
  'pfsense',
  'cisco',
  'truenas',
  'nginx',
  'wireguard',
  'cloudflare',
  'grafana',
  'prometheus',
  'plex',
  'homeassistant',
  'linux',
  'apple',
  'ubiquiti',
  'letsencrypt',
  'kubernetes',
  'portainer',
  'tailscale',
  'pihole',
  'unifi',
  'synology',
  'qnap',
  'hetzner',
  'digitalocean',
  'ansible',
  'terraform',
  'gitlab',
  'github',
  'bitwarden',
];
