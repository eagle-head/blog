// src/lib/og.ts
// Build an Open Graph PNG for a single entry: returns a PNG Buffer.
import fs from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import type { Locale } from './content';

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts', 'og');

let cachedFonts: { name: string; data: Uint8Array; weight: 400 | 700; style: 'normal' }[] | null = null;

async function loadFonts() {
  if (cachedFonts) return cachedFonts;
  const [regular, bold] = await Promise.all([
    fs.readFile(path.join(FONT_DIR, 'Inter-Regular.woff')),
    fs.readFile(path.join(FONT_DIR, 'Inter-Bold.woff')),
  ]);
  // Fonts are WOFF (not WOFF2) so Satori's opentype.js can decode them
  // directly. Copied from @fontsource/inter at font-install time.
  cachedFonts = [
    { name: 'Inter', data: new Uint8Array(regular), weight: 400, style: 'normal' },
    { name: 'Inter', data: new Uint8Array(bold), weight: 700, style: 'normal' },
  ];
  return cachedFonts;
}

export type OgParams = {
  kind: 'paper' | 'post';
  title: string;
  description: string;
  date: Date;
  locale: Locale;
};

export async function renderOgImage(params: OgParams): Promise<Buffer> {
  const fonts = await loadFonts();
  const dateLabel = new Intl.DateTimeFormat(params.locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(params.date);
  const kindLabel = params.kind === 'paper' ? 'PAPER' : 'POST';
  const accent = '#9d174d';

  const tree = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '1200px',
        height: '630px',
        padding: '64px 80px',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fef3c7 100%)',
        fontFamily: 'Inter',
        color: '#0a0a0a',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '16px' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '20px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    color: accent,
                  },
                  children: `${kindLabel} · ${dateLabel.toUpperCase()}`,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '64px',
                    fontWeight: 700,
                    lineHeight: 1.08,
                    letterSpacing: '-0.025em',
                    maxWidth: '1040px',
                  },
                  children: params.title,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '28px',
                    fontWeight: 400,
                    lineHeight: 1.4,
                    color: '#262626',
                    maxWidth: '1040px',
                  },
                  children: params.description,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              fontSize: '24px',
              fontWeight: 700,
              color: '#0a0a0a',
            },
            children: 'Eduardo Kohn · kohn.dev',
          },
        },
      ],
    },
  };

  const svg = await satori(tree, {
    width: 1200,
    height: 630,
    fonts,
  });

  const resvg = new Resvg(svg);
  const pngBuffer = resvg.render().asPng();
  return Buffer.from(pngBuffer);
}
