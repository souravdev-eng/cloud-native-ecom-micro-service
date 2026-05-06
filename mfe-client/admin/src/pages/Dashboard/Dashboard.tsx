import React from 'react';
import './Dashboard.css';

// Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownIcon from '@mui/icons-material/TrendingDownRounded';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartRounded';
import AttachMoneyIcon from '@mui/icons-material/AttachMoneyRounded';
import PeopleIcon from '@mui/icons-material/PeopleRounded';
import InventoryIcon from '@mui/icons-material/Inventory2Rounded';
import MoreVertIcon from '@mui/icons-material/MoreVertRounded';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownwardRounded';

interface StatCard {
    title: string;
    value: string;
    change: number;
    icon: React.ReactNode;
    color: string;
}

const stats: StatCard[] = [
    {
        title: 'Total Revenue',
        value: '$84,254.32',
        change: 12.5,
        icon: <AttachMoneyIcon />,
        color: '#22c55e',
    },
    {
        title: 'Total Orders',
        value: '1,429',
        change: 8.2,
        icon: <ShoppingCartIcon />,
        color: '#3b82f6',
    },
    {
        title: 'New Customers',
        value: '328',
        change: -2.4,
        icon: <PeopleIcon />,
        color: '#f59e0b',
    },
    {
        title: 'Products Sold',
        value: '2,847',
        change: 15.3,
        icon: <InventoryIcon />,
        color: '#8b5cf6',
    },
];

const recentOrders = [
    { id: '#ORD-2847', customer: 'John Doe', product: 'MacBook Pro 14"', amount: '$2,499.00', status: 'Delivered', date: 'Dec 24, 2025' },
    { id: '#ORD-2846', customer: 'Sarah Wilson', product: 'iPhone 15 Pro Max', amount: '$1,199.00', status: 'Processing', date: 'Dec 24, 2025' },
    { id: '#ORD-2845', customer: 'Mike Johnson', product: 'AirPods Pro 2', amount: '$249.00', status: 'Shipped', date: 'Dec 23, 2025' },
    { id: '#ORD-2844', customer: 'Emily Brown', product: 'iPad Air M2', amount: '$799.00', status: 'Pending', date: 'Dec 23, 2025' },
    { id: '#ORD-2843', customer: 'Alex Chen', product: 'Apple Watch Ultra', amount: '$799.00', status: 'Delivered', date: 'Dec 22, 2025' },
];

const topProducts = [
    { name: 'MacBook Pro 14"', sales: 234, revenue: '$584,766', trend: 12 },
    { name: 'iPhone 15 Pro Max', sales: 456, revenue: '$546,744', trend: 8 },
    { name: 'AirPods Pro 2', sales: 789, revenue: '$196,461', trend: 23 },
    { name: 'iPad Air M2', sales: 123, revenue: '$98,277', trend: -5 },
    { name: 'Apple Watch Ultra 2', sales: 98, revenue: '$78,302', trend: 15 },
];

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'delivered': return 'badge-success';
        case 'processing': return 'badge-info';
        case 'shipped': return 'badge-warning';
        case 'pending': return 'badge-error';
        default: return '';
    }
};

const Dashboard: React.FC = () => {
    return (
        <div className="dashboard">
            {/* Page Header */}
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Welcome back! Here's what's happening with your store.</p>
                </div>
                <div className="header-actions">
                    <select className="date-select">
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                        <option>Last 90 days</option>
                        <option>This year</option>
                    </select>
                    <button className="btn btn-primary">Download Report</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div
                        key={stat.title}
                        className={`stat-card animate-fade-in stagger-${index + 1}`}
                        style={{ '--stat-color': stat.color } as React.CSSProperties}
                    >
                        <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">{stat.title}</span>
                            <div className="stat-value-row">
                                <span className="stat-value">{stat.value}</span>
                                <span className={`stat-change ${stat.change >= 0 ? 'positive' : 'negative'}`}>
                                    {stat.change >= 0 ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                                    {Math.abs(stat.change)}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid-2 dashboard-charts">
                <div className="chart-container animate-fade-in stagger-5">
                    <div className="chart-header">
                        <h3 className="chart-title">Revenue Overview</h3>
                        <button className="btn btn-ghost">
                            <MoreVertIcon />
                        </button>
                    </div>
                    <div className="chart-body">
                        <div className="chart-placeholder">
                            {/* Revenue chart visualization */}
                            <div className="mini-chart">
                                {[65, 45, 75, 50, 85, 60, 90, 55, 70, 80, 95, 75].map((height, i) => (
                                    <div
                                        key={i}
                                        className="chart-bar"
                                        style={{
                                            height: `${height}%`,
                                            animationDelay: `${i * 50}ms`
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="chart-labels">
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                                    <span key={month}>{month}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="chart-container animate-fade-in stagger-6">
                    <div className="chart-header">
                        <h3 className="chart-title">Sales by Category</h3>
                        <button className="btn btn-ghost">
                            <MoreVertIcon />
                        </button>
                    </div>
                    <div className="chart-body">
                        <div className="donut-chart">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-tertiary)" strokeWidth="12" />
                                <circle
                                    cx="50" cy="50" r="40"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="12"
                                    strokeDasharray="75 176"
                                    strokeDashoffset="0"
                                    transform="rotate(-90 50 50)"
                                    className="donut-segment"
                                />
                                <circle
                                    cx="50" cy="50" r="40"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="12"
                                    strokeDasharray="50 201"
                                    strokeDashoffset="-75"
                                    transform="rotate(-90 50 50)"
                                    className="donut-segment"
                                    style={{ animationDelay: '0.2s' }}
                                />
                                <circle
                                    cx="50" cy="50" r="40"
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth="12"
                                    strokeDasharray="40 211"
                                    strokeDashoffset="-125"
                                    transform="rotate(-90 50 50)"
                                    className="donut-segment"
                                    style={{ animationDelay: '0.4s' }}
                                />
                                <circle
                                    cx="50" cy="50" r="40"
                                    fill="none"
                                    stroke="#8b5cf6"
                                    strokeWidth="12"
                                    strokeDasharray="35 216"
                                    strokeDashoffset="-165"
                                    transform="rotate(-90 50 50)"
                                    className="donut-segment"
                                    style={{ animationDelay: '0.6s' }}
                                />
                            </svg>
                            <div className="donut-center">
                                <span className="donut-value">$84.2K</span>
                                <span className="donut-label">Total</span>
                            </div>
                        </div>
                        <div className="chart-legend">
                            <div className="legend-item"><span className="legend-dot" style={{ background: '#3b82f6' }} />Electronics (35%)</div>
                            <div className="legend-item"><span className="legend-dot" style={{ background: '#22c55e' }} />Accessories (25%)</div>
                            <div className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }} />Wearables (20%)</div>
                            <div className="legend-item"><span className="legend-dot" style={{ background: '#8b5cf6' }} />Others (20%)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders & Top Products */}
            <div className="grid-2 dashboard-tables">
                <div className="card animate-fade-in">
                    <div className="card-header">
                        <h3 className="card-title">Recent Orders</h3>
                        <a href="/orders" className="view-all">View All</a>
                    </div>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td><span className="order-id">{order.id}</span></td>
                                        <td>{order.customer}</td>
                                        <td className="amount">{order.amount}</td>
                                        <td><span className={`badge ${getStatusColor(order.status)}`}>{order.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card animate-fade-in">
                    <div className="card-header">
                        <h3 className="card-title">Top Products</h3>
                        <a href="/products" className="view-all">View All</a>
                    </div>
                    <div className="top-products">
                        {topProducts.map((product, index) => (
                            <div key={product.name} className="product-item">
                                <div className="product-rank">{index + 1}</div>
                                <div className="product-info">
                                    <span className="product-name">{product.name}</span>
                                    <span className="product-stats">{product.sales} sales • {product.revenue}</span>
                                </div>
                                <div className={`product-trend ${product.trend >= 0 ? 'positive' : 'negative'}`}>
                                    {product.trend >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                    {Math.abs(product.trend)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

