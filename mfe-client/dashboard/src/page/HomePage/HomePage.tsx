import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroidRounded';
import HeadphonesIcon from '@mui/icons-material/HeadphonesRounded';
import MenuBookIcon from '@mui/icons-material/MenuBookRounded';
import CheckroomIcon from '@mui/icons-material/CheckroomRounded';
import CategoryIcon from '@mui/icons-material/CategoryRounded';
import StarIcon from '@mui/icons-material/StarRounded';
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardRounded';

import BannerCard from '../../components/BannerCard/BannerCard';
import BrandList from '../../components/BrandList/BrandList';
import CatalogNotice from '../../components/CatalogNotice/CatalogNotice';
import ProductList from '../../components/ProductList/ProductList';
import { useHomePage, HomeProduct } from './HomePage.hook';

const CATEGORIES = [
    { label: 'Phones', value: 'phone', icon: <PhoneAndroidIcon sx={{ fontSize: 28 }} /> },
    { label: 'Earphones', value: 'earphone', icon: <HeadphonesIcon sx={{ fontSize: 28 }} /> },
    { label: 'Books', value: 'book', icon: <MenuBookIcon sx={{ fontSize: 28 }} /> },
    { label: 'Fashion', value: 'fashions', icon: <CheckroomIcon sx={{ fontSize: 28 }} /> },
    { label: 'Other', value: 'other', icon: <CategoryIcon sx={{ fontSize: 28 }} /> },
];

const TABS = ['Top Rated', 'New Arrivals', 'Best Sellers', 'On Sale'] as const;

const TrendingRow = ({
    products,
    onNavigate,
}: {
    products: HomeProduct[];
    onNavigate: (id: string) => void;
}) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 0 }}>
        {products.map((p, i) => (
            <Box
                key={p.id}
                onClick={() => onNavigate(p.id)}
                sx={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'center',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f3f5',
                    borderRight: (i % 2 === 0) ? '1px solid #f1f3f5' : 'none',
                    transition: 'background 0.15s',
                    '&:hover': { backgroundColor: '#f8f9fa' },
                    '&:hover .trending-title': { color: '#228be6' },
                }}
            >
                <Box sx={{
                    width: 72, height: 72, borderRadius: 8, overflow: 'hidden',
                    backgroundColor: '#f1f3f5', flexShrink: 0,
                }}>
                    <Box
                        component="img"
                        src={p.image}
                        alt={p.title}
                        sx={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px', boxSizing: 'border-box' }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.src = 'https://via.placeholder.com/72x72?text=?';
                        }}
                    />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        className="trending-title"
                        sx={{
                            fontSize: 13, fontWeight: 500, color: '#212529',
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            lineHeight: 1.45, transition: 'color 0.15s',
                        }}
                    >
                        {p.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mt: '5px' }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#212529' }}>
                            ${p.price.toLocaleString()}
                        </Typography>
                        {p.rating != null && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#fab005' }}>
                                <StarIcon sx={{ fontSize: 12 }} />
                                <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#fab005' }}>
                                    {p.rating.toFixed(1)}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
                <ArrowForwardIcon sx={{ fontSize: 16, color: '#ced4da', flexShrink: 0 }} />
            </Box>
        ))}
    </Box>
);

const HomePage = () => {
    const navigate = useNavigate();
    const { featured, newArrivals, error, requiresAuth } = useHomePage();
    const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Top Rated');

    // Nothing loaded and we know why — show the reason instead of a page full of
    // empty product grids.
    const catalogUnavailable = !!error && featured.length === 0 && newArrivals.length === 0;

    const tabProducts: Record<(typeof TABS)[number], HomeProduct[]> = {
        'Top Rated': featured,
        'New Arrivals': newArrivals,
        'Best Sellers': [...featured].sort(() => Math.random() - 0.5),
        'On Sale': [...newArrivals, ...featured].slice(0, 6),
    };

    return (
        <Box sx={{ backgroundColor: '#f8f9fa' }}>
            {/* Hero Banner */}
            <BannerCard
                aspectRatio="21/8"
                objectFit="cover"
                eyebrow="New Season 2025"
                headline={`Discover Products\nYou'll Love`}
                subline="Shop the latest arrivals across phones, fashion, books and more."
                ctaText="Shop Now"
                onCtaClick={() => navigate('/products')}
                style={{ minHeight: 360, maxHeight: 560 }}
            />

            {/* Categories Row */}
            <Box sx={{ backgroundColor: '#fff', padding: '0 40px', boxShadow: '0 1px 0 #f1f3f5' }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 0,
                        maxWidth: 800,
                        margin: '0 auto',
                    }}
                >
                    {CATEGORIES.map((cat) => (
                        <Box
                            key={cat.value}
                            onClick={() => navigate(`/products?category=${cat.value}`)}
                            sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '20px 12px',
                                cursor: 'pointer',
                                color: '#495057',
                                borderBottom: '2px solid transparent',
                                transition: 'color 0.2s, border-color 0.2s',
                                '&:hover': {
                                    color: '#228be6',
                                    borderBottomColor: '#228be6',
                                },
                            }}
                        >
                            {cat.icon}
                            <Typography sx={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {cat.label}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {catalogUnavailable && (
                <CatalogNotice requiresAuth={requiresAuth} message={error!} />
            )}

            {/* Featured Products */}
            {!catalogUnavailable && (
                <ProductList
                    title="Featured Products"
                    eyebrow="Handpicked for you"
                    products={featured}
                    isTint={false}
                />
            )}

            {/* Promo Mini Banners */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 16,
                    padding: '0 40px 40px',
                    '@media (max-width: 768px)': { flexDirection: 'column', padding: '0 16px 24px' },
                }}
            >
                {['New Arrivals', 'Best Sellers', 'Sale Items'].map((label) => (
                    <BannerCard
                        key={label}
                        cardSize="small"
                        width="100%"
                        height={180}
                        borderRadius={12}
                        objectFit="cover"
                        miniLabel={label}
                    />
                ))}
            </Box>

            {/* New Arrivals */}
            {!catalogUnavailable && (
                <ProductList
                    title="New Arrivals"
                    eyebrow="Just dropped"
                    products={newArrivals}
                    isTint={true}
                />
            )}

            {/* Brands */}
            <BrandList />

            {/* Trending Collections – tabbed */}
            {featured.length > 0 && (
                <Box sx={{ backgroundColor: '#fff', padding: '52px 40px 48px', '@media (max-width: 768px)': { padding: '32px 16px' } }}>
                    <Box sx={{ maxWidth: 1280, margin: '0 auto' }}>
                        {/* Header row */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#228be6', textTransform: 'uppercase', letterSpacing: '1.5px', mb: '4px' }}>
                                    Quick Shop
                                </Typography>
                                <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#212529', letterSpacing: '-0.3px' }}>
                                    Trending Collections
                                </Typography>
                            </Box>
                            {/* Tabs */}
                            <Box sx={{ display: 'flex', gap: '4px', backgroundColor: '#f8f9fa', borderRadius: 10, padding: '4px' }}>
                                {TABS.map((tab) => (
                                    <Box
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        sx={{
                                            padding: '7px 16px',
                                            borderRadius: 8,
                                            fontSize: 13,
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
                                            backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                                            color: activeTab === tab ? '#228be6' : '#868e96',
                                            boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                        }}
                                    >
                                        {tab}
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        {/* Product rows */}
                        <Box sx={{ border: '1px solid #f1f3f5', borderRadius: 12, overflow: 'hidden' }}>
                            {tabProducts[activeTab].length === 0 ? (
                                <Box sx={{ padding: '40px', textAlign: 'center', color: '#adb5bd', fontSize: 14 }}>
                                    No products available
                                </Box>
                            ) : (
                                <TrendingRow
                                    products={tabProducts[activeTab]}
                                    onNavigate={(id) => navigate(`/product/${id}`)}
                                />
                            )}
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default HomePage;
