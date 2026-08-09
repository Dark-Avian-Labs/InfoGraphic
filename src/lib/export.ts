const EXPORT_STYLE_PROPS = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-opacity',
  'fill-opacity',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'letter-spacing',
] as const;

/** Clone an on-screen canvas SVG and bake computed paints so exports work without App.css. */
export function prepareSvgForExport(svgElement: SVGSVGElement): SVGSVGElement {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const sourceNodes = [svgElement, ...Array.from(svgElement.querySelectorAll('*'))];
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))];

  for (let i = 0; i < sourceNodes.length; i++) {
    const source = sourceNodes[i];
    const target = cloneNodes[i];
    if (!(source instanceof SVGElement) || !(target instanceof SVGElement)) continue;

    const computed = getComputedStyle(source);
    for (const prop of EXPORT_STYLE_PROPS) {
      const value = computed.getPropertyValue(prop).trim();
      if (!value || value === 'none' || value === 'normal') continue;
      if (prop === 'opacity' && value === '1') continue;
      if ((prop === 'fill-opacity' || prop === 'stroke-opacity') && value === '1') continue;
      target.style.setProperty(prop, value);
    }
  }

  // Drop interactive chrome from exports
  clone
    .querySelectorAll(
      '[data-export-ignore="true"], .lane-guides, .riser-guides, .node-resize-handle',
    )
    .forEach((el) => {
      el.remove();
    });
  clone.classList.remove('infographic-canvas--interactive');

  return clone;
}

function readCanvasBackground(svgElement: SVGSVGElement): string {
  const fromVar = getComputedStyle(svgElement).getPropertyValue('--canvas-bg').trim();
  if (fromVar) return fromVar;
  const bg = svgElement.querySelector('.canvas-bg');
  if (bg) {
    const fill = getComputedStyle(bg).fill;
    if (fill && fill !== 'none') return fill;
  }
  return '#f8fafc';
}

export function downloadSvg(svgElement: SVGSVGElement, filename: string) {
  const clone = prepareSvgForExport(svgElement);

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clone);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, filename.endsWith('.svg') ? filename : `${filename}.svg`);
}

export async function downloadPng(svgElement: SVGSVGElement, filename: string, scale = 2) {
  const clone = prepareSvgForExport(svgElement);
  const background = readCanvasBackground(svgElement);

  const width = Number(svgElement.getAttribute('width') ?? 1600);
  const height = Number(svgElement.getAttribute('height') ?? 1100);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), 'image/png'),
    );
    if (!pngBlob) throw new Error('Failed to create PNG');

    triggerDownload(pngBlob, filename.endsWith('.png') ? filename : `${filename}.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img), { once: true });
    img.addEventListener('error', () => reject(new Error('Failed to render SVG')), { once: true });
    img.src = url;
  });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
