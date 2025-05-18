import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="header">
      <div className="container header-container">
        <Link to="/" className="logo">
          Book Exchange
        </Link>

        <div className="mobile-menu-toggle" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <nav className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
                Home
              </Link>
            </li>

            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link to="/my-books" className="nav-link" onClick={() => setMenuOpen(false)}>
                    My Books
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/deals" className="nav-link" onClick={() => setMenuOpen(false)}>
                    Deals
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <button className="nav-link logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="nav-link btn btn-primary" onClick={() => setMenuOpen(false)}>
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;