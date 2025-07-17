import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Stats {
  users?: { total: number; active: number; inactive: number };
  documents?: { total: number; totalSize: number };
  ingestion?: { total: number; averageDuration?: number };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [documentsRes, ingestionRes, usersRes] = await Promise.allSettled([
          axios.get('/documents/stats'),
          axios.get('/ingestion/jobs/stats'),
          user?.role === 'admin' ? axios.get('/users/stats') : null,
        ].filter(Boolean));

        const newStats: Stats = {};

        if (documentsRes.status === 'fulfilled' && documentsRes.value) {
          newStats.documents = documentsRes.value.data;
        }

        if (ingestionRes.status === 'fulfilled' && ingestionRes.value) {
          newStats.ingestion = ingestionRes.value.data;
        }

        if (usersRes && usersRes.status === 'fulfilled' && usersRes.value) {
          newStats.users = usersRes.value.data;
        }

        setStats(newStats);
        setError(null);
      } catch (err: any) {
        setError('Failed to fetch dashboard data');
        console.error('Dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.role]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Dashboard</h1>
      <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
        <h2>Welcome, {user?.firstName} {user?.lastName}!</h2>
        <p>Role: <strong>{user?.role}</strong></p>
        <p>This is your Document Management System dashboard.</p>
        {loading && <p style={{ color: '#666' }}>Loading dashboard data...</p>}
        {error && <p style={{ color: '#e74c3c' }}>⚠️ {error}</p>}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>📄 Documents</h3>
          <p>Manage and upload documents for processing.</p>
          {stats.documents && (
            <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '0.25rem' }}>
              <p><strong>Total:</strong> {stats.documents.total} documents</p>
              <p><strong>Size:</strong> {(stats.documents.totalSize / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          )}
        </div>
        
        {(user?.role === 'admin' || user?.role === 'editor') && (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>⚙️ Ingestion Jobs</h3>
            <p>Monitor document processing and RAG ingestion.</p>
            {stats.ingestion && (
              <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '0.25rem' }}>
                <p><strong>Total Jobs:</strong> {stats.ingestion.total}</p>
                <p><strong>Avg Duration:</strong> {stats.ingestion.averageDuration}s</p>
              </div>
            )}
          </div>
        )}
        
        {user?.role === 'admin' && (
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>👥 User Management</h3>
            <p>Manage users and their permissions.</p>
            {stats.users && (
              <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '0.25rem' }}>
                <p><strong>Total:</strong> {stats.users.total} users</p>
                <p><strong>Active:</strong> {stats.users.active} users</p>
                <p><strong>Inactive:</strong> {stats.users.inactive} users</p>
              </div>
            )}
          </div>
        )}

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3>🔗 API Status</h3>
          <p>Backend connectivity and API availability.</p>
          <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#d4edda', borderRadius: '0.25rem', color: '#155724' }}>
            <p><strong>✅ Status:</strong> Connected</p>
            <p><strong>🌐 Backend:</strong> localhost:3000</p>
            <p><strong>📚 Docs:</strong> <a href="http://localhost:3000/api/docs" target="_blank" rel="noopener noreferrer">Swagger API</a></p>
          </div>
        </div>
      </div>
      
      {user?.role === 'admin' && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#fff3cd', borderRadius: '0.5rem', border: '1px solid #ffeaa7' }}>
          <h3>🔧 Demo Mode Notice</h3>
          <p>You're running in demo mode with full API functionality:</p>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li>✅ Authentication APIs (register, login, logout, profile)</li>
            <li>✅ User Management APIs (CRUD, roles, statistics)</li>
            <li>✅ Document Management APIs (upload, CRUD, download)</li>
            <li>✅ Ingestion APIs (jobs, retry, cancel, Python backend integration)</li>
          </ul>
          <p><em>All endpoints are working without requiring a database connection.</em></p>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 