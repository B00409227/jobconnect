import React, { useEffect, useState } from 'react';
import { db } from './firebase-config';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { FaUsers, FaBriefcase, FaFileAlt, FaEdit, FaTrash } from 'react-icons/fa';
import './styles.css';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
    const { currentUser, userRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('users');
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                navigate('/login');
                return;
            }

            if (userRole !== 'admin') {
                setError("Access denied. Admin privileges required.");
                navigate('/');
                return;
            }

            try {
                // Fetch all data in parallel
                const [usersData, jobsData, applicationsData] = await Promise.all([
                    getDocs(collection(db, 'users')),
                    getDocs(collection(db, 'jobs')),
                    getDocs(collection(db, 'applications'))
                ]);

                // Process the data
                setUsers(usersData.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                })));

                setJobs(jobsData.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                })));

                setApplications(applicationsData.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                })));

            } catch (err) {
                setError("Error fetching data: " + err.message);
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, userRole, navigate]);

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await deleteDoc(doc(db, 'users', userId));
            setUsers(users.filter(user => user.id !== userId));
        } catch (err) {
            console.error("Error deleting user:", err);
            alert('Failed to delete user');
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        try {
            await deleteDoc(doc(db, 'jobs', jobId));
            setJobs(jobs.filter(job => job.id !== jobId));
        } catch (err) {
            console.error("Error deleting job:", err);
            alert('Failed to delete job');
        }
    };

    const handleDeleteApplication = async (applicationId) => {
        if (!window.confirm('Are you sure you want to delete this application?')) return;
        try {
            await deleteDoc(doc(db, 'applications', applicationId));
            setApplications(applications.filter(app => app.id !== applicationId));
        } catch (err) {
            console.error("Error deleting application:", err);
            alert('Failed to delete application');
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user.id);
        setEditFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || ''
        });
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateUser = async (e, userId) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, 'users', userId), {
                firstName: editFormData.firstName,
                lastName: editFormData.lastName,
                phone: editFormData.phone,
                email: editFormData.email,
                updatedAt: new Date()
            });

            setUsers(users.map(user => 
                user.id === userId 
                    ? { ...user, 
                        firstName: editFormData.firstName,
                        lastName: editFormData.lastName,
                        phone: editFormData.phone,
                        email: editFormData.email 
                      } 
                    : user
            ));
            setEditingUser(null);
            alert('User updated successfully');
        } catch (err) {
            console.error("Error updating user:", err);
            alert('Failed to update user: ' + err.message);
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    if (error) return (
        <div className="alert alert-danger m-4" role="alert">{error}</div>
    );

    return (
        <div className="container-fluid py-4">
            <div className="row mb-4">
                <div className="col">
                    <h1 className="display-4 mb-4">Admin Dashboard</h1>
                    
                    <div className="row mb-4">
                        <div className="col-md-4">
                            <div className="card bg-primary text-white">
                                <div className="card-body">
                                    <h5 className="card-title">Total Users</h5>
                                    <h2>{users.length}</h2>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card bg-success text-white">
                                <div className="card-body">
                                    <h5 className="card-title">Active Jobs</h5>
                                    <h2>{jobs.length}</h2>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card bg-info text-white">
                                <div className="card-body">
                                    <h5 className="card-title">Applications</h5>
                                    <h2>{applications.length}</h2>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ul className="nav nav-pills mb-4">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                <FaUsers className="me-2" />
                                Users
                            </button>
                        </li>
                        <li className="nav-item ms-2">
                            <button 
                                className={`nav-link ${activeTab === 'jobs' ? 'active' : ''}`}
                                onClick={() => setActiveTab('jobs')}
                            >
                                <FaBriefcase className="me-2" />
                                Jobs
                            </button>
                        </li>
                        <li className="nav-item ms-2">
                            <button 
                                className={`nav-link ${activeTab === 'applications' ? 'active' : ''}`}
                                onClick={() => setActiveTab('applications')}
                            >
                                <FaFileAlt className="me-2" />
                                Applications
                            </button>
                        </li>
                    </ul>

                    <div className="tab-content">
                        {activeTab === 'users' && (
                            <div className="row g-4">
                                {users.map((user) => (
                                    <div key={user.id} className="col-md-4 mb-4">
                                        <div className="card h-100">
                                            <div className="card-body">
                                                {editingUser === user.id ? (
                                                    <form onSubmit={(e) => handleUpdateUser(e, user.id)}>
                                                        <div className="mb-3">
                                                            <label className="form-label">First Name</label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                name="firstName"
                                                                value={editFormData.firstName}
                                                                onChange={handleEditFormChange}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label">Last Name</label>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                name="lastName"
                                                                value={editFormData.lastName}
                                                                onChange={handleEditFormChange}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label">Email</label>
                                                            <input
                                                                type="email"
                                                                className="form-control"
                                                                name="email"
                                                                value={editFormData.email}
                                                                onChange={handleEditFormChange}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label">Phone</label>
                                                            <input
                                                                type="tel"
                                                                className="form-control"
                                                                name="phone"
                                                                value={editFormData.phone}
                                                                onChange={handleEditFormChange}
                                                            />
                                                        </div>
                                                        <div className="d-flex gap-2">
                                                            <button type="submit" className="btn btn-success">
                                                                <FaEdit className="me-2" />Save
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                className="btn btn-secondary"
                                                                onClick={() => setEditingUser(null)}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <>
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <h5 className="card-title">{user.firstName} {user.lastName}</h5>
                                                                <p className="card-text text-muted">
                                                                    <small>{user.email}</small><br/>
                                                                    <small>{user.phone}</small>
                                                                </p>
                                                            </div>
                                                            <span className={`badge bg-${user.userType === 'employer' ? 'primary' : 'success'}`}>
                                                                {user.userType}
                                                            </span>
                                                        </div>
                                                        <div className="mt-3">
                                                            <button 
                                                                className="btn btn-primary btn-sm me-2"
                                                                onClick={() => handleEditUser(user)}
                                                            >
                                                                <FaEdit /> Edit
                                                            </button>
                                                            <button 
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleDeleteUser(user.id)}
                                                            >
                                                                <FaTrash /> Delete
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'jobs' && (
                            <div className="row g-4">
                                {jobs.map((job) => (
                                    <div key={job.id} className="col-md-6 col-lg-4">
                                        <div 
                                            className="card h-100 shadow-sm cursor-pointer" 
                                            onClick={() => navigate(`/job/${job.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <h5 className="card-title">{job.title}</h5>
                                                    <span className="badge bg-primary">{job.category}</span>
                                                </div>
                                                <p className="card-text">{job.description}</p>
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <span className="text-success fw-bold">${job.salary}</span>
                                                    <small className="text-muted">
                                                        Posted: {job.createdAt?.toDate().toLocaleDateString()}
                                                    </small>
                                                </div>
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <button 
                                                        onClick={() => handleDeleteJob(job.id)}
                                                        className="btn btn-outline-danger btn-sm"
                                                    >
                                                        <FaTrash className="me-1" />Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'applications' && (
                            <div className="row g-4">
                                {applications.map((application) => (
                                    <div key={application.id} className="col-md-6 col-lg-4">
                                        <div className="card h-100 shadow-sm">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <h5 className="card-title">Application #{application.id.slice(-6)}</h5>
                                                    <span className={`badge bg-${
                                                        application.status === 'pending' ? 'warning' :
                                                        application.status === 'accepted' ? 'success' : 'danger'
                                                    }`}>
                                                        {application.status}
                                                    </span>
                                                </div>
                                                <div className="mb-3">
                                                    <p className="card-text mb-1">
                                                        <strong>Job:</strong> {application.jobTitle || application.jobId}
                                                    </p>
                                                    <p className="card-text mb-1">
                                                        <strong>Applicant:</strong> {application.applicantName || 'Anonymous User'}
                                                    </p>
                                                    <p className="card-text mb-1">
                                                        <strong>Applied:</strong> {application.appliedOn?.toDate().toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <button 
                                                        onClick={() => handleDeleteApplication(application.id)}
                                                        className="btn btn-outline-danger btn-sm"
                                                    >
                                                        <FaTrash className="me-1" />Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
