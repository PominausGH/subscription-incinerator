import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Subscription Incinerator'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #7c2d12 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, fontSize: 32 }}>
          <span style={{ fontSize: 72 }}>🔥</span>
          <span style={{ fontWeight: 600 }}>Subscription Incinerator</span>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000, marginBottom: 24 }}>
          Track &amp; cancel forgotten subscriptions
        </div>
        <div style={{ fontSize: 28, color: '#fb923c', maxWidth: 1000 }}>
          Free trial alerts. Hidden charges. All in one place.
        </div>
      </div>
    ),
    { ...size },
  )
}
