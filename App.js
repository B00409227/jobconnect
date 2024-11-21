import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import GlobalErrorBoundary from './GlobalErrorHandler';
import { ErrorUtils } from './GlobalErrorHandler';
import Navbar from './Navbar';
import JobPostForm from './JobPostForm';
import JobListings from './JobListings';
import EmployerDashboard from './EmployerDashboard';
import JobSeekerDashboard from './JobSeekerDashboard';
import AdminPanel from './AdminPanel';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import JobApplication from './JobApplication';
import ApplicationDetails from './ApplicationDetails';

const footerStyles = {
  footer: {
    backgroundColor: '#282c34',
    color: '#ffffff',
    padding: '2rem 0',
    marginTop: 'auto',
    width: '100%',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '2rem',
  },
  section: {
    flex: '1 1 250px',
  },
  heading: {
    color: '#61dafb',
    marginBottom: '1rem',
    fontSize: '1.2rem',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    marginBottom: '0.5rem',
  },
  link: {
    color: '#ffffff',
    textDecoration: 'none',
    transition: 'color 0.3s ease',
  },
  copyright: {
    textAlign: 'center',
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid #404756',
    color: '#61dafb',
  }
};

const Footer = () => {
  return (
    <footer style={footerStyles.footer}>
      <div style={footerStyles.container}>
        <div style={footerStyles.section}>
          <h3 style={footerStyles.heading}>JobConnect</h3>
          <p>Connecting talented professionals with outstanding opportunities.</p>
        </div>

        <div style={footerStyles.section}>
          <h3 style={footerStyles.heading}>Quick Links</h3>
          <ul style={footerStyles.list}>
            <li style={footerStyles.listItem}>
              <a style={footerStyles.link} href="/job-listings">Find Jobs</a>
            </li>
            <li style={footerStyles.listItem}>
              <a style={footerStyles.link} href="/post-job">Post a Job</a>
            </li>
            <li style={footerStyles.listItem}>
              <a style={footerStyles.link} href="/profile">My Profile</a>
            </li>
          </ul>
        </div>

        <div style={footerStyles.section}>
          <h3 style={footerStyles.heading}>Contact Us</h3>
          <ul style={footerStyles.list}>
            <li style={footerStyles.listItem}>📍 123 Job Street</li>
            <li style={footerStyles.listItem}>📞 (555) 123-4567</li>
            <li style={footerStyles.listItem}>✉️ support@jobconnect.com</li>
          </ul>
        </div>
      </div>
      <div style={footerStyles.copyright}>
        <p>&copy; {new Date().getFullYear()} JobConnect. All rights reserved.</p>
      </div>
    </footer>
  );
};

const AppContent = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthError = (error) => {
      if (error.type === 'auth') {
        logout();
        navigate('/login');
      }
    };

    const unsubscribe = ErrorUtils.subscribeToErrors(handleAuthError);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [logout, navigate]);

  return (
    <div className="app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="container" style={{ flex: 1, padding: '20px' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/post-job" 
            element={
              <ProtectedRoute requiredRole="employer">
                <JobPostForm />
              </ProtectedRoute>
            } 
          />
          <Route path="/job-listings" element={<JobListings />} />
          <Route 
            path="/employer-dashboard" 
            element={
              <ProtectedRoute requiredRole="employer">
                <EmployerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/jobseeker-dashboard" 
            element={
              <ProtectedRoute requiredRole="jobseeker">
                <JobSeekerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin-panel" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<JobListings />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/job/:jobId" 
            element={
              <ProtectedRoute requiredRole="jobseeker">
                <JobApplication />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/application/:applicationId" 
            element={
              <ProtectedRoute>
                <ApplicationDetails />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <GlobalErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </GlobalErrorBoundary>
  );
}

export default App;
