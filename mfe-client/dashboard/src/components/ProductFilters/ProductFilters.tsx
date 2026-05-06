import React, { useState } from 'react';
import { Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessIcon from '@mui/icons-material/ExpandLessRounded';
import CheckIcon from '@mui/icons-material/CheckRounded';

import { Filters, CATEGORIES } from '../../page/ProductsPage/ProductsPage.hook';

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
    sidebar: {
        width: 220,
        flexShrink: 0,
        backgroundColor: '#fff',
        borderRadius: 12,
        border: '1px solid #e9ecef',
        height: 'fit-content',
        position: 'sticky' as const,
        top: 24,
        overflow: 'hidden',
    } as React.CSSProperties,

    topBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 16px',
        borderBottom: '1px solid #e9ecef',
    } as React.CSSProperties,

    topBarTitle: { fontSize: 14, fontWeight: 700, color: '#0f172a' } as React.CSSProperties,

    clearBtn: {
        fontSize: 12, color: '#2563eb', background: 'none', border: 'none',
        cursor: 'pointer', padding: 0, fontWeight: 500,
    } as React.CSSProperties,

    section: { borderBottom: '1px solid #e9ecef' } as React.CSSProperties,

    sectionHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', cursor: 'pointer', userSelect: 'none' as const,
        transition: 'background 0.12s',
    } as React.CSSProperties,

    sectionTitle: { fontSize: 13, fontWeight: 600, color: '#0f172a' } as React.CSSProperties,

    sectionBody: { padding: '2px 0 10px' } as React.CSSProperties,

    // Checkbox row (category & availability)
    checkRow: (checked: boolean, indent = false): React.CSSProperties => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: `7px 16px 7px ${indent ? 28 : 16}px`,
        cursor: 'pointer',
        transition: 'background 0.1s',
        backgroundColor: 'transparent',
    }),

    checkbox: (checked: boolean): React.CSSProperties => ({
        width: 15, height: 15, border: checked ? 'none' : '1.5px solid #d1d5db',
        borderRadius: 3, backgroundColor: checked ? '#2563eb' : '#fff', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s, border 0.15s',
    }),

    checkLabel: (checked: boolean): React.CSSProperties => ({
        fontSize: 13, color: checked ? '#1d4ed8' : '#374151',
        fontWeight: checked ? 600 : 400, flex: 1, lineHeight: '1.4',
    }),

    count: {
        fontSize: 11, color: '#9ca3af', fontWeight: 400,
    } as React.CSSProperties,

    // Price
    priceRow: {
        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 16px 6px',
    } as React.CSSProperties,

    priceInput: {
        width: '100%', padding: '6px 8px', border: '1px solid #d1d5db',
        borderRadius: 6, fontSize: 13, outline: 'none', color: '#111827',
        backgroundColor: '#f9fafb', boxSizing: 'border-box' as const,
    } as React.CSSProperties,

    priceSep: { fontSize: 12, color: '#9ca3af', flexShrink: 0 } as React.CSSProperties,

    goBtn: {
        padding: '6px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db',
        borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#374151',
        cursor: 'pointer', flexShrink: 0, transition: 'background 0.12s',
        whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,

    // Rating row (radio — single threshold)
    ratingRow: (active: boolean): React.CSSProperties => ({
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 16px', cursor: 'pointer',
        backgroundColor: active ? '#eff6ff' : 'transparent',
        borderLeft: active ? '3px solid #2563eb' : '3px solid transparent',
        transition: 'background 0.1s',
    }),

    ratingLabel: (active: boolean): React.CSSProperties => ({
        fontSize: 13, color: active ? '#1d4ed8' : '#374151',
        fontWeight: active ? 600 : 400, flex: 1,
    }),

    radioCheck: {
        width: 16, height: 16, borderRadius: '50%', backgroundColor: '#2563eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    } as React.CSSProperties,
};

const RATINGS = [
    { value: 4, stars: 4, label: '4 Stars & Up' },
    { value: 3, stars: 3, label: '3 Stars & Up' },
    { value: 2, stars: 2, label: '2 Stars & Up' },
    { value: 0, stars: 0, label: 'All ratings' },
];

// ── Collapsible section ───────────────────────────────────────────────────────

const Section: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({
    title, defaultOpen = true, children,
}) => {
    const [open, setOpen] = useState(defaultOpen);
    const [hover, setHover] = useState(false);
    return (
        <div style={s.section}>
            <div
                style={{ ...s.sectionHeader, backgroundColor: hover ? '#f9fafb' : 'transparent' }}
                onClick={() => setOpen(v => !v)}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                <span style={s.sectionTitle}>{title}</span>
                {open
                    ? <ExpandLessIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                    : <ExpandMoreIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                }
            </div>
            <Collapse in={open}>
                <div style={s.sectionBody}>{children}</div>
            </Collapse>
        </div>
    );
};

// ── Hover-aware row ───────────────────────────────────────────────────────────

const HoverRow: React.FC<{
    style: React.CSSProperties;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ style, onClick, children }) => {
    const [hover, setHover] = useState(false);
    return (
        <div
            style={{ ...style, backgroundColor: hover && style.backgroundColor === 'transparent' ? '#f9fafb' : style.backgroundColor }}
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {children}
        </div>
    );
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    filters: Filters;
    activeFilterCount: number;
    toggleCategory: (cat: string) => void;
    applyFilters: () => void;
    applyImmediate: (patch: Partial<Filters>) => void;
    updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
    resetFilters: () => void;
}

const ProductFilters: React.FC<Props> = ({
    filters, activeFilterCount,
    toggleCategory, applyFilters, applyImmediate, updateFilter, resetFilters,
}) => {
    return (
        <div style={s.sidebar}>
            {/* Header */}
            <div style={s.topBar}>
                <span style={s.topBarTitle}>
                    Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </span>
                {activeFilterCount > 0 && (
                    <button style={s.clearBtn} onClick={resetFilters}>Clear all</button>
                )}
            </div>

            {/* Department — multi-select checkboxes */}
            <Section title="Department">
                {CATEGORIES.map(cat => {
                    const checked = filters.categories.includes(cat);
                    return (
                        <HoverRow
                            key={cat}
                            style={s.checkRow(checked)}
                            onClick={() => toggleCategory(cat)}
                        >
                            <div style={s.checkbox(checked)}>
                                {checked && <CheckIcon sx={{ fontSize: 10, color: '#fff' }} />}
                            </div>
                            <span style={s.checkLabel(checked)}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </span>
                        </HoverRow>
                    );
                })}
                {filters.categories.length > 0 && (
                    <div style={{ padding: '4px 16px 2px' }}>
                        <button
                            style={{ ...s.clearBtn, fontSize: 11 }}
                            onClick={() => applyImmediate({ categories: [] })}
                        >
                            Clear department
                        </button>
                    </div>
                )}
            </Section>

            {/* Price range */}
            <Section title="Price">
                <div style={s.priceRow}>
                    <input
                        type="number"
                        placeholder="$ Min"
                        value={filters.minPrice}
                        style={s.priceInput}
                        onChange={e => updateFilter('minPrice', e.target.value ? Number(e.target.value) : '')}
                        onKeyPress={e => e.key === 'Enter' && applyFilters()}
                    />
                    <span style={s.priceSep}>–</span>
                    <input
                        type="number"
                        placeholder="$ Max"
                        value={filters.maxPrice}
                        style={s.priceInput}
                        onChange={e => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : '')}
                        onKeyPress={e => e.key === 'Enter' && applyFilters()}
                    />
                    <button
                        style={s.goBtn}
                        onClick={applyFilters}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                    >
                        Go
                    </button>
                </div>
            </Section>

            {/* Avg. Customer Review — single threshold (radio) */}
            <Section title="Avg. Customer Review">
                {RATINGS.map(({ value, stars, label }) => {
                    const active = filters.minRating === value;
                    return (
                        <HoverRow
                            key={value}
                            style={s.ratingRow(active)}
                            onClick={() => applyImmediate({ minRating: value })}
                        >
                            {stars > 0 && (
                                <span style={{ color: '#f59e0b', fontSize: 13, letterSpacing: '-1px', lineHeight: 1 }}>
                                    {'★'.repeat(stars)}
                                    <span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - stars)}</span>
                                </span>
                            )}
                            <span style={s.ratingLabel(active)}>{label}</span>
                            {active && stars > 0 && (
                                <div style={s.radioCheck}>
                                    <CheckIcon sx={{ fontSize: 10, color: '#fff' }} />
                                </div>
                            )}
                        </HoverRow>
                    );
                })}
            </Section>

            {/* Availability — checkbox */}
            <Section title="Availability">
                <HoverRow
                    style={s.checkRow(filters.inStock)}
                    onClick={() => applyImmediate({ inStock: !filters.inStock })}
                >
                    <div style={s.checkbox(filters.inStock)}>
                        {filters.inStock && <CheckIcon sx={{ fontSize: 10, color: '#fff' }} />}
                    </div>
                    <span style={s.checkLabel(filters.inStock)}>In Stock</span>
                </HoverRow>
            </Section>
        </div>
    );
};

export default ProductFilters;
