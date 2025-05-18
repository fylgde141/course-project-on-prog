import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="profile-page container">
      <div className="profile-header">
        <h1>Your Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card card">
          <div className="profile-info">
            <div className="avatar">
              <span className="avatar-placeholder">
                {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
              </span>
            </div>

            <div className="user-details">
              <h2>{currentUser.username || 'User'}</h2>
              <p className="user-meta">
                <span className="label">Email:</span>
                <span className="value">{currentUser.email || 'Not provided'}</span>
              </p>
              <p className="user-meta">
                <span className="label">Phone:</span>
                <span className="value">{currentUser.phone || 'Not provided'}</span>
              </p>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-error" onClick={handleLogout}>
              Logout
            </button>
            <button className="btn btn-secondary">
              Edit Profile
            </button>
          </div>
        </div>

        <div className="profile-sections">
          <div className="profile-section card">
            <h3>Your Books</h3>
            <p>Manage your book library</p>
            <Link to="/my-books" className="btn btn-primary">
              View Your Books
            </Link>
          </div>

          <div className="profile-section card">
            <h3>Your Deals</h3>
            <p>Manage your exchange requests and offers</p>
            <Link to="/deals" className="btn btn-accent">
              View Deals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;