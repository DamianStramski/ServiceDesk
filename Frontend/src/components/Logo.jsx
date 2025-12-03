export default function Logo({ size = 'medium' }) {
    const dimensions = {
        small: { width: 32, height: 32, fontSize: '1.2rem' },
        medium: { width: 48, height: 48, fontSize: '1.5rem' },
        large: { width: 64, height: 64, fontSize: '2rem' }
    };

    const { width, height, fontSize } = dimensions[size];

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', justifyContent: 'center' }}>
            <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{
                fontWeight: 'bold',
                fontSize: fontSize,
                background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.025em'
            }}>
                ServiceDesk
            </span>
        </div>
    );
}
