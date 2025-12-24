import React, { useState } from 'react';
import './Products.css';

import AddIcon from '@mui/icons-material/AddRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import FilterListIcon from '@mui/icons-material/FilterListRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import MoreVertIcon from '@mui/icons-material/MoreVertRounded';
import ImageIcon from '@mui/icons-material/ImageRounded';

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    status: 'active' | 'draft' | 'archived';
    image?: string;
}

const mockProducts: Product[] = [
    { id: '1', name: 'MacBook Pro 14" M3', sku: 'MBP-14-M3', category: 'Laptops', price: 2499, stock: 45, status: 'active' },
    { id: '2', name: 'iPhone 15 Pro Max', sku: 'IPH-15-PM', category: 'Phones', price: 1199, stock: 128, status: 'active' },
    { id: '3', name: 'AirPods Pro 2', sku: 'APP-2', category: 'Audio', price: 249, stock: 342, status: 'active' },
    { id: '4', name: 'iPad Air M2', sku: 'IPA-M2', category: 'Tablets', price: 799, stock: 67, status: 'active' },
    { id: '5', name: 'Apple Watch Ultra 2', sku: 'AWU-2', category: 'Wearables', price: 799, stock: 23, status: 'active' },
    { id: '6', name: 'Mac Studio M2 Ultra', sku: 'MS-M2U', category: 'Desktops', price: 3999, stock: 8, status: 'draft' },
    { id: '7', name: 'HomePod 2nd Gen', sku: 'HP-2', category: 'Audio', price: 299, stock: 0, status: 'archived' },
    { id: '8', name: 'Magic Keyboard', sku: 'MK-1', category: 'Accessories', price: 99, stock: 156, status: 'active' },
];

const getStatusClass = (status: string) => {
    switch (status) {
        case 'active': return 'badge-success';
        case 'draft': return 'badge-warning';
        case 'archived': return 'badge-error';
        default: return '';
    }
};

const getStockClass = (stock: number) => {
    if (stock === 0) return 'stock-out';
    if (stock < 20) return 'stock-low';
    return 'stock-ok';
};

const Products: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

    const filteredProducts = mockProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedProducts.length === filteredProducts.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(filteredProducts.map(p => p.id));
        }
    };

    const toggleSelectProduct = (id: string) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <div className="products-page">
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Products</h1>
                    <p className="page-subtitle">Manage your product inventory and catalog</p>
                </div>
                <button className="btn btn-primary">
                    <AddIcon />
                    Add Product
                </button>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar animate-fade-in stagger-1">
                <div className="search-box">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select className="filter-select">
                        <option value="">All Categories</option>
                        <option value="laptops">Laptops</option>
                        <option value="phones">Phones</option>
                        <option value="tablets">Tablets</option>
                        <option value="audio">Audio</option>
                        <option value="wearables">Wearables</option>
                    </select>
                    <select className="filter-select">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                    <button className="btn btn-secondary">
                        <FilterListIcon />
                        More Filters
                    </button>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
                <div className="bulk-actions animate-fade-in">
                    <span>{selectedProducts.length} product(s) selected</span>
                    <div className="bulk-buttons">
                        <button className="btn btn-secondary">Edit</button>
                        <button className="btn btn-secondary">Duplicate</button>
                        <button className="btn btn-secondary" style={{ color: 'var(--error)' }}>Delete</button>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="card products-table-card animate-fade-in stagger-2">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="checkbox-cell">
                                <input
                                    type="checkbox"
                                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th className="actions-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id}>
                                <td className="checkbox-cell">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.includes(product.id)}
                                        onChange={() => toggleSelectProduct(product.id)}
                                    />
                                </td>
                                <td>
                                    <div className="product-cell">
                                        <div className="product-image">
                                            <ImageIcon />
                                        </div>
                                        <span className="product-name">{product.name}</span>
                                    </div>
                                </td>
                                <td><span className="sku">{product.sku}</span></td>
                                <td>{product.category}</td>
                                <td className="price">${product.price.toLocaleString()}</td>
                                <td>
                                    <span className={`stock ${getStockClass(product.stock)}`}>
                                        {product.stock === 0 ? 'Out of stock' : `${product.stock} units`}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${getStatusClass(product.status)}`}>
                                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                    </span>
                                </td>
                                <td className="actions-cell">
                                    <div className="action-buttons">
                                        <button className="action-btn" title="Edit">
                                            <EditIcon />
                                        </button>
                                        <button className="action-btn" title="Delete">
                                            <DeleteIcon />
                                        </button>
                                        <button className="action-btn" title="More">
                                            <MoreVertIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="pagination">
                    <span className="pagination-info">Showing 1-8 of {filteredProducts.length} products</span>
                    <div className="pagination-controls">
                        <button className="btn btn-ghost" disabled>Previous</button>
                        <div className="page-numbers">
                            <button className="page-btn active">1</button>
                            <button className="page-btn">2</button>
                            <button className="page-btn">3</button>
                        </div>
                        <button className="btn btn-ghost">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;

