import React from 'react';

import FilterListIcon from '@mui/icons-material/FilterListRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';

const FilterBar = React.memo(
	({
		searchTerm,
		setSearchTerm,
	}: {
		searchTerm: string;
		setSearchTerm: (value: string) => void;
	}) => {
		return (
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
		);
	},
);

export default FilterBar;
