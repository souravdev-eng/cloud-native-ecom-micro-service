import React, { useState } from 'react';
import './Products.css';

import AddIcon from '@mui/icons-material/AddRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import FilterListIcon from '@mui/icons-material/FilterListRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import MoreVertIcon from '@mui/icons-material/MoreVertRounded';

import { CreateProductModal } from '../../components';
import { useProduct } from './Product.hook';

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
    const { productList, isLoading, totalProducts, handlePageChange, currentPage, setCurrentPage } = useProduct();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const filteredProducts = productList.filter((product: any) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
        // ||
        // product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedProducts.length === filteredProducts.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(filteredProducts.map((p: any) => p.id));
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
                <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
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
            {
                isLoading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                    </div>
                ) : (
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
                                {filteredProducts.map((product: any) => (
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
                                                    <img src={product.image} alt={product.title}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                </div>
                                                <span className="product-name">{product.title}</span>
                                            </div>
                                        </td>
                                        <td><span className="sku">{product.id.slice(0, 6)}</span></td>
                                        <td>{product.category}</td>
                                        <td className="price">${product.price.toLocaleString()}</td>
                                        <td>
                                            <span className={`stock ${getStockClass(product.quantity)}`}>
                                                {product.quantity === 0 ? 'Out of stock' : `${product.quantity} units`}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusClass(product.status || 'active')}`}>
                                                {product.status?.charAt(0).toUpperCase() + product.status?.slice(1) || 'active'}
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
                                <button className="btn btn-ghost" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>Previous</button>
                                <div className="page-numbers">
                                    {Array.from({ length: Math.ceil(totalProducts / 20) }, (_, index) => (
                                        <button className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
                                            key={index} onClick={() => handlePageChange(index + 1)}>{index + 1}</button>
                                    ))}
                                </div>
                                <button className="btn btn-ghost" disabled={currentPage === totalProducts} onClick={() => handlePageChange(currentPage + 1)}>Next</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Create Product Modal */}
            <CreateProductModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};

export default Products;

