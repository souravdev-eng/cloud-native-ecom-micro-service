import React from 'react';
import './Shipping.css';

import LocalShippingIcon from '@mui/icons-material/LocalShippingRounded';
import FlightIcon from '@mui/icons-material/FlightRounded';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoatRounded';
import InventoryIcon from '@mui/icons-material/Inventory2Rounded';
import RefreshIcon from '@mui/icons-material/RefreshRounded';
import VisibilityIcon from '@mui/icons-material/VisibilityRounded';

interface Shipment {
    id: string;
    orderId: string;
    customer: string;
    destination: string;
    carrier: string;
    status: 'processing' | 'in_transit' | 'out_for_delivery' | 'delivered';
    estimatedDelivery: string;
    trackingNumber: string;
}

const mockShipments: Shipment[] = [
    { id: 'SHP-001', orderId: 'ORD-2847', customer: 'John Doe', destination: 'New York, NY', carrier: 'FedEx', status: 'delivered', estimatedDelivery: 'Dec 24, 2025', trackingNumber: 'FX123456789' },
    { id: 'SHP-002', orderId: 'ORD-2846', customer: 'Sarah Wilson', destination: 'Los Angeles, CA', carrier: 'UPS', status: 'out_for_delivery', estimatedDelivery: 'Dec 25, 2025', trackingNumber: 'UP987654321' },
    { id: 'SHP-003', orderId: 'ORD-2845', customer: 'Mike Johnson', destination: 'Chicago, IL', carrier: 'USPS', status: 'in_transit', estimatedDelivery: 'Dec 26, 2025', trackingNumber: 'US456789123' },
    { id: 'SHP-004', orderId: 'ORD-2844', customer: 'Emily Brown', destination: 'Houston, TX', carrier: 'DHL', status: 'processing', estimatedDelivery: 'Dec 27, 2025', trackingNumber: 'DH789123456' },
    { id: 'SHP-005', orderId: 'ORD-2843', customer: 'Alex Chen', destination: 'Miami, FL', carrier: 'FedEx', status: 'in_transit', estimatedDelivery: 'Dec 26, 2025', trackingNumber: 'FX234567890' },
];

const shippingStats = [
    { label: 'Processing', value: 23, icon: <InventoryIcon />, color: '#f59e0b' },
    { label: 'In Transit', value: 156, icon: <LocalShippingIcon />, color: '#3b82f6' },
    { label: 'Out for Delivery', value: 42, icon: <FlightIcon />, color: '#8b5cf6' },
    { label: 'Delivered Today', value: 89, icon: <DirectionsBoatIcon />, color: '#22c55e' },
];

const getStatusClass = (status: string) => {
    switch (status) {
        case 'delivered': return 'badge-success';
        case 'out_for_delivery': return 'badge-info';
        case 'in_transit': return 'badge-warning';
        case 'processing': return 'badge-error';
        default: return '';
    }
};

const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const Shipping: React.FC = () => {
    return (
        <div className="shipping-page">
            <div className="page-header animate-fade-in">
                <div>
                    <h1 className="page-title">Shipping</h1>
                    <p className="page-subtitle">Track and manage shipments</p>
                </div>
                <button className="btn btn-secondary">
                    <RefreshIcon />
                    Sync Tracking
                </button>
            </div>

            {/* Shipping Stats */}
            <div className="shipping-stats animate-fade-in stagger-1">
                {shippingStats.map((stat) => (
                    <div key={stat.label} className="shipping-stat" style={{ '--stat-color': stat.color } as React.CSSProperties}>
                        <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                            {stat.icon}
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Shipments Table */}
            <div className="card animate-fade-in stagger-2">
                <div className="card-header">
                    <h3 className="card-title">Active Shipments</h3>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Shipment ID</th>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Destination</th>
                            <th>Carrier</th>
                            <th>Status</th>
                            <th>Est. Delivery</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockShipments.map((shipment) => (
                            <tr key={shipment.id}>
                                <td><span className="shipment-id">{shipment.id}</span></td>
                                <td><span className="order-ref">{shipment.orderId}</span></td>
                                <td>{shipment.customer}</td>
                                <td>{shipment.destination}</td>
                                <td>
                                    <span className="carrier-badge">{shipment.carrier}</span>
                                </td>
                                <td>
                                    <span className={`badge ${getStatusClass(shipment.status)}`}>
                                        {formatStatus(shipment.status)}
                                    </span>
                                </td>
                                <td>{shipment.estimatedDelivery}</td>
                                <td>
                                    <button className="btn btn-ghost btn-sm">
                                        <VisibilityIcon />
                                        Track
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Shipping;

