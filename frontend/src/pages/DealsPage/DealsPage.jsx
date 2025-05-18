import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DealItem from '../../components/DealItem/DealItem';
import './DealsPage.css';

const DealsPage = () => {
  const { isAuthenticated } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchDeals();
    }
  }, [isAuthenticated]);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      // API call to get deals would go here
      // This is just dummy data for demonstration
      const dummyDeals = [
        {
          id: 1,
          sender_id: 'current-user-id',
          recipient_id: 'user-2',
          recipient_book_id: 5,
          recipient_book_title: 'The Great Gatsby',
          time: new Date().toISOString(),
          place: 'Central Library',
          status: 'Created',
          sender_name: 'You',
          recipient_name: 'John Doe',
        },
        {
          id: 2,
          sender_id: 'user-3',
          recipient_id: 'current-user-id',
          recipient_book_id: 8,
          recipient_book_title: 'Your Book Title',
          time: new Date().toISOString(),
          place: 'Coffee Shop',
          status: 'Created',
          sender_name: 'Jane Smith',
          recipient_name: 'You',
        },
        {
          id: 3,
          sender_id: 'current-user-id',
          recipient_id: 'user-4',
          recipient_book_id: 12,
          recipient_book_title: 'To Kill a Mockingbird',
          time: new Date(Date.now() - 86400000).toISOString(), // yesterday
          place: 'Park',
          status: 'Agreed',
          sender_name: 'You',
          recipient_name: 'Alice Johnson',
          recipient_email: 'alice@example.com',
          recipient_phone: '555-1234',
        },
      ];

      setDeals(dummyDeals);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch deals:', err);
      setError('Failed to load your deals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDeals = () => {
    if (activeTab === 'all') {
      return deals;
    } else if (activeTab === 'incoming') {
      return deals.filter(deal => deal.recipient_id === 'current-user-id');
    } else if (activeTab === 'outgoing') {
      return deals.filter(deal => deal.sender_id === 'current-user-id');
    } else if (activeTab === 'active') {
      return deals.filter(deal => deal.status === 'Agreed');
    } else if (activeTab === 'completed') {
      return deals.filter(deal => deal.status === 'Completed');
    }
    return [];
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="deals-page container">
      <div className="page-header">
        <h1>Your Book Deals</h1>
      </div>

      <div className="deals-tabs">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Deals
        </button>
        <button
          className={`tab-button ${activeTab === 'incoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('incoming')}
        >
          Incoming Requests
        </button>
        <button
          className={`tab-button ${activeTab === 'outgoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('outgoing')}
        >
          Your Requests
        </button>
        <button
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Deals
        </button>
        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
      </div>

      {loading ? (
        <div className="loading-indicator">Loading your deals...</div>
      ) : error ? (
        <div className="error-message alert alert-error">{error}</div>
      ) : (
        <div className="deals-list">
          {getFilteredDeals().length > 0 ? (
            getFilteredDeals().map((deal) => (
              <DealItem
                key={deal.id}
                deal={deal}
                refreshDeals={fetchDeals}
              />
            ))
          ) : (
            <div className="no-deals-message">
              <p>No deals found in this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DealsPage;