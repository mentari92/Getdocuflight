import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'GetDocuFlight';
export const size = {
    width: 32,
    height: 32,
};
export const contentType = 'image/png';

// Image generation
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
                    background: 'transparent',
                }}
            >
                <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9333EA"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M2 22h20" />
                    <path d="M6.36 17.4 4 17l-2-4 1.1-.55L4 15l2.1 1 1.1 3.5 1.1-.55L7.36 15.4l1.1-5.1a1 1 0 0 1 1.34-.76l10.4 3.7a1 1 0 0 1 .6 1.34l-.45.9a1 1 0 0 1-1.34.6l-2.6-.9-9 3.5Z" />
                </svg>
            </div>
        ),
        {
            ...size,
        }
    );
}
