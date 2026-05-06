import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/SearchRounded';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorderRounded';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineRounded';
import CloseIcon from '@mui/icons-material/CloseRounded';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDownRounded';

import { useAuth } from '../../hooks/useAuth';
import Footer from '../Footer/Footer';
import * as S from './Header.styles';

const NAV_LINKS = [
    { label: 'Home',     to: '/' },
    { label: 'Products', to: '/products' },
    { label: 'About',    to: '/about-us' },
    { label: 'Blog',     to: '/blog' },
];

const Header = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const [showAnnouncement, setShowAnnouncement] = useState(true);
    const [searchQuery, setSearchQuery]           = useState('');
    const [dropdownOpen, setDropdownOpen]         = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
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
                    <S.SearchBox onSubmit={handleSearch}>
                        <S.SearchInput
                            type="text"
                            placeholder="Search products, brands and more…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <S.SearchBtn type="submit" aria-label="Search">
                            <SearchIcon sx={{ fontSize: 18 }} />
                        </S.SearchBtn>
                    </S.SearchBox>

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
