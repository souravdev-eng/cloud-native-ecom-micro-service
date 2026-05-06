import React, { useState } from 'react';
import './Support.css';

import SearchIcon from '@mui/icons-material/SearchRounded';
import HelpIcon from '@mui/icons-material/HelpOutlineRounded';
import ChatIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import EmailIcon from '@mui/icons-material/EmailOutlined';
import PhoneIcon from '@mui/icons-material/PhoneOutlined';
import ArticleIcon from '@mui/icons-material/ArticleOutlined';
import VideoLibraryIcon from '@mui/icons-material/VideoLibraryOutlined';
import SchoolIcon from '@mui/icons-material/SchoolOutlined';

const helpTopics = [
    {
        icon: <ArticleIcon />,
        title: 'Getting Started',
        description: 'Learn the basics of setting up your store',
        articles: 12,
    },
    {
        icon: <HelpIcon />,
        title: 'FAQ',
        description: 'Frequently asked questions',
        articles: 24,
    },
    {
        icon: <VideoLibraryIcon />,
        title: 'Video Tutorials',
        description: 'Step-by-step video guides',
        articles: 8,
    },
    {
        icon: <SchoolIcon />,
        title: 'Best Practices',
        description: 'Tips to optimize your store',
        articles: 15,
    },
];

const popularArticles = [
    { title: 'How to add a new product', views: 1240 },
    { title: 'Setting up payment methods', views: 980 },
    { title: 'Configuring shipping zones', views: 876 },
    { title: 'Creating discount codes', views: 754 },
    { title: 'Managing customer accounts', views: 632 },
];

const contactOptions = [
    {
        icon: <ChatIcon />,
        title: 'Live Chat',
        description: 'Chat with our support team',
        action: 'Start Chat',
        available: true,
    },
    {
        icon: <EmailIcon />,
        title: 'Email Support',
        description: 'Get help via email',
        action: 'Send Email',
        available: true,
    },
    {
        icon: <PhoneIcon />,
        title: 'Phone Support',
        description: 'Available Mon-Fri, 9am-6pm',
        action: 'Call Now',
        available: false,
    },
];

const Support: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="support-page">
            <div className="support-header animate-fade-in">
                <h1 className="page-title">How can we help you?</h1>
                <p className="page-subtitle">Search our knowledge base or contact support</p>

                <div className="support-search">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search for help articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Help Topics */}
            <div className="help-topics animate-fade-in stagger-1">
                {helpTopics.map((topic) => (
                    <button key={topic.title} className="help-topic">
                        <div className="topic-icon">{topic.icon}</div>
                        <h3 className="topic-title">{topic.title}</h3>
                        <p className="topic-description">{topic.description}</p>
                        <span className="topic-count">{topic.articles} articles</span>
                    </button>
                ))}
            </div>

            <div className="support-grid">
                {/* Popular Articles */}
                <div className="card animate-fade-in stagger-2">
                    <div className="card-header">
                        <h3 className="card-title">Popular Articles</h3>
                        <a href="#" className="view-all">View All</a>
                    </div>
                    <div className="articles-list">
                        {popularArticles.map((article, index) => (
                            <a key={article.title} href="#" className="article-item">
                                <span className="article-number">{index + 1}</span>
                                <span className="article-title">{article.title}</span>
                                <span className="article-views">{article.views} views</span>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Contact Support */}
                <div className="card animate-fade-in stagger-3">
                    <div className="card-header">
                        <h3 className="card-title">Contact Support</h3>
                    </div>
                    <div className="contact-options">
                        {contactOptions.map((option) => (
                            <div key={option.title} className={`contact-option ${!option.available ? 'unavailable' : ''}`}>
                                <div className="contact-icon">{option.icon}</div>
                                <div className="contact-info">
                                    <h4 className="contact-title">{option.title}</h4>
                                    <p className="contact-description">{option.description}</p>
                                </div>
                                <button
                                    className={`btn ${option.available ? 'btn-primary' : 'btn-secondary'}`}
                                    disabled={!option.available}
                                >
                                    {option.action}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Banner */}
            <div className="status-banner animate-fade-in stagger-4">
                <div className="status-indicator">
                    <span className="status-dot"></span>
                    All Systems Operational
                </div>
                <a href="#" className="status-link">View Status Page →</a>
            </div>
        </div>
    );
};

export default Support;

