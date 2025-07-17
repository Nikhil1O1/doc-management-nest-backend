import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          Document Management System
        </Link>

        {user ? (
          <div className="navbar-menu">
            <div className="navbar-nav">
              <Link
                to="/dashboard"
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link
                to="/documents"
                className={`nav-link ${isActive('/documents') ? 'active' : ''}`}
              >
                Documents
              </Link>
              {(user.role === 'admin' || user.role === 'editor') && (
                <Link
                  to="/ingestion"
                  className={`nav-link ${isActive('/ingestion') ? 'active' : ''}`}
                >
                  Ingestion Jobs
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/users"
                  className={`nav-link ${isActive('/users') ? 'active' : ''}`}
                >
                  Users
                </Link>
              )}
            </div>

            <div className="navbar-user">
              <div className="user-info">
                <span className="user-name">
                  {user.firstName} {user.lastName}
                </span>
                <span className="user-role">{user.role}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="navbar-auth">
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/register" className="nav-link">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 