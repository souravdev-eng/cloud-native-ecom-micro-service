import { Box, styled } from '@mui/material';
import { Link, NavLink } from 'react-router-dom';

// ── Announcement bar ──────────────────────────────────────────────────────────

export const AnnouncementBar = styled(Box)({
    backgroundColor: '#1a1a2e',
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: '8px 20px',
    position: 'relative',
});

export const AnnouncementText = styled('span')({
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap' as const,
    justifyContent: 'center',

    '& strong': { color: '#fff', fontWeight: 700 },
    '& .sep': { color: '#475569', userSelect: 'none' as const },
});

export const AnnouncementClose = styled('button')({
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 4,
    borderRadius: 4,
    transition: 'color 0.15s',
    '&:hover': { color: '#cbd5e1' },
});

// ── Main navbar ───────────────────────────────────────────────────────────────

export const NavBar = styled(Box)({
    backgroundColor: '#fff',
    borderBottom: '1px solid #f1f3f5',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
});

export const NavInner = styled(Box)({
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 32px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    gap: 24,

    '@media (max-width: 768px)': { padding: '0 16px', gap: 12 },
});

// Logo
export const Logo = styled(Link)({
    fontSize: 20,
    fontWeight: 800,
    color: '#0f172a',
    textDecoration: 'none',
    letterSpacing: '-0.5px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    userSelect: 'none',

    '& span': { color: '#2563eb' },
});

// Nav links
export const NavLinks = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,

    '@media (max-width: 900px)': { display: 'none' },
});

export const NavItem = styled(NavLink)({
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    textDecoration: 'none',
    padding: '6px 10px',
    borderRadius: 7,
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',

    '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' },
    '&.active': { backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 },
});

// Search
export const SearchBox = styled('form')({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 9,
    overflow: 'hidden',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    maxWidth: 480,

    '&:focus-within': {
        borderColor: '#2563eb',
        boxShadow: '0 0 0 3px rgba(37,99,235,0.1)',
        backgroundColor: '#fff',
    },
});

export const SearchInput = styled('input')({
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: 13,
    padding: '9px 14px',
    color: '#0f172a',
    minWidth: 0,

    '&::placeholder': { color: '#94a3b8' },
});

export const SearchBtn = styled('button')({
    padding: '0 14px',
    height: 38,
    backgroundColor: '#2563eb',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
    transition: 'background 0.15s',

    '&:hover': { backgroundColor: '#1d4ed8' },
});

// Icon cluster (right side)
export const IconCluster = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    marginLeft: 'auto',
});

export const IconBtn = styled('button')({
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 9,
    border: 'none',
    backgroundColor: 'transparent',
    color: '#374151',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',

    '&:hover': { backgroundColor: '#f1f5f9', color: '#0f172a' },
});

export const Badge = styled(Box)({
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    color: '#fff',
    fontSize: 10,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    lineHeight: 1,
    pointerEvents: 'none',
});

export const Divider = styled(Box)({
    width: 1,
    height: 22,
    backgroundColor: '#e2e8f0',
    flexShrink: 0,
});

// Auth button (shown when logged out)
export const AuthBtn = styled(Link)({
    padding: '7px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    backgroundColor: '#2563eb',
    color: '#fff',
    flexShrink: 0,
    transition: 'background 0.15s',
    whiteSpace: 'nowrap',

    '&:hover': { backgroundColor: '#1d4ed8' },
});

// User dropdown
export const DropdownWrapper = styled(Box)({
    position: 'relative',
});

export const Dropdown = styled(Box)({
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    minWidth: 180,
    zIndex: 200,
    overflow: 'hidden',
    padding: '4px 0',
});

export const DropdownItem = styled(Link)({
    display: 'block',
    padding: '9px 16px',
    fontSize: 13,
    color: '#374151',
    textDecoration: 'none',
    transition: 'background 0.12s',
    '&:hover': { backgroundColor: '#f8fafc' },
});

export const DropdownBtn = styled('button')({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '9px 16px',
    fontSize: 13,
    color: '#374151',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.12s',
    '&:hover': { backgroundColor: '#f8fafc' },
});

export const DropdownDivider = styled(Box)({
    height: 1,
    backgroundColor: '#f1f3f5',
    margin: '4px 0',
});

export const DropdownLogout = styled(DropdownBtn)({
    color: '#dc2626',
    '&:hover': { backgroundColor: '#fff5f5' },
});

// ── Search suggestions ────────────────────────────────────────────────────────

export const SearchWrapper = styled(Box)({
    position: 'relative',
    flex: 1,
    maxWidth: 480,
});

export const SuggestionsDropdown = styled(Box)({
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 300,
    overflow: 'hidden',
    maxHeight: 400,
    overflowY: 'auto',
});

export const SuggestionItem = styled('button')({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.12s',

    '&:hover, &[data-active="true"]': {
        backgroundColor: '#f1f5f9',
    },

    '& em': {
        fontStyle: 'normal',
        fontWeight: 700,
        color: '#2563eb',
    },
});

export const SuggestionImage = styled('img')({
    width: 36,
    height: 36,
    borderRadius: 6,
    objectFit: 'cover',
    flexShrink: 0,
    backgroundColor: '#f8fafc',
});

export const SuggestionInfo = styled(Box)({
    flex: 1,
    minWidth: 0,
});

export const SuggestionTitle = styled('span')({
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

export const SuggestionMeta = styled('span')({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
});

export const SuggestionPrice = styled('span')({
    fontSize: 13,
    fontWeight: 600,
    color: '#0f172a',
    flexShrink: 0,
});
