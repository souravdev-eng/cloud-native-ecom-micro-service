import React, { lazy, Suspense, useCallback, useMemo, useState } from 'react';

import AddIcon from '@mui/icons-material/AddRounded';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditIcon from '@mui/icons-material/EditRounded';
import MoreVertIcon from '@mui/icons-material/MoreVertRounded';

import { useProduct } from './Product.hook';
import './Products.css';

import { useProductFilter } from './hooks/useProductFilter';

import FilterBar from '../../molecules/FilterBar/FilterBar';

const CreateProductModal = lazy(
	() => import('../../components/CreateProductModal/CreateProductModal'),
);

const Products: React.FC = React.memo(() => {
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const {
		productList,
		isLoading,
		meta,
		currentPage,
		hasNextPage,
		hasPrevPage,
		handleNextPage,
		handlePrevPage,
		handleFirstPage,
	} = useProduct();

	const {
		searchTerm,
		selectedProducts,
		filteredProducts,
		viewProducts,
		setSearchTerm,
		toggleSelectAll,
		toggleSelectProduct,
	} = useProductFilter({ productList });

	return (
		<Suspense fallback={'loading....'}>
			<div className="products-page">
				<div className="page-header animate-fade-in">
					<div>
						<h1 className="page-title">Products</h1>
						<p className="page-subtitle">
							Manage your product inventory and catalog
						</p>
					</div>
					<button
						className="btn btn-primary"
						onClick={() => setIsCreateModalOpen(true)}
					>
						<AddIcon />
						Add Product
					</button>
				</div>

				{/* Filters Bar */}

				<FilterBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
				{/* Bulk Actions */}
				{selectedProducts.length > 0 && (
					<div className="bulk-actions animate-fade-in">
						<span>{selectedProducts.length} product(s) selected</span>
						<div className="bulk-buttons">
							<button className="btn btn-secondary">Edit</button>
							<button className="btn btn-secondary">Duplicate</button>
							<button
								className="btn btn-secondary"
								style={{ color: 'var(--error)' }}
							>
								Delete
							</button>
						</div>
					</div>
				)}
				{isLoading ? (
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
											checked={
												selectedProducts.length === filteredProducts.length &&
												filteredProducts.length > 0
											}
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
								{viewProducts.map((product: any) => {
									return (
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
														<img
															src={product.image}
															alt={product.title}
															style={{
																width: '100%',
																height: '100%',
																objectFit: 'contain',
															}}
														/>
													</div>
													<span className="product-name">{product.title}</span>
												</div>
											</td>
											<td>
												<span className="sku">{product.id.slice(0, 6)}</span>
											</td>
											<td>{product.category}</td>
											<td className="price">
												${product.price.toLocaleString()}
											</td>
											<td>
												<span className={`stock ${product.stockClass}`}>
													{product.quantity === 0
														? 'Out of stock'
														: `${product.quantity} units`}
												</span>
											</td>
											<td>
												<span className={`badge ${product?.statusClass}`}>
													{product.status?.charAt(0).toUpperCase() +
														product.status?.slice(1) || 'Active'}
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
									);
								})}
							</tbody>
						</table>

						{/* Pagination */}
						<div className="pagination">
							<span className="pagination-info">
								Showing {meta.count} products · Page {currentPage}
							</span>
							<div className="pagination-controls">
								{currentPage > 1 && (
									<button className="btn btn-ghost" onClick={handleFirstPage}>
										First
									</button>
								)}
								<button
									className="btn btn-ghost"
									disabled={!hasPrevPage}
									onClick={handlePrevPage}
								>
									Previous
								</button>
								<div className="page-numbers">
									<button className="page-btn active">{currentPage}</button>
								</div>
								<button
									className="btn btn-ghost"
									disabled={!hasNextPage}
									onClick={handleNextPage}
								>
									Next
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Create Product Modal */}
				{isCreateModalOpen ? (
					<CreateProductModal
						isOpen={isCreateModalOpen}
						onClose={() => setIsCreateModalOpen(false)}
					/>
				) : null}
			</div>
		</Suspense>
	);
});

export default Products;
