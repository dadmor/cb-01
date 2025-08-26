// ===== src/views/layout/Logo.tsx =====
export const Logo: React.FC = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    className="group-hover:scale-105 transition-transform"
  >
    {/* Film strip background */}
    <rect x="4" y="8" width="24" height="16" fill="#E84E36" rx="1" />

    {/* Top perforations */}
    <rect x="7" y="10" width="2" height="3" fill="#1a1a1a" />
    <rect x="11" y="10" width="2" height="3" fill="#1a1a1a" />
    <rect x="15" y="10" width="2" height="3" fill="#1a1a1a" />
    <rect x="19" y="10" width="2" height="3" fill="#1a1a1a" />
    <rect x="23" y="10" width="2" height="3" fill="#1a1a1a" />

    {/* Bottom perforations */}
    <rect x="7" y="19" width="2" height="3" fill="#1a1a1a" />
    <rect x="11" y="19" width="2" height="3" fill="#1a1a1a" />
    <rect x="15" y="19" width="2" height="3" fill="#1a1a1a" />
    <rect x="19" y="19" width="2" height="3" fill="#1a1a1a" />
    <rect x="23" y="19" width="2" height="3" fill="#1a1a1a" />

    {/* Center frames */}
    <rect x="8" y="14.5" width="4" height="3" fill="white" opacity="0.9" />
    <rect x="14" y="14.5" width="4" height="3" fill="white" opacity="0.9" />
    <rect x="20" y="14.5" width="4" height="3" fill="white" opacity="0.9" />
  </svg>
);
