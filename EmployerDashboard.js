import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase-config';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

function EmployerDashboard() {
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [editingJob, setEditingJob] = useState(null);
    const [activeTab, setActiveTab] = useState('jobs');
    const [editFormData, setEditFormData] = useState({
        title: '',
        company: '',
        location: '',
        type: '',
        salary: '',
        description: '',
        skills: '',
        experience: '',
        education: '',
        benefits: '',
        deadline: '',
        remote: false,
        category: ''
    });
    const [showEditModal, setShowEditModal] = useState(false);

    // Reference existing useEffect for fetching jobs and applications
    useEffect(() => {
        const fetchJobs = async () => {
            if (!currentUser) return;
            try {
                const q = query(collection(db, 'jobs'), where("ownerId", "==", currentUser.uid));
                const data = await getDocs(q);
                setJobs(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
            } catch (error) {
                setError("Error loading jobs: " + error.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchApplications = async () => {
            if (!currentUser) return;
            try {
                const q = query(collection(db, 'applications'), where('employerId', '==', currentUser.uid));
                const querySnapshot = await getDocs(q);
                setApplications(querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })));
            } catch (err) {
                console.error("Error fetching applications:", err);
                setError(err.message);
            }
        };

        fetchJobs();
        fetchApplications();
    }, [currentUser]);

    const handleDelete = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        
        try {
            await deleteDoc(doc(db, 'jobs', jobId));
            setJobs(jobs.filter(job => job.id !== jobId));
            alert('Job deleted successfully');
        } catch (error) {
            console.error("Error deleting job:", error);
            alert('Failed to delete job: ' + error.message);
        }
    };

    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleUpdateJob = async (e) => {
        e.preventDefault();
        try {
            const updatedData = {
                ...editFormData,
                salary: Number(editFormData.salary),
                updatedAt: new Date()
            };

            await updateDoc(doc(db, 'jobs', editingJob), updatedData);
            
            setJobs(jobs.map(job => 
                job.id === editingJob ? { ...job, ...updatedData } : job
            ));
            
            setEditingJob(null);
            setShowEditModal(false);
            alert('Job updated successfully');
        } catch (error) {
            console.error("Error updating job:", error);
            alert('Failed to update job: ' + error.message);
        }
    };

    if (loading) return <div className="container py-5"><div className="spinner-border" role="status"></div></div>;
    if (error) return <div className="container py-5 alert alert-danger">{error}</div>;

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>{activeTab === 'jobs' ? 'Posted Jobs' : 'Applications'}</h1>
                {activeTab === 'jobs' && (
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/post-job')}
                    >
                        Post New Job
                    </button>
                )}
            </div>

            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'jobs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        Posted Jobs ({jobs.length})
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'applications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('applications')}
                    >
                        Applications ({applications.length})
                    </button>
                </li>
            </ul>

            {activeTab === 'jobs' ? (
                <div className="row g-4">
                    {jobs.map((job) => (
                        <div key={job.id} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between">
                                        <h5 className="card-title">{job.title}</h5>
                                        <div>
                                            <button 
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => {
                                                    setEditingJob(job.id);
                                                    setEditFormData(job);
                                                    setShowEditModal(true);
                                                }}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(job.id)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="card-text">
                                        <strong>Company:</strong> {job.company}<br/>
                                        <strong>Location:</strong> {job.location}<br/>
                                        <strong>Salary:</strong> ${job.salary?.toLocaleString()}<br/>
                                        <strong>Type:</strong> {job.type}
                                    </p>
                                    <div className="d-flex gap-2 flex-wrap">
                                        <span className="badge bg-primary">{job.category}</span>
                                        {job.remote && <span className="badge bg-success">Remote</span>}
                                    </div>
                                </div>
                                <div className="card-footer bg-transparent">
                                    <small className="text-muted">
                                        Posted: {job.createdAt?.toDate().toLocaleDateString()}
                                    </small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="row g-4">
                    {applications.map((application) => (
                        <div key={application.id} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm" 
                                 onClick={() => navigate(`/application/${application.id}`)}
                                 style={{cursor: 'pointer'}}>
                                <div className="card-body">
                                    <h5 className="card-title">Application #{application.id.slice(-6)}</h5>
                                    <p className="card-text">
                                        <strong>Job:</strong> {application.jobTitle}<br/>
                                        <strong>Applicant:</strong> {application.applicantName}<br/>
                                        <strong>Applied:</strong> {application.appliedOn?.toDate().toLocaleDateString()}
                                    </p>
                                    <span className={`badge bg-${
                                        application.status === 'pending' ? 'warning' :
                                        application.status === 'reviewing' ? 'info' :
                                        application.status === 'offer sent' ? 'primary' :
                                        application.status === 'declined' ? 'danger' : 'success'
                                    }`}>
                                        {application.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Job Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Job</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleUpdateJob}>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Job Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        value={editFormData.title}
                                        onChange={handleEditFormChange}
                                        required
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Company</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="company"
                                        value={editFormData.company}
                                        onChange={handleEditFormChange}
                                        required
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Location</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="location"
                                        value={editFormData.location}
                                        onChange={handleEditFormChange}
                                        required
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label>Salary</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="salary"
                                        value={editFormData.salary}
                                        onChange={handleEditFormChange}
                                        required
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label>Job Type</Form.Label>
                            <Form.Select name="type" value={editFormData.type} onChange={handleEditFormChange} required>
                                <option value="">Select Type</option>
                                <option value="full-time">Full Time</option>
                                <option value="part-time">Part Time</option>
                                <option value="contract">Contract</option>
                                <option value="internship">Internship</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={editFormData.description}
                                onChange={handleEditFormChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Required Skills</Form.Label>
                            <Form.Control
                                type="text"
                                name="skills"
                                value={editFormData.skills}
                                onChange={handleEditFormChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Remote Work Available"
                                name="remote"
                                checked={editFormData.remote}
                                onChange={handleEditFormChange}
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Update Job
                            </button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default EmployerDashboard;
