import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase-config';
import { useAuth } from './AuthContext';

export default function JobApplication() {
    const { jobId } = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const { currentUser, userRole } = useAuth();
    const navigate = useNavigate();

    const checkApplication = async () => {
        if (currentUser) {
            const q = query(
                collection(db, 'applications'),
                where('jobId', '==', jobId),
                where('userId', '==', currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            setHasApplied(!querySnapshot.empty);
        }
    };

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const jobDoc = await getDoc(doc(db, 'jobs', jobId));
                if (jobDoc.exists()) {
                    setJob({ id: jobDoc.id, ...jobDoc.data() });
                    if (userRole === 'jobseeker' && currentUser) {
                        await checkApplication();
                    }
                }
            } catch (error) {
                console.error("Error fetching job:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [jobId, currentUser, userRole]);

    const handleApply = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        try {
            // Get user profile data first
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const userData = userDoc.data();
            
            if (!userData?.firstName || !userData?.lastName) {
                alert('Please complete your profile before applying');
                navigate('/profile');
                return;
            }

            const application = {
                jobId: job.id,
                jobTitle: job.title,
                userId: currentUser.uid,
                employerId: job.ownerId,
                status: 'pending',
                appliedOn: new Date(),
                company: job.company,
                salary: job.salary,
                applicantName: `${userData.firstName} ${userData.lastName}`,
                applicantEmail: userData.email,
                applicantPhone: userData.phone || ''
            };

            await addDoc(collection(db, 'applications'), application);
            setHasApplied(true);
            setShowModal(true);
        } catch (error) {
            console.error("Error applying:", error);
            alert('Failed to apply: ' + error.message);
        }
    };

    if (loading) return <div className="container py-5">Loading...</div>;
    if (!job) return <div className="container py-5">Job not found</div>;

    return (
        <div className="container py-5">
            <div className="card shadow">
                <div className="card-body">
                    <h2 className="card-title mb-4">{job.title}</h2>
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <h5>Company</h5>
                            <p>{job.company}</p>
                            <h5>Location</h5>
                            <p>{job.location}</p>
                            <h5>Salary</h5>
                            <p className="text-success fw-bold">${job.salary.toLocaleString()}</p>
                        </div>
                        <div className="col-md-6">
                            <h5>Job Type</h5>
                            <p><span className="badge bg-primary">{job.type}</span></p>
                            <h5>Application Deadline</h5>
                            <p>{new Date(job.deadline).toLocaleDateString()}</p>
                            {job.remote && <p className="badge bg-success">Remote Work Available</p>}
                        </div>
                    </div>

                    <h5>Job Description</h5>
                    <p className="mb-4">{job.description}</p>

                    <h5>Required Skills</h5>
                    <p className="mb-4">{job.skills}</p>

                    <h5>Required Experience</h5>
                    <p className="mb-4">{job.experience}</p>

                    <h5>Education Requirements</h5>
                    <p className="mb-4">{job.education}</p>

                    <h5>Benefits</h5>
                    <p className="mb-4">{job.benefits}</p>

                    {userRole === 'jobseeker' && (
                        <div className="d-grid gap-2 col-md-6 mx-auto">
                            {!currentUser ? (
                                <button 
                                    className="btn btn-secondary btn-lg"
                                    onClick={() => navigate('/login')}
                                >
                                    Login to Apply
                                </button>
                            ) : hasApplied ? (
                                <button 
                                    className="btn btn-secondary btn-lg"
                                    disabled
                                >
                                    Already Applied
                                </button>
                            ) : (
                                <button 
                                    className="btn btn-primary btn-lg"
                                    onClick={handleApply}
                                >
                                    Apply Now
                                </button>
                            )}
                        </div>
                    )}

                    {userRole === 'admin' && (
                        <div className="d-grid gap-2 col-md-6 mx-auto">
                            <button 
                                className="btn btn-secondary btn-lg"
                                onClick={() => navigate('/admin-panel')}
                            >
                                Back to Admin Panel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <>
                    <div className="modal-backdrop fade show"></div>
                    <div className="modal show d-block" tabIndex="-1" role="dialog" aria-labelledby="applicationModal">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-success text-white">
                                    <h5 className="modal-title" id="applicationModal">
                                        <i className="fas fa-check-circle me-2"></i>
                                        Application Submitted Successfully!
                                    </h5>
                                    <button 
                                        type="button" 
                                        className="btn-close btn-close-white" 
                                        aria-label="Close"
                                        onClick={() => {
                                            setShowModal(false);
                                            navigate('/');
                                        }}
                                    ></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="text-center mb-4">
                                        <div className="h1 text-success mb-3">
                                            <i className="fas fa-check-circle"></i>
                                        </div>
                                        <h4 className="mb-3">Thank you for your application!</h4>
                                        <p className="text-muted">
                                            We've received your application and the employer will review it soon.
                                            You can track the status of your application in your dashboard.
                                        </p>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button 
                                        type="button" 
                                        className="btn btn-primary px-4"
                                        onClick={() => navigate('/jobseeker-dashboard')}
                                    >
                                        View My Applications
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary"
                                        onClick={() => {
                                            setShowModal(false);
                                            navigate('/jobs');
                                        }}
                                    >
                                        Browse More Jobs
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
} 