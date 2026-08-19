import * as SimpleIcons from '@icons-pack/react-simple-icons';
import { createElement, type ComponentType, type ReactNode, type SVGProps } from 'react';

type IconComponent = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string; color?: string }
>;

const slugToExportName = (slug: string): string => {
  const parts = slug
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());

  return `Si${parts.join('')}`;
};

const iconCache = new Map<string, IconComponent | null>();

export function getBrandIcon(slug?: string): IconComponent | null {
  if (!slug) return null;

  const cached = iconCache.get(slug);
  if (cached !== undefined) return cached;

  const exportName = slugToExportName(slug);
  const icon =
    (SimpleIcons as unknown as Record<string, IconComponent | undefined>)[exportName] ?? null;
  iconCache.set(slug, icon);
  return icon;
}

export function getBrandColor(slug?: string): string | undefined {
  if (!slug) return undefined;
  const exportName = `${slugToExportName(slug)}Hex`;
  return (SimpleIcons as unknown as Record<string, string | undefined>)[exportName];
}

export function BrandIcon({
  slug,
  color,
  size,
  children,
}: {
  slug?: string;
  color?: string;
  size?: number;
  children?: ReactNode;
}) {
  const icon = getBrandIcon(slug);
  if (!icon) return children ?? null;
  return createElement(icon, { color, size });
}
