import React, { useState } from 'react';
import { dealsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './DealItem.css';

const DealItem = ({ deal, refreshDeals }) => {
  const { currentUser } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(null);

  const isSender = currentUser && deal.sender_id === currentUser.id;
  const isRecipient = currentUser && deal.recipient_id === currentUser.id;

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleAcceptDeal = async () => {
    if (!selectedBookId) {
      alert('Please select a book to exchange');
      return;
    }

    try {
      await dealsAPI.acceptDeal(deal.id, {
        sender_book_id: selectedBookId,
        gift_flag: false
      });

      alert('Deal accepted!');
      refreshDeals();
    } catch (error) {
      console.error('Failed to accept deal:', error);
      alert(`Failed to accept deal: ${error.message}`);
    }
  };

  const handleCompleteDeal = async () => {
    try {
      await dealsAPI.completeDeal(deal.id);

      alert('Deal completed!');
      refreshDeals();
    } catch (error) {
      console.error('Failed to complete deal:', error);
      alert(`Failed to complete deal: ${error.message}`);
    }
  };

  return (
    <div className={`deal-item ${expanded ? 'expanded' : ''}`}>
      <div className="deal-header" onClick={toggleExpand}>
        <div className="deal-title">
          <span className="deal-status" data-status={deal.status.toLowerCase()}>
            {deal.status}
          </span>
          <h3>
            {isSender ? 'You requested:' : 'Request from:'}
            {' '}{isSender ?
              deal.recipient_book_title || 'Book' :
              deal.sender_name || 'User'}
          </h3>
        </div>
        <div className="deal-toggle">
          <span className={`arrow ${expanded ? 'up' : 'down'}`}></span>
        </div>
      </div>

      {expanded && (
        <div className="deal-details">
          <div className="deal-info">
            <p><strong>Status:</strong> {deal.status}</p>
            <p><strong>Date:</strong> {new Date(deal.time).toLocaleDateString()}</p>
            <p><strong>Place:</strong> {deal.place || 'To be determined'}</p>

            {deal.status === 'Agreed' && (
              <div className="contact-info">
                <h4>Contact Information</h4>
                {isSender && (
                  <p>
                    <strong>Recipient:</strong> {deal.recipient_name || 'User'}<br />
                    <strong>Email:</strong> {deal.recipient_email || 'N/A'}<br />
                    <strong>Phone:</strong> {deal.recipient_phone || 'N/A'}
                  </p>
                )}

                {isRecipient && (
                  <p>
                    <strong>Sender:</strong> {deal.sender_name || 'User'}<br />
                    <strong>Email:</strong> {deal.sender_email || 'N/A'}<br />
                    <strong>Phone:</strong> {deal.sender_phone || 'N/A'}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="deal-actions">
            {isRecipient && deal.status === 'Created' && (
              <div className="accept-deal-form">
                <select
                  value={selectedBookId || ''}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select a book to exchange</option>
                  {/* This would be populated with the user's books */}
                  <option value="1">Book 1</option>
                  <option value="2">Book 2</option>
                </select>

                <button
                  className="btn btn-success"
                  onClick={handleAcceptDeal}
                >
                  Accept Deal
                </button>

                <button className="btn btn-error">
                  Reject Deal
                </button>
              </div>
            )}

            {isSender && deal.status === 'Created' && (
              <button className="btn btn-error">
                Cancel Request
              </button>
            )}

            {deal.status === 'Agreed' && (
              <button
                className="btn btn-primary"
                onClick={handleCompleteDeal}
              >
                Complete Deal
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DealItem;