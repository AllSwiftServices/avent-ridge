import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'hsl(47, 100%, 50%)',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: 'black',
            fontFamily: 'sans-serif',
            marginBottom: -10,
          }}
        >
          AR
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: 'black',
            fontFamily: 'sans-serif',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          TRADING
        </div>
      </div>
    ),
    { ...size }
  );
}
