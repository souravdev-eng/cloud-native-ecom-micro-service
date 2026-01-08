import React from 'react';

import AddIcon from '@mui/icons-material/AddRounded';
import CloseIcon from '@mui/icons-material/CloseRounded';
import CloudUploadIcon from '@mui/icons-material/CloudUploadRounded';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';

import './CreateProductModal.css';

import ImageUpload from '../../atoms/ImageUpload/ImageUpload';
import { useCreateProduct } from '../../hooks/useCreateProduct';

interface CreateProductModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const CreateProductModal = React.memo(
	({ isOpen, onClose }: CreateProductModalProps) => {
		const {
			formData,
			errors,
			loading,
			error,
			tagInput,
			setTagInput,
			isDragging,
			fileInputRef,
			categories,
			handleChange,
			handleAddTag,
			handleRemoveTag,
			handleTagInputKeyDown,
			handleFileInputChange,
			handleDragOver,
			handleDragLeave,
			handleDrop,
			handleRemoveImage,
			triggerFileInput,
			handleSubmit,
			resetForm,
		} = useCreateProduct(() => {
			onClose();
		});

		const handleClose = () => {
			resetForm();
			onClose();
		};

		if (!isOpen) return null;

		return (
			<div className="modal-overlay">
				<div className="modal-container">
					{/* Modal Header */}
					<div className="modal-header">
						<div>
							<h2 className="modal-title">Create New Product</h2>
							<p className="modal-subtitle">
								Add a new product to your catalog
							</p>
						</div>
						<button className="modal-close-btn" onClick={handleClose}>
							<CloseIcon />
						</button>
					</div>

					{/* Modal Body */}
					<form className="modal-body" onSubmit={handleSubmit}>
						{error && (
							<div className="form-error-banner">
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								>
									<circle cx="12" cy="12" r="10" />
									<line x1="12" y1="8" x2="12" y2="12" />
									<line x1="12" y1="16" x2="12.01" y2="16" />
								</svg>
								{error}
							</div>
						)}

						<div className="form-grid">
							{/* Left Column */}
							<div className="form-column">
								{/* Title */}
								<div className="form-field">
									<label className="form-label" htmlFor="title">
										Product Title <span className="required">*</span>
									</label>
									<input
										id="title"
										name="title"
										type="text"
										className={`form-input ${errors.title ? 'error' : ''}`}
										placeholder="e.g., Apple Air iPad Black"
										value={formData.title}
										onChange={handleChange}
									/>
									{errors.title && (
										<span className="field-error">{errors.title}</span>
									)}
								</div>

								{/* Category */}
								<div className="form-field">
									<label className="form-label" htmlFor="category">
										Category <span className="required">*</span>
									</label>
									<select
										id="category"
										name="category"
										className={`form-select ${errors.category ? 'error' : ''}`}
										value={formData.category}
										onChange={handleChange}
									>
										<option value="">Select a category</option>
										{categories.map((cat) => (
											<option key={cat} value={cat}>
												{cat.charAt(0).toUpperCase() + cat.slice(1)}
											</option>
										))}
									</select>
									{errors.category && (
										<span className="field-error">{errors.category}</span>
									)}
								</div>

								{/* Description */}
								<div className="form-field">
									<label className="form-label" htmlFor="description">
										Description <span className="required">*</span>
									</label>
									<textarea
										id="description"
										name="description"
										className={`form-textarea ${errors.description ? 'error' : ''}`}
										placeholder="Describe your product..."
										rows={4}
										value={formData.description}
										onChange={handleChange}
									/>
									{errors.description && (
										<span className="field-error">{errors.description}</span>
									)}
								</div>

								{/* Tags */}
								<div className="form-field">
									<label className="form-label" htmlFor="tags">
										Tags <span className="required">*</span>
									</label>
									<div className="tags-input-wrapper">
										<div className="tags-container">
											{formData.tags.map((tag) => (
												<span key={tag} className="tag">
													{tag}
													<button
														type="button"
														className="tag-remove"
														onClick={() => handleRemoveTag(tag)}
													>
														×
													</button>
												</span>
											))}
										</div>
										<div className="tag-input-group">
											<input
												id="tags"
												type="text"
												className="tag-input"
												placeholder="Type a tag and press Enter"
												value={tagInput}
												onChange={(e) => setTagInput(e.target.value)}
												onKeyDown={handleTagInputKeyDown}
											/>
											<button
												type="button"
												className="add-tag-btn"
												onClick={handleAddTag}
											>
												<AddIcon />
											</button>
										</div>
									</div>
									{errors.tags && (
										<span className="field-error">{errors.tags}</span>
									)}
								</div>
							</div>

							{/* Right Column */}
							<div className="form-column">
								{/* Image Upload */}
								<div className="form-field">
									<label className="form-label">
										Product Image <span className="required">*</span>
									</label>

									{/* Hidden file input */}
									<input
										ref={fileInputRef}
										type="file"
										accept="image/jpeg,image/png,image/gif,image/webp"
										onChange={handleFileInputChange}
										style={{ display: 'none' }}
									/>

									{/* Upload Area */}
									{!formData.imagePreview ? (
										<ImageUpload
											isDragging={isDragging}
											errors={errors}
											handleDrop={handleDrop}
											handleDragOver={handleDragOver}
											handleDragLeave={handleDragLeave}
											triggerFileInput={triggerFileInput}
										/>
									) : (
										<div className="image-preview-container">
											<img
												src={formData.imagePreview}
												alt="Product preview"
												className="preview-image"
											/>
											<div className="preview-overlay">
												<button
													type="button"
													className="preview-action-btn change-btn"
													onClick={triggerFileInput}
												>
													<CloudUploadIcon />
													Change
												</button>
												<button
													type="button"
													className="preview-action-btn remove-btn"
													onClick={handleRemoveImage}
												>
													<DeleteIcon />
													Remove
												</button>
											</div>
											{formData.image && (
												<div className="file-info">
													<span className="file-name">
														{formData.image.name}
													</span>
													<span className="file-size">
														{(formData.image.size / 1024).toFixed(1)} KB
													</span>
												</div>
											)}
										</div>
									)}
									{errors.image && (
										<span className="field-error">{errors.image}</span>
									)}
								</div>

								{/* Pricing Section */}
								<div className="pricing-section">
									<h3 className="section-title">Pricing</h3>

									<div className="price-grid">
										<div className="form-field">
											<label className="form-label" htmlFor="originalPrice">
												Original Price <span className="required">*</span>
											</label>
											<div className="price-input-wrapper">
												<span className="currency-symbol">$</span>
												<input
													id="originalPrice"
													name="originalPrice"
													type="number"
													min="0"
													step="0.01"
													className={`form-input price-input ${errors.originalPrice ? 'error' : ''}`}
													placeholder="0.00"
													value={formData.originalPrice}
													onChange={handleChange}
												/>
											</div>
											{errors.originalPrice && (
												<span className="field-error">
													{errors.originalPrice}
												</span>
											)}
										</div>

										<div className="form-field">
											<label className="form-label" htmlFor="sellingPrice">
												Selling Price <span className="required">*</span>
											</label>
											<div className="price-input-wrapper">
												<span className="currency-symbol">$</span>
												<input
													id="sellingPrice"
													name="sellingPrice"
													type="number"
													min="0"
													step="0.01"
													className={`form-input price-input ${errors.sellingPrice ? 'error' : ''}`}
													placeholder="0.00"
													value={formData.sellingPrice}
													onChange={handleChange}
												/>
											</div>
											{errors.sellingPrice && (
												<span className="field-error">
													{errors.sellingPrice}
												</span>
											)}
										</div>
									</div>

									{/* Discount Preview */}
									{formData.originalPrice &&
										formData.sellingPrice &&
										Number(formData.originalPrice) >
											Number(formData.sellingPrice) && (
											<div className="discount-badge">
												{Math.round(
													(1 -
														Number(formData.sellingPrice) /
															Number(formData.originalPrice)) *
														100,
												)}
												% OFF
											</div>
										)}
								</div>

								{/* Quantity */}
								<div className="form-field">
									<label className="form-label" htmlFor="quantity">
										Stock Quantity <span className="required">*</span>
									</label>
									<input
										id="quantity"
										name="quantity"
										type="number"
										min="0"
										className={`form-input ${errors.quantity ? 'error' : ''}`}
										placeholder="0"
										value={formData.quantity}
										onChange={handleChange}
									/>
									{errors.quantity && (
										<span className="field-error">{errors.quantity}</span>
									)}
								</div>
							</div>
						</div>

						{/* Modal Footer */}
						<div className="modal-footer">
							<button
								type="button"
								className="btn btn-secondary"
								onClick={handleClose}
							>
								Cancel
							</button>
							<button
								type="submit"
								className="btn btn-primary"
								disabled={loading}
							>
								{loading ? (
									<>
										<span className="spinner"></span>
										Creating...
									</>
								) : (
									<>
										<AddIcon />
										Create Product
									</>
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		);
	},
);

export default CreateProductModal;
