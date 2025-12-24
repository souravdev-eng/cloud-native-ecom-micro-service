import React, { useState } from 'react';
import './Customers.css';

import SearchIcon from '@mui/icons-material/SearchRounded';
import PersonAddIcon from '@mui/icons-material/PersonAddRounded';
import MailIcon from '@mui/icons-material/MailRounded';
import VisibilityIcon from '@mui/icons-material/VisibilityRounded';
import BlockIcon from '@mui/icons-material/BlockRounded';
import MoreVertIcon from '@mui/icons-material/MoreVertRounded';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    orders: number;
    spent: number;
    status: 'active' | 'inactive' | 'blocked';
    joined: string;
    avatar?: string;
}

const mockCustomers: Customer[] = [
    { id: '1', name: 'John Doe', email: 'john.doe@example.com', phone: '+1 234 567 8900', orders: 24, spent: 12480, status: 'active', joined: 'Jan 15, 2024' },
    { id: '2', name: 'Sarah Wilson', email: 'sarah.wilson@example.com', phone: '+1 234 567 8901', orders: 18, spent: 8960, status: 'active', joined: 'Feb 22, 2024' },
    { id: '3', name: 'Mike Johnson', email: 'mike.j@example.com', phone: '+1 234 567 8902', orders: 31, spent: 15720, status: 'active', joined: 'Mar 08, 2024' },
    { id: '4', name: 'Emily Brown', email: 'emily.b@example.com', phone: '+1 234 567 8903', orders: 7, spent: 2340, status: 'inactive', joined: 'Apr 12, 2024' },
    { id: '5', name: 'Alex Chen', email: 'alex.chen@example.com', phone: '+1 234 567 8904', orders: 45, spent: 28900, status: 'active', joined: 'May 03, 2024' },
    { id: '6', name: 'Lisa Park', email: 'lisa.park@example.com', phone: '+1 234 567 8905', orders: 12, spent: 5680, status: 'active', joined: 'Jun 18, 2024' },
    { id: '7', name: 'David Kim', email: 'david.kim@example.com', phone: '+1 234 567 8906', orders: 0, spent: 0, status: 'blocked', joined: 'Jul 25, 2024' },
    { id: '8', name: 'Emma Davis', email: 'emma.d@example.com', phone: '+1 234 567 8907', orders: 9, spent: 4120, status: 'active', joined: 'Aug 30, 2024' },
];

const getStatusClass = (status: string) => {
    switch (status) {
        case 'active': return 'badge-success';
        case 'inactive': return 'badge-warning';
        case 'blocked': return 'badge-error';
        default: return '';
    }
};

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const customerStats = [
    { label: 'Total Customers', value: '3,428' },
    { label: 'Active This Month', value: '892' },
    { label: 'New This Week', value: '47' },
    { label: 'Avg. Order Value', value: '$284' },
];

const Customers: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = mockCustomers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="customers-page">
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Customers</h1>
                    <p className="page-subtitle">Manage your customer base and relationships</p>
                </div>
                <button className="btn btn-primary">
                    <PersonAddIcon />
                    Add Customer
                </button>
            </div>

            {/* Customer Stats */}
            <div className="customer-stats animate-fade-in stagger-1">
                {customerStats.map((stat) => (
                    <div key={stat.label} className="customer-stat">
                        <span className="stat-value">{stat.value}</span>
                        <span className="stat-label">{stat.label}</span>
                    </div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="filters-bar animate-fade-in stagger-2">
                <div className="search-box">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select className="filter-select">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                </select>
                <select className="filter-select">
                    <option value="">Sort By</option>
                    <option value="name">Name</option>
                    <option value="orders">Total Orders</option>
                    <option value="spent">Total Spent</option>
                    <option value="joined">Join Date</option>
                </select>
            </div>

            {/* Customers Grid */}
            <div className="customers-grid animate-fade-in stagger-3">
                {filteredCustomers.map((customer, index) => (
                    <div key={customer.id} className={`customer-card stagger-${(index % 4) + 1}`}>
                        <div className="customer-header">
                            <div className="customer-avatar">
                                {getInitials(customer.name)}
                            </div>
                            <span className={`badge ${getStatusClass(customer.status)}`}>
                                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                            </span>
                        </div>

                        <div className="customer-info">
                            <h3 className="customer-name">{customer.name}</h3>
                            <p className="customer-email">{customer.email}</p>
                            <p className="customer-phone">{customer.phone}</p>
                        </div>

                        <div className="customer-metrics">
                            <div className="metric">
                                <span className="metric-value">{customer.orders}</span>
                                <span className="metric-label">Orders</span>
                            </div>
                            <div className="metric">
                                <span className="metric-value">${customer.spent.toLocaleString()}</span>
                                <span className="metric-label">Spent</span>
                            </div>
                        </div>

                        <div className="customer-footer">
                            <span className="join-date">Joined {customer.joined}</span>
                            <div className="customer-actions">
                                <button className="action-btn" title="Send Email">
                                    <MailIcon />
                                </button>
                                <button className="action-btn" title="View Profile">
                                    <VisibilityIcon />
                                </button>
                                <button className="action-btn" title="Block User">
                                    <BlockIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Customers;

