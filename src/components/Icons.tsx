import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const icon = (path: string, viewBox = '0 0 24 24') =>
  function Icon({ size = 16, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d={path} />
      </svg>
    );
  };

const icon2 = (paths: string[], viewBox = '0 0 24 24') =>
  function Icon({ size = 16, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {paths.map((d, i) => <path key={i} d={d} />)}
      </svg>
    );
  };

export const CrossIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2v8M4 9h16M12 2L7 9M12 2l5 7" />
    <path d="M7 9v6a5 5 0 0010 0V9" />
  </svg>
);

export const BookIcon = icon2([
  'M4 19.5A2.5 2.5 0 016.5 17H20',
  'M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
]);

export const UsersIcon = icon2([
  'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2',
  'M9 11a4 4 0 100-8 4 4 0 000 8z',
  'M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
]);

export const SearchIcon = icon2([
  'M11 19a8 8 0 100-16 8 8 0 000 16z',
  'M21 21l-4.35-4.35',
]);

export const PlusIcon = icon('M12 5v14M5 12h14');

export const MicIcon = icon2([
  'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z',
  'M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8',
]);

export const MicOffIcon = icon2([
  'M1 1l22 22',
  'M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6',
  'M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4M8 23h8',
]);

export const CheckIcon = icon('M20 6L9 17l-5-5');

export const CheckCircleIcon = icon2([
  'M22 11.08V12a10 10 0 11-5.93-9.14',
  'M22 4L12 14.01l-3-3',
]);

export const CircleIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export const XIcon = icon('M18 6L6 18M6 6l12 12');

export const XCircleIcon = icon2([
  'M12 22a10 10 0 100-20 10 10 0 000 20z',
  'M15 9l-6 6M9 9l6 6',
]);

export const ChevronLeftIcon = icon('M15 18l-6-6 6-6');

export const ChevronRightIcon = icon('M9 18l6-6-6-6');

export const ChevronDownIcon = icon('M6 9l6 6 6-6');

export const LockIcon = icon2([
  'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z',
  'M7 11V7a5 5 0 0110 0v4',
]);

export const UnlockIcon = icon2([
  'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z',
  'M7 11V7a5 5 0 019.9-1',
]);

export const EditIcon = icon2([
  'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7',
  'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
]);

export const LogOutIcon = icon2([
  'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4',
  'M16 17l5-5-5-5M21 12H9',
]);

export const BarChartIcon = icon2([
  'M18 20V10',
  'M12 20V4',
  'M6 20v-6',
]);

export const ActivityIcon = icon('M22 12h-4l-3 9L9 3l-3 9H2');

export const RefreshIcon = icon2([
  'M23 4v6h-6',
  'M1 20v-6h6',
  'M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
]);

export const StopIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

export const PlayIcon = ({ size = 16, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

export const FilterIcon = icon2([
  'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
]);

export const UserIcon = icon2([
  'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2',
  'M12 11a4 4 0 100-8 4 4 0 000 8z',
]);

export const AlertIcon = icon2([
  'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  'M12 9v4M12 17h.01',
]);
