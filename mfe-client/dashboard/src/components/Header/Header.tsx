import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/SearchRounded';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorderRounded';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineRounded';
import CloseIcon from '@mui/icons-material/CloseRounded';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDownRounded';

import { useAuth } from '../../hooks/useAuth';
import { productSearchApi } from '../../api/baseUrl';
import Footer from '../Footer/Footer';
import * as S from './Header.styles';

interface Suggestion {
    id: string;
    title: string;
    category: string;
    price: number;
    image?: string;
    productId: string;
    highlight: string;
}

const NAV_LINKS = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
    { label: 'About', to: '/about-us' },
    { label: 'Blog', to: '/blog' },
];

const Header = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const [showAnnouncement, setShowAnnouncement] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchWrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Debounced autocomplete fetch
    const fetchSuggestions = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        try {
            const res = await productSearchApi.get(`/suggest?q=${encodeURIComponent(q.trim())}`);
            const items = res.data?.suggestions ?? [];
            setSuggestions(items);
            setShowSuggestions(items.length > 0);
            setActiveIdx(-1);
        } catch {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
    };

    const selectSuggestion = (s: Suggestion) => {
        setSearchQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
        navigate(`/product/${s.productId || s.id}`);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        } else if (e.key === 'Enter' && activeIdx >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[activeIdx]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        setSuggestions([]);
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        } else {
            navigate('/products');
        }
    };

    const handleLogout = async () => {
        setDropdownOpen(false);
        await logout();
        navigate('/user/auth/signin');
    };

    return (
        <div>
            {/* ── Announcement bar ──────────────────────────────────────── */}
            {showAnnouncement && (
                <S.AnnouncementBar>
                    <S.AnnouncementText>
                        <span>🚚 Free shipping on orders over <strong>$99</strong></span>
                        <span className="sep">·</span>
                        <span>Use code <strong>SAVE20</strong> for 20% off your first order</span>
                        <span className="sep">·</span>
                        <span>Free returns, always.</span>
                    </S.AnnouncementText>
                    <S.AnnouncementClose
                        onClick={() => setShowAnnouncement(false)}
                        aria-label="Dismiss"
                    >
                        <CloseIcon sx={{ fontSize: 14 }} />
                    </S.AnnouncementClose>
                </S.AnnouncementBar>
            )}

            {/* ── Main navbar ────────────────────────────────────────────── */}
            <S.NavBar>
                <S.NavInner>
                    {/* Logo */}
                    <S.Logo to="/">
                        E<span>com</span>
                    </S.Logo>

                    {/* Nav links */}
                    <S.NavLinks>
                        {NAV_LINKS.map(link => (
                            <S.NavItem key={link.to} to={link.to} end={link.to === '/'}>
                                {link.label}
                            </S.NavItem>
                        ))}
                    </S.NavLinks>

                    {/* Search */}
                    <S.SearchWrapper ref={searchWrapperRef}>
                        <S.SearchBox onSubmit={handleSearch}>
                            <S.SearchInput
                                type="text"
                                placeholder="Search products, brands and more…"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onKeyDown={handleSearchKeyDown}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            />
                            <S.SearchBtn type="submit" aria-label="Search">
                                <SearchIcon sx={{ fontSize: 18 }} />
                            </S.SearchBtn>
                        </S.SearchBox>

                        {showSuggestions && suggestions.length > 0 && (
                            <S.SuggestionsDropdown>
                                {suggestions.map((s, i) => (
                                    <S.SuggestionItem
                                        key={s.id}
                                        data-active={i === activeIdx}
                                        onClick={() => selectSuggestion(s)}
                                    >
                                        <S.SuggestionImage
                                            src={s.image || 'https://via.placeholder.com/36x36?text=...'}
                                            alt={s.title}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src =
                                                    'https://via.placeholder.com/36x36?text=...';
                                            }}
                                        />
                                        <S.SuggestionInfo>
                                            <S.SuggestionTitle
                                                dangerouslySetInnerHTML={{ __html: s.highlight }}
                                            />
                                            <S.SuggestionMeta>{s.category}</S.SuggestionMeta>
                                        </S.SuggestionInfo>
                                        <S.SuggestionPrice>${s.price}</S.SuggestionPrice>
                                    </S.SuggestionItem>
                                ))}
                            </S.SuggestionsDropdown>
                        )}
                    </S.SearchWrapper>

                    {/* Right icon cluster */}
                    <S.IconCluster>
                        {/* Wishlist */}
                        <S.IconBtn
                            aria-label="Wishlist"
                            onClick={() => navigate('/user/my-wishlist')}
                            title="Wishlist"
                        >
                            <FavoriteBorderIcon sx={{ fontSize: 20 }} />
                        </S.IconBtn>

                        {/* Cart */}
                        <S.IconBtn
                            aria-label="Cart"
                            onClick={() => navigate('/user/cart')}
                            title="Cart"
                        >
                            <ShoppingCartOutlinedIcon sx={{ fontSize: 20 }} />
                        </S.IconBtn>

                        <S.Divider />

                        {/* Account — dropdown when auth, plain link when not */}
                        {isAuthenticated ? (
                            <S.DropdownWrapper ref={dropdownRef}>
                                <S.IconBtn
                                    aria-label="My account"
                                    onClick={() => setDropdownOpen(v => !v)}
                                    title="My account"
                                    sx={{ gap: '2px' }}
                                >
                                    <PersonOutlineIcon sx={{ fontSize: 20 }} />
                                    <KeyboardArrowDownIcon
                                        sx={{
                                            fontSize: 14,
                                            color: '#94a3b8',
                                            transition: 'transform 0.2s',
                                            transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                                        }}
                                    />
                                </S.IconBtn>

                                {dropdownOpen && (
                                    <S.Dropdown>
                                        <S.DropdownItem to="/user/my-account" onClick={() => setDropdownOpen(false)}>
                                            My Account
                                        </S.DropdownItem>
                                        <S.DropdownItem to="/user/my-wishlist" onClick={() => setDropdownOpen(false)}>
                                            My Wishlist
                                        </S.DropdownItem>
                                        <S.DropdownItem to="/user/cart" onClick={() => setDropdownOpen(false)}>
                                            My Cart
                                        </S.DropdownItem>
                                        <S.DropdownDivider />
                                        <S.DropdownLogout onClick={handleLogout}>
                                            Log out
                                        </S.DropdownLogout>
                                    </S.Dropdown>
                                )}
                            </S.DropdownWrapper>
                        ) : (
                            <S.AuthBtn to="/user/auth/signin">Log in</S.AuthBtn>
                        )}
                    </S.IconCluster>
                </S.NavInner>
            </S.NavBar>

            {children}
            <Footer />
        </div>
    );
};

export default Header;
