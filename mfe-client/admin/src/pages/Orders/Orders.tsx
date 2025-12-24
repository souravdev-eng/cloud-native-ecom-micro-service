import React, { useState } from 'react';
import './Orders.css';

import SearchIcon from '@mui/icons-material/SearchRounded';
import FilterListIcon from '@mui/icons-material/FilterListRounded';
import VisibilityIcon from '@mui/icons-material/VisibilityRounded';
import LocalShippingIcon from '@mui/icons-material/LocalShippingRounded';
import PrintIcon from '@mui/icons-material/PrintRounded';
import DownloadIcon from '@mui/icons-material/FileDownloadRounded';

interface Order {
    id: string;
    customer: string;
    email: string;
    items: number;
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus: 'paid' | 'pending' | 'refunded';
    date: string;
}

const mockOrders: Order[] = [
    { id: 'ORD-2847', customer: 'John Doe', email: 'john@example.com', items: 3, total: 2749.00, status: 'delivered', paymentStatus: 'paid', date: 'Dec 24, 2025' },
    { id: 'ORD-2846', customer: 'Sarah Wilson', email: 'sarah@example.com', items: 1, total: 1199.00, status: 'processing', paymentStatus: 'paid', date: 'Dec 24, 2025' },
    { id: 'ORD-2845', customer: 'Mike Johnson', email: 'mike@example.com', items: 2, total: 548.00, status: 'shipped', paymentStatus: 'paid', date: 'Dec 23, 2025' },
    { id: 'ORD-2844', customer: 'Emily Brown', email: 'emily@example.com', items: 1, total: 799.00, status: 'pending', paymentStatus: 'pending', date: 'Dec 23, 2025' },
    { id: 'ORD-2843', customer: 'Alex Chen', email: 'alex@example.com', items: 2, total: 1598.00, status: 'delivered', paymentStatus: 'paid', date: 'Dec 22, 2025' },
    { id: 'ORD-2842', customer: 'Lisa Park', email: 'lisa@example.com', items: 4, total: 3246.00, status: 'shipped', paymentStatus: 'paid', date: 'Dec 22, 2025' },
    { id: 'ORD-2841', customer: 'David Kim', email: 'david@example.com', items: 1, total: 249.00, status: 'cancelled', paymentStatus: 'refunded', date: 'Dec 21, 2025' },
    { id: 'ORD-2840', customer: 'Emma Davis', email: 'emma@example.com', items: 2, total: 1048.00, status: 'processing', paymentStatus: 'paid', date: 'Dec 21, 2025' },
];

const getStatusClass = (status: string) => {
    switch (status) {
        case 'delivered': return 'badge-success';
        case 'processing': return 'badge-info';
        case 'shipped': return 'badge-warning';
        case 'pending': return 'badge-error';
        case 'cancelled': return 'badge-muted';
        default: return '';
    }
};

const getPaymentClass = (status: string) => {
    switch (status) {
        case 'paid': return 'payment-paid';
        case 'pending': return 'payment-pending';
        case 'refunded': return 'payment-refunded';
        default: return '';
    }
};

const orderStats = [
    { label: 'Total Orders', value: '1,429', change: '+12.5%' },
    { label: 'Pending', value: '23', change: '-5.2%' },
    { label: 'Processing', value: '45', change: '+8.1%' },
    { label: 'Shipped', value: '156', change: '+15.3%' },
];

const Orders: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filteredOrders = mockOrders.filter(order => {
        const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="orders-page">
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Orders</h1>
                    <p className="page-subtitle">Track and manage customer orders</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary">
                        <DownloadIcon />
                        Export
                    </button>
                </div>
            </div>

            {/* Order Stats */}
            <div className="order-stats animate-fade-in stagger-1">
                {orderStats.map((stat) => (
                    <div key={stat.label} className="order-stat">
                        <span className="stat-label">{stat.label}</span>
                        <div className="stat-row">
                            <span className="stat-value">{stat.value}</span>
                            <span className={`stat-change ${stat.change.startsWith('+') ? 'positive' : 'negative'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="filters-bar animate-fade-in stagger-2">
                <div className="search-box">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select className="filter-select">
                        <option value="">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                    <button className="btn btn-secondary">
                        <FilterListIcon />
                        More Filters
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="card orders-table-card animate-fade-in stagger-3">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Date</th>
                            <th className="actions-cell">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map((order) => (
                            <tr key={order.id}>
                                <td>
                                    <span className="order-id">#{order.id}</span>
                                </td>
                                <td>
                                    <div className="customer-cell">
                                        <span className="customer-name">{order.customer}</span>
                                        <span className="customer-email">{order.email}</span>
                                    </div>
                                </td>
                                <td>{order.items} item{order.items > 1 ? 's' : ''}</td>
                                <td className="total">${order.total.toLocaleString()}</td>
                                <td>
                                    <span className={`badge ${getStatusClass(order.status)}`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                    </span>
                                </td>
                                <td>
                                    <span className={`payment-status ${getPaymentClass(order.paymentStatus)}`}>
                                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                    </span>
                                </td>
                                <td className="date">{order.date}</td>
                                <td className="actions-cell">
                                    <div className="action-buttons">
                                        <button className="action-btn" title="View Details">
                                            <VisibilityIcon />
                                        </button>
                                        <button className="action-btn" title="Track Shipment">
                                            <LocalShippingIcon />
                                        </button>
                                        <button className="action-btn" title="Print Invoice">
                                            <PrintIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="pagination">
                    <span className="pagination-info">Showing 1-8 of {filteredOrders.length} orders</span>
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

export default Orders;

