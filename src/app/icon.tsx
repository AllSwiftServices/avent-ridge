import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'hsl(47, 100%, 50%)', // Vibrant Yellow
            borderRadius: '20%', 
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: 'black',
              fontFamily: 'sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            AR
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
