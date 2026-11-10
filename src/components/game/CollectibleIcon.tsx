import { CollectibleItem } from '../../game/types';

interface CollectibleIconProps {
  iconKey: CollectibleItem['iconKey'];
  accentHex: string;
  size?: number;
}

export function CollectibleIcon({
  iconKey,
  accentHex,
  size = 28,
}: CollectibleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {iconKey === 'key-tag' && (
        <>
          <circle cx="11" cy="11" r="5" stroke={accentHex} strokeWidth="2.4" />
          <path
            d="M15 15L25 25M21 21L24 18M24 24L27 21"
            stroke={accentHex}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      )}
      {iconKey === 'gnocchi-fork' && (
        <>
          <ellipse cx="16" cy="21" rx="9" ry="5" fill={accentHex} fillOpacity="0.28" stroke={accentHex} strokeWidth="2" />
          <circle cx="13" cy="20" r="2" fill={accentHex} />
          <circle cx="18" cy="21" r="2" fill={accentHex} />
          <circle cx="16" cy="18" r="2" fill={accentHex} />
          <path d="M16 5V13M13 5V10M19 5V10" stroke="#f7ecd8" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {iconKey === 'spice-chai' && (
        <>
          <path
            d="M8 13H21V20C21 23.5 18.2 26 14.5 26C10.8 26 8 23.5 8 20V13Z"
            fill={accentHex}
            fillOpacity="0.28"
            stroke={accentHex}
            strokeWidth="2.2"
          />
          <path d="M21 15H23.5C25 15 26 16.2 26 17.8C26 19.4 25 20.5 23.5 20.5H21" stroke={accentHex} strokeWidth="2" />
          <path d="M12 9C12 7.5 13.5 7 13.5 5.5M17 9C17 7.5 18.5 7 18.5 5.5" stroke="#f7ecd8" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {iconKey === 'birthday-bloom' && (
        <>
          <circle cx="16" cy="12" r="4" fill={accentHex} />
          <circle cx="12" cy="16" r="4" fill={accentHex} fillOpacity="0.85" />
          <circle cx="20" cy="16" r="4" fill={accentHex} fillOpacity="0.85" />
          <circle cx="14" cy="20" r="4" fill={accentHex} fillOpacity="0.75" />
          <circle cx="18" cy="20" r="4" fill={accentHex} fillOpacity="0.75" />
          <circle cx="16" cy="16" r="2.6" fill="#fff3c4" />
        </>
      )}
      {iconKey === 'dad-toast' && (
        <>
          <path d="M9 7H15L14 16C13.8 18 10.2 18 10 16L9 7Z" stroke={accentHex} strokeWidth="2" fill={accentHex} fillOpacity="0.25" />
          <path d="M18 9H24L23 18C22.8 20 19.2 20 19 18L18 9Z" stroke="#f7ecd8" strokeWidth="2" />
          <path d="M12 18V25M9 25H15M21 20V26M18 26H24" stroke={accentHex} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {iconKey === 'yarra-lantern' && (
        <>
          <rect x="10" y="9" width="12" height="15" rx="3" fill={accentHex} fillOpacity="0.3" stroke={accentHex} strokeWidth="2.2" />
          <circle cx="16" cy="16.5" r="3" fill="#fff2c2" />
          <path d="M12 9L14 5H18L20 9M11 26H21" stroke={accentHex} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {(iconKey === 'vinyl-velvet' || iconKey === 'vinyl-starlight') && (
        <>
          <circle cx="16" cy="16" r="11" fill="#1d181c" stroke={accentHex} strokeWidth="2" />
          <circle cx="16" cy="16" r="7.5" stroke={accentHex} strokeOpacity="0.4" strokeWidth="1.2" />
          <circle cx="16" cy="16" r="4" fill={accentHex} />
          <circle cx="16" cy="16" r="1.3" fill="#1d181c" />
        </>
      )}
      {iconKey === 'sunny-collar' && (
        <>
          <path
            d="M16 25C16 25 8 19.5 8 13.5C8 10.5 10.4 8.5 13 8.5C14.6 8.5 15.6 9.4 16 10.4C16.4 9.4 17.4 8.5 19 8.5C21.6 8.5 24 10.5 24 13.5C24 19.5 16 25 16 25Z"
            fill={accentHex}
            stroke="#fff3d1"
            strokeWidth="1.8"
          />
        </>
      )}
      {iconKey === 'arcade-card' && (
        <>
          <rect x="7" y="6" width="18" height="20" rx="3" fill={accentHex} fillOpacity="0.24" stroke={accentHex} strokeWidth="2.2" />
          <circle cx="16" cy="13" r="3" fill="#fff2d6" />
          <path d="M11 21H21" stroke="#fff2d6" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {iconKey === 'cricket-bat' && (
        <>
          <path d="M22 6L26 10L14 22L9 23L10 18L22 6Z" fill={accentHex} fillOpacity="0.35" stroke={accentHex} strokeWidth="2.1" />
          <path d="M6 26L10 22" stroke="#fff2d6" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="23" cy="21" r="3" fill="#e05a52" />
        </>
      )}
      {iconKey === 'claw-plush' && (
        <>
          <path d="M16 4V10M11 13L16 10L21 13" stroke="#fff2d6" strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="20" r="6.5" fill={accentHex} />
          <circle cx="14" cy="19" r="1.1" fill="#1e1816" />
          <circle cx="18" cy="19" r="1.1" fill="#1e1816" />
          <path d="M14.5 22C15.3 22.8 16.7 22.8 17.5 22" stroke="#1e1816" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
