import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { auth } from './firebase-config';

function Navbar() {
    const { currentUser, userRole } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            alert('Failed to logout. Please try again.');
        }
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
            <div className="container">
                <Link className="navbar-brand" to="/">JobConnect</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        {currentUser ? (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/">Home</Link>
                                </li>
                                
                                {userRole === 'admin' && (
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin-panel">Admin Panel</Link>
                                    </li>
                                )}
                                
                                {userRole === 'employer' && (
                                    <>
                                        <li className="nav-item">
                                            <Link className="nav-link" to="/employer-dashboard">My Jobs</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link className="nav-link" to="/post-job">Post Job</Link>
                                        </li>
                                    </>
                                )}
                                
                                {userRole === 'jobseeker' && (
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/jobseeker-dashboard">My Applications</Link>
                                    </li>
                                )}
                                
                                <li className="nav-item">
                                    <Link className="nav-link" to="/profile">Profile</Link>
                                </li>
                                
                                <li className="nav-item">
                                    <button onClick={handleLogout} className="btn btn-danger ms-2">
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/login">Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/register">Register</Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar; 