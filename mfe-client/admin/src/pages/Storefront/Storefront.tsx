import React from 'react';
import './Storefront.css';

import StorefrontIcon from '@mui/icons-material/StorefrontRounded';
import PaletteIcon from '@mui/icons-material/PaletteRounded';
import ViewQuiltIcon from '@mui/icons-material/ViewQuiltRounded';
import MenuBookIcon from '@mui/icons-material/MenuBookRounded';
import ImageIcon from '@mui/icons-material/ImageRounded';
import CodeIcon from '@mui/icons-material/CodeRounded';
import VisibilityIcon from '@mui/icons-material/VisibilityRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import OpenInNewIcon from '@mui/icons-material/OpenInNewRounded';

const storefrontSections = [
    {
        id: 'theme',
        title: 'Theme',
        description: 'Customize colors, typography, and overall look',
        icon: <PaletteIcon />,
        color: '#8b5cf6'
    },
    {
        id: 'layout',
        title: 'Page Layout',
        description: 'Arrange sections and content blocks',
        icon: <ViewQuiltIcon />,
        color: '#3b82f6'
    },
    {
        id: 'navigation',
        title: 'Navigation',
        description: 'Configure menus and site navigation',
        icon: <MenuBookIcon />,
        color: '#22c55e'
    },
    {
        id: 'media',
        title: 'Media Library',
        description: 'Manage images, videos, and files',
        icon: <ImageIcon />,
        color: '#f59e0b'
    },
    {
        id: 'custom',
        title: 'Custom Code',
        description: 'Add custom CSS and JavaScript',
        icon: <CodeIcon />,
        color: '#ef4444'
    },
];

const recentPages = [
    { name: 'Homepage', url: '/', lastEdited: '2 hours ago', status: 'published' },
    { name: 'Products', url: '/products', lastEdited: '1 day ago', status: 'published' },
    { name: 'About Us', url: '/about', lastEdited: '3 days ago', status: 'published' },
    { name: 'Contact', url: '/contact', lastEdited: '1 week ago', status: 'draft' },
    { name: 'FAQ', url: '/faq', lastEdited: '2 weeks ago', status: 'published' },
];

const Storefront: React.FC = () => {
    return (
        <div className="storefront-page">
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Storefront</h1>
                    <p className="page-subtitle">Customize your online store's appearance</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary">
                        <VisibilityIcon />
                        Preview Store
                    </button>
                    <button className="btn btn-primary">
                        <OpenInNewIcon />
                        Visit Store
                    </button>
                </div>
            </div>

            {/* Store Preview */}
            <div className="store-preview animate-fade-in stagger-1">
                <div className="preview-header">
                    <StorefrontIcon />
                    <div className="preview-info">
                        <h3>Your Store</h3>
                        <span className="store-url">https://yourstore.com</span>
                    </div>
                    <span className="badge badge-success">Live</span>
                </div>
                <div className="preview-frame">
                    <div className="mock-browser">
                        <div className="browser-header">
                            <div className="browser-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <div className="browser-url">yourstore.com</div>
                        </div>
                        <div className="browser-content">
                            <div className="mock-nav"></div>
                            <div className="mock-hero"></div>
                            <div className="mock-grid">
                                <div className="mock-card"></div>
                                <div className="mock-card"></div>
                                <div className="mock-card"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="storefront-grid">
                {/* Customization Options */}
                <div className="card animate-fade-in stagger-2">
                    <div className="card-header">
                        <h3 className="card-title">Customize</h3>
                    </div>
                    <div className="customization-options">
                        {storefrontSections.map((section) => (
                            <button key={section.id} className="customization-item">
                                <div className="item-icon" style={{ background: `${section.color}20`, color: section.color }}>
                                    {section.icon}
                                </div>
                                <div className="item-info">
                                    <span className="item-title">{section.title}</span>
                                    <span className="item-description">{section.description}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Pages */}
                <div className="card animate-fade-in stagger-3">
                    <div className="card-header">
                        <h3 className="card-title">Pages</h3>
                        <button className="btn btn-ghost">Add Page</button>
                    </div>
                    <div className="pages-list">
                        {recentPages.map((page) => (
                            <div key={page.url} className="page-item">
                                <div className="page-info">
                                    <span className="page-name">{page.name}</span>
                                    <span className="page-url">{page.url}</span>
                                </div>
                                <span className="page-edited">{page.lastEdited}</span>
                                <span className={`badge ${page.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                                    {page.status}
                                </span>
                                <button className="action-btn" title="Edit">
                                    <EditIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Storefront;

