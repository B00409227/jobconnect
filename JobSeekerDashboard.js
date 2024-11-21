import React, { useEffect, useState } from 'react';
import { db } from './firebase-config';
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import './styles.css';

function JobSeekerDashboard() {
    const [applications, setApplications] = useState([]);
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleOfferResponse = async (applicationId, response) => {
        try {
            // Verify the application belongs to the current user
            const applicationRef = doc(db, 'applications', applicationId);
            const applicationDoc = await getDoc(applicationRef);
            
            if (!applicationDoc.exists()) {
                throw new Error('Application not found');
            }
            
            const applicationData = applicationDoc.data();
            if (applicationData.userId !== currentUser.uid) {
                throw new Error('Unauthorized access');
            }

            await updateDoc(applicationRef, {
                status: response,
                responseDate: new Date(),
                updatedBy: currentUser.uid
            });

            // Update local state
            setApplications(applications.map(app => 
                app.id === applicationId 
                    ? {...app, status: response} 
                    : app
            ));

            if (response === 'accepted') {
                alert('Congratulations! You have accepted the job offer.');
            } else {
                alert('You have declined the job offer. Best of luck with your job search!');
            }
        } catch (error) {
            console.error("Error updating application:", error);
            alert('Failed to update application status');
        }
    };

    useEffect(() => {
        const fetchApplications = async () => {
            if (!currentUser) {
                setError("User not authenticated");
                setLoading(false);
                return;
            }
            try {
                const q = query(collection(db, 'applications'), where("userId", "==", currentUser.uid));
                const data = await getDocs(q);
                setApplications(data.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            } catch (err) {
                setError("Error fetching applications: " + err.message);
                console.error("Error fetching applications:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [currentUser]);

    if (loading) {
        return <div className="loading">Loading applications...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="container py-4">
            <h1 className="mb-4">My Job Applications</h1>
            {applications.length === 0 ? (
                <div className="alert alert-info">
                    You haven't applied to any jobs yet.
                </div>
            ) : (
                <div className="row g-4">
                    {applications.map((application) => (
                        <div key={application.id} className="col-md-6 col-lg-4">
                            <div className="card h-100">
                                <div className="card-body">
                                    <h5 className="card-title">{application.jobTitle}</h5>
                                    <p className="card-text">
                                        <strong>Company:</strong> {application.company}<br/>
                                        <strong>Applied as:</strong> {application.applicantName}<br/>
                                        <strong>Applied:</strong> {application.appliedOn.toDate().toLocaleDateString()}<br/>
                                        <strong>Status:</strong> 
                                        <span className={`badge bg-${
                                            application.status === 'pending' ? 'warning' :
                                            application.status === 'reviewing' ? 'info' :
                                            application.status === 'offer sent' ? 'primary' :
                                            application.status === 'declined' ? 'danger' : 'success'
                                        } ms-2`}>
                                            {application.status}
                                        </span>
                                    </p>
                                    
                                    {application.status === 'offer sent' && (
                                        <div className="mt-3">
                                            <button 
                                                className="btn btn-success me-2"
                                                onClick={() => handleOfferResponse(application.id, 'accepted')}
                                            >
                                                Accept Offer
                                            </button>
                                            <button 
                                                className="btn btn-danger"
                                                onClick={() => handleOfferResponse(application.id, 'declined')}
                                            >
                                                Decline Offer
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default JobSeekerDashboard;
