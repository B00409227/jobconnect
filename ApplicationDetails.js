import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { db } from './firebase-config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function ApplicationDetails() {
    const { applicationId } = useParams();
    const [application, setApplication] = useState(null);
    const [job, setJob] = useState(null);
    const [applicantProfile, setApplicantProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const { userRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const applicationDoc = await getDoc(doc(db, 'applications', applicationId));
                if (applicationDoc.exists()) {
                    const applicationData = { id: applicationDoc.id, ...applicationDoc.data() };
                    setApplication(applicationData);

                    // Fetch job details
                    const jobDoc = await getDoc(doc(db, 'jobs', applicationData.jobId));
                    if (jobDoc.exists()) {
                        setJob({ id: jobDoc.id, ...jobDoc.data() });
                    }

                    // Fetch applicant profile
                    const userDoc = await getDoc(doc(db, 'users', applicationData.userId));
                    if (userDoc.exists()) {
                        setApplicantProfile({ id: userDoc.id, ...userDoc.data() });
                    }
                }
            } catch (error) {
                console.error("Error fetching details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [applicationId]);

    const handleStatusChange = async (newStatus) => {
        try {
            await updateDoc(doc(db, 'applications', applicationId), {
                status: newStatus,
                updatedAt: new Date()
            });
            setApplication(prev => ({...prev, status: newStatus}));
        } catch (error) {
            console.error("Error updating status:", error);
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="container py-5">Loading...</div>;
    if (!application || !job) return <div className="container py-5">Application not found</div>;

    return (
        <div className="container py-5">
            <div className="card shadow">
                <div className="card-body">
                    <h2 className="card-title mb-4">Application Details #{application.id.slice(-6)}</h2>
                    
                    {/* Application Status */}
                    <div className="mb-4">
                        <h5>Application Status</h5>
                        <div className="d-flex align-items-center gap-3">
                            <span className={`badge bg-${
                                application.status === 'pending' ? 'warning' :
                                application.status === 'reviewing' ? 'info' :
                                application.status === 'offer sent' ? 'primary' :
                                application.status === 'declined' ? 'danger' : 'success'
                            } p-2`}>
                                {application.status.toUpperCase()}
                            </span>
                            {userRole === 'employer' && (
                                <select 
                                    className="form-select w-auto"
                                    value={application.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="reviewing">Reviewing</option>
                                    <option value="decision made">Decision Made</option>
                                    <option value="offer sent">Offer Sent</option>
                                    <option value="declined">Declined</option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Job Details Section */}
                    <div className="mb-4">
                        <h4 className="border-bottom pb-2">Job Information</h4>
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <h5>Company</h5>
                                <p>{job.company}</p>
                                <h5>Location</h5>
                                <p>{job.location}</p>
                                <h5>Salary</h5>
                                <p className="text-success fw-bold">${job.salary?.toLocaleString()}</p>
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
                    </div>

                    {/* Applicant Details Section */}
                    <div className="mb-4">
                        <h4 className="border-bottom pb-2">Applicant Information</h4>
                        <div className="row">
                            <div className="col-md-6">
                                <p><strong>Name:</strong> {applicantProfile?.firstName} {applicantProfile?.lastName}</p>
                                <p><strong>Email:</strong> {applicantProfile?.email}</p>
                                <p><strong>Phone:</strong> {applicantProfile?.phone}</p>
                                <p><strong>Location:</strong> {applicantProfile?.location}</p>
                            </div>
                            <div className="col-md-6">
                                <p><strong>Applied On:</strong> {application?.appliedOn?.toDate().toLocaleDateString()}</p>
                                <p><strong>Current Status:</strong> 
                                    <span className={`badge bg-${
                                        application.status === 'pending' ? 'warning' :
                                        application.status === 'reviewing' ? 'info' :
                                        application.status === 'offer sent' ? 'primary' :
                                        application.status === 'declined' ? 'danger' : 'success'
                                    } ms-2`}>
                                        {application.status.toUpperCase()}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h5>Bio</h5>
                            <p>{applicantProfile?.bio}</p>

                            <h5>Qualifications</h5>
                            <p>{applicantProfile?.qualifications}</p>

                            <h5>Work Experience</h5>
                            <p>{applicantProfile?.experience}</p>

                            <h5>Skills</h5>
                            <p>{applicantProfile?.skills}</p>

                            <h5>Cover Letter</h5>
                            <p>{applicantProfile?.coverLetter}</p>

                            {applicantProfile?.cvUrl && (
                                <div className="mt-3">
                                    <h5>CV/Resume</h5>
                                    <a 
                                        href={applicantProfile.cvUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="btn btn-outline-primary"
                                    >
                                        <i className="fas fa-file-pdf me-2"></i>
                                        View CV
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Update Section for Employer */}
                    {userRole === 'employer' && (
                        <div className="mb-4">
                            <h4 className="border-bottom pb-2">Update Application Status</h4>
                            <select 
                                className="form-select"
                                value={application.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                            >
                                <option value="pending">Pending</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="decision made">Decision Made</option>
                                <option value="offer sent">Offer Sent</option>
                                <option value="declined">Declined</option>
                            </select>
                        </div>
                    )}

                    <div className="mt-4">
                        <button 
                            className="btn btn-secondary"
                            onClick={() => navigate(-1)}
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ApplicationDetails; 