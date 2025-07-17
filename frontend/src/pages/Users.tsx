import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    admin: number;
    editor: number;
    viewer: number;
  };
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);

      const response = await axios.get(`http://localhost:3000/api/v1/users?${params.toString()}`);
      setUsers(response.data.users);
      setTotalPages(Math.ceil(response.data.total / limit));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/v1/users/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRoleFilter = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(event.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'editor': return '#ffc107';
      case 'viewer': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? '#28a745' : '#6c757d';
  };

  if (loading && users.length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>User Management</h1>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>👥 User Management</h1>
      
      {/* User Statistics */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#007bff' }}>{stats.total}</h3>
            <p style={{ margin: 0, color: '#6c757d' }}>Total Users</p>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>{stats.active}</h3>
            <p style={{ margin: 0, color: '#6c757d' }}>Active Users</p>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#dc3545' }}>{stats.byRole.admin}</h3>
            <p style={{ margin: 0, color: '#6c757d' }}>Admins</p>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#ffc107' }}>{stats.byRole.editor}</h3>
            <p style={{ margin: 0, color: '#6c757d' }}>Editors</p>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '0.5rem', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '0.25rem',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={handleRoleFilter}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '0.25rem',
                fontSize: '1rem'
              }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '0.5rem', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Last Login</th>
              <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '1rem' }}>
                  <strong>{user.firstName} {user.lastName}</strong>
                </td>
                <td style={{ padding: '1rem', color: '#6c757d' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    backgroundColor: getRoleBadgeColor(user.role),
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    backgroundColor: getStatusBadgeColor(user.isActive),
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: '#6c757d' }}>
                  {formatDate(user.lastLoginAt)}
                </td>
                <td style={{ padding: '1rem', color: '#6c757d' }}>
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
            {searchTerm || roleFilter ? 'No users found matching your criteria.' : 'No users found.'}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
            Loading users...
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '1rem', 
          marginTop: '2rem' 
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ddd',
              borderRadius: '0.25rem',
              backgroundColor: currentPage === 1 ? '#f8f9fa' : 'white',
              color: currentPage === 1 ? '#6c757d' : '#007bff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <span style={{ color: '#6c757d' }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #ddd',
              borderRadius: '0.25rem',
              backgroundColor: currentPage === totalPages ? '#f8f9fa' : 'white',
              color: currentPage === totalPages ? '#6c757d' : '#007bff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Demo Mode Notice */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#fff3cd', 
        borderRadius: '0.5rem', 
        border: '1px solid #ffeaa7' 
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>🔧 Demo Mode</h4>
        <p style={{ margin: 0, color: '#856404' }}>
          This is demo data. Changes made here won't persist after refresh.
        </p>
      </div>
    </div>
  );
};

export default Users; 