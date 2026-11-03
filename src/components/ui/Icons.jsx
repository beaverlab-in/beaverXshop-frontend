// Minimal inline icon set (stroke icons, 24x24). Decorative by default (aria-hidden).
function make(children, { fill = false } = {}) {
  return function Icon({ className = "size-5", ...props }) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill={fill ? "currentColor" : "none"}
        stroke={fill ? "none" : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {children}
      </svg>
    );
  };
}

export const CodeIcon = make(<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14" />);
export const ArrowRightIcon = make(<path d="M5 12h14M13 6l6 6-6 6" />);
export const ArrowLeftIcon = make(<path d="M19 12H5M11 6l-6 6 6 6" />);
export const CartIcon = make(
  <>
    <path d="M3 4h2.2l1.6 10.2a1.5 1.5 0 0 0 1.5 1.3h8.1a1.5 1.5 0 0 0 1.5-1.1L19.5 8H6" />
    <circle cx="9.5" cy="19.5" r="1.3" />
    <circle cx="16.5" cy="19.5" r="1.3" />
  </>,
);
export const UserIcon = make(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </>,
);
export const MenuIcon = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const CloseIcon = make(<path d="M6 6l12 12M18 6L6 18" />);
export const CheckIcon = make(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const MinusIcon = make(<path d="M5 12h14" />);
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />);
export const TrashIcon = make(
  <>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />
    <path d="M10 11v6M14 11v6" />
  </>,
);
export const ChevronDownIcon = make(<path d="M6 9l6 6 6-6" />);
export const ChevronRightIcon = make(<path d="M9 6l6 6-6 6" />);
export const AlertIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5v.01" />
  </>,
);
export const LockIcon = make(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </>,
);
export const TruckIcon = make(
  <>
    <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
    <circle cx="7.5" cy="17.5" r="1.7" />
    <circle cx="17" cy="17.5" r="1.7" />
  </>,
);
export const WrenchIcon = make(
  <path d="M14.5 6.5a4 4 0 0 0 5 5l-9.2 9.2a2.1 2.1 0 0 1-3-3l9.2-9.2zM14.5 6.5L17 4l3 3-2.5 2.5" />,
);
export const ChipIcon = make(
  <>
    <rect x="7" y="7" width="10" height="10" rx="1.5" />
    <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
  </>,
);
export const BookIcon = make(
  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20" />,
);
export const SparkIcon = make(<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 16l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />);
export const GlobeIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.7 2.7 2.7 15.3 0 18M12 3c-2.7 2.7-2.7 15.3 0 18" />
  </>,
);
export const MapPinIcon = make(
  <>
    <path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </>,
);
export const PackageIcon = make(<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5zM3.5 7.5L12 12l8.5-4.5M12 12v9" />);
export const DownloadIcon = make(<path d="M12 4v11M7 11l5 5 5-5M5 20h14" />);
export const ExternalIcon = make(<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />);

// ---- admin panel icons ----
export const DashboardIcon = make(<path d="M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z" />);
export const ListIcon = make(<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />);
export const TagIcon = make(
  <>
    <path d="M3 12V4h8l10 10-8 8z" />
    <circle cx="7.5" cy="8.5" r="1.2" />
  </>,
);
export const BoxesIcon = make(<path d="M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8" />);
export const UsersIcon = make(
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
  </>,
);
export const ReceiptIcon = make(<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />);
export const ChartIcon = make(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />);
export const SettingsIcon = make(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" />
  </>,
);
export const ShieldIcon = make(<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />);
export const BellIcon = make(<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4" />);
export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </>,
);
export const LogoutIcon = make(<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" />);
export const StoreIcon = make(<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9a3 3 0 0 0 5.3 1.9A3 3 0 0 0 14.7 10.9 3 3 0 0 0 20 9M10 20v-5h4v5" />);
export const MessageIcon = make(<path d="M4 5h16v11H9l-5 4z" />);
