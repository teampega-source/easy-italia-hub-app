import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const t = searchParams.get('t') || 'La comunità srilankese in Italia';
  const s = searchParams.get('s') || 'Guide, strumenti e community per vivere al meglio.';

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '100%', height: '100%',
          background: '#0e0b06',
          display: 'flex',
          flexDirection: 'column',
          padding: '52px 76px',
          fontFamily: 'sans-serif',
        },
        children: [
          {
            type: 'div',
            props: {
              style: { width: '80px', height: '4px', background: '#c8a96e', borderRadius: '2px', marginBottom: '36px' }
            }
          },
          {
            type: 'div',
            props: {
              style: { fontSize: '19px', color: '#7d7058', marginBottom: '36px', display: 'flex' },
              children: 'Easy Italia Hub'
            }
          },
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: '18px', flexGrow: 1, justifyContent: 'center' },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '64px', fontWeight: '700', color: '#e8dcc8',
                      lineHeight: '1.1', letterSpacing: '-0.02em',
                    },
                    children: t,
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: { fontSize: '23px', color: '#a89070', lineHeight: '1.5' },
                    children: s,
                  }
                },
              ]
            }
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingTop: '24px',
                marginTop: '24px',
                borderTop: '1px solid rgba(125,112,88,0.22)',
              },
              children: [
                {
                  type: 'span',
                  props: { style: { color: '#7d7058', fontSize: '17px' }, children: 'easyitaliahub.it' }
                },
                {
                  type: 'span',
                  props: {
                    style: {
                      fontSize: '17px', color: '#c8a96e',
                      background: 'rgba(200,169,110,0.1)',
                      padding: '8px 20px', borderRadius: '999px',
                      display: 'flex',
                    },
                    children: '🇱🇰 → 🇮🇹',
                  }
                },
              ]
            }
          }
        ]
      }
    },
    { width: 1200, height: 630 }
  );
}
