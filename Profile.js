import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db, auth, storage } from './firebase-config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateEmail, updatePassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function Profile() {
    const { currentUser, userRole } = useAuth();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        ...(userRole === 'employer' && {
            companyName: '',
            position: ''
        }),
        ...(userRole === 'jobseeker' && {
            bio: '',
            skills: '',
            location: '',
            qualifications: '',
            experience: '',
            coverLetter: '',
            cvUrl: ''
        })
    });

    // Fetch user data effect
    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return;
            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);
                    setFormData(prev => ({
                        ...prev,
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        ...(userRole === 'employer' ? {
                            companyName: data.companyName || '',
                            position: data.position || ''
                        } : {
                            bio: data.bio || '',
                            skills: data.skills || '',
                            location: data.location || '',
                            qualifications: data.qualifications || '',
                            experience: data.experience || '',
                            coverLetter: data.coverLetter || '',
                            cvUrl: data.cvUrl || ''
                        })
                    }));
                }
            } catch (err) {
                setError('Error fetching user data');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [currentUser]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoading(true);
            setError('');

            // Create a reference to the file in Firebase Storage
            const fileRef = ref(storage, `cvs/${currentUser.uid}/${file.name}`);
            
            // Upload the file
            await uploadBytes(fileRef, file);
            
            // Get the download URL
            const downloadURL = await getDownloadURL(fileRef);
            
            // Update formData with the new CV URL
            setFormData(prev => ({
                ...prev,
                cvUrl: downloadURL
            }));

            setSuccess('CV uploaded successfully!');
        } catch (err) {
            setError('Error uploading CV: ' + err.message);
            console.error('Error uploading file:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const updates = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                updatedAt: new Date()
            };

            if (userRole === 'employer') {
                updates.companyName = formData.companyName;
                updates.position = formData.position;
            } else if (userRole === 'jobseeker') {
                updates.bio = formData.bio;
                updates.skills = formData.skills;
                updates.location = formData.location;
                updates.qualifications = formData.qualifications;
                updates.experience = formData.experience;
                updates.coverLetter = formData.coverLetter;
                updates.cvUrl = formData.cvUrl;
            }

            await updateDoc(doc(db, 'users', currentUser.uid), updates);

            if (formData.email !== currentUser.email) {
                await updateEmail(auth.currentUser, formData.email);
            }

            if (formData.newPassword && formData.newPassword === formData.confirmPassword) {
                await updatePassword(auth.currentUser, formData.newPassword);
            }

            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError('Error updating profile: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card shadow-lg border-0">
                        <div className="card-header bg-primary text-white py-3">
                            <h3 className="card-title mb-0 text-center">Profile Settings</h3>
                        </div>
                        <div className="card-body p-4">
                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    {error}
                                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                                </div>
                            )}
                            {success && (
                                <div className="alert alert-success alert-dismissible fade show" role="alert">
                                    {success}
                                    <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="firstName"
                                                placeholder="First Name"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                            />
                                            <label htmlFor="firstName">First Name</label>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="lastName"
                                                placeholder="Last Name"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                            />
                                            <label htmlFor="lastName">Last Name</label>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="email"
                                                className="form-control"
                                                id="email"
                                                placeholder="Email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            />
                                            <label htmlFor="email">Email</label>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="tel"
                                                className="form-control"
                                                id="phone"
                                                placeholder="Phone"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            />
                                            <label htmlFor="phone">Phone</label>
                                        </div>
                                    </div>

                                    {userRole === 'employer' ? (
                                        <>
                                            <div className="col-12">
                                                <div className="form-floating">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="companyName"
                                                        placeholder="Company Name"
                                                        value={formData.companyName}
                                                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                                    />
                                                    <label htmlFor="companyName">Company Name</label>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="form-floating">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="position"
                                                        placeholder="Position"
                                                        value={formData.position}
                                                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                                                    />
                                                    <label htmlFor="position">Position in Company</label>
                                                </div>
                                            </div>
                                        </>
                                    ) : userRole === 'jobseeker' && (
                                        <>
                                            <div className="col-12">
                                                <div className="form-floating">
                                                    <textarea
                                                        className="form-control"
                                                        id="bio"
                                                        placeholder="Bio"
                                                        style={{height: '100px'}}
                                                        value={formData.bio}
                                                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                                    ></textarea>
                                                    <label htmlFor="bio">Bio</label>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="form-floating">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="location"
                                                        placeholder="Location"
                                                        value={formData.location}
                                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                                    />
                                                    <label htmlFor="location">Location</label>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="form-floating">
                                                    <textarea
                                                        className="form-control"
                                                        id="qualifications"
                                                        placeholder="Qualifications"
                                                        style={{height: '100px'}}
                                                        value={formData.qualifications}
                                                        onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                                                    ></textarea>
                                                    <label htmlFor="qualifications">Qualifications (Education, Certifications, etc.)</label>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="form-floating">
                                                    <textarea
                                                        className="form-control"
                                                        id="experience"
                                                        placeholder="Experience"
                                                        style={{height: '150px'}}
                                                        value={formData.experience}
                                                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                                                    ></textarea>
                                                    <label htmlFor="experience">Work Experience</label>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="form-floating">
                                                    <textarea
                                                        className="form-control"
                                                        id="coverLetter"
                                                        placeholder="Cover Letter"
                                                        style={{height: '200px'}}
                                                        value={formData.coverLetter}
                                                        onChange={(e) => setFormData({...formData, coverLetter: e.target.value})}
                                                    ></textarea>
                                                    <label htmlFor="coverLetter">Default Cover Letter</label>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <div className="form-floating">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="skills"
                                                        placeholder="Skills"
                                                        value={formData.skills}
                                                        onChange={(e) => setFormData({...formData, skills: e.target.value})}
                                                    />
                                                    <label htmlFor="skills">Skills (comma separated)</label>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <label className="form-label">CV/Resume</label>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    id="cv"
                                                    accept=".pdf,.doc,.docx"
                                                    onChange={(e) => handleFileUpload(e)}
                                                />
                                                {formData.cvUrl && (
                                                    <div className="mt-2">
                                                        <a href={formData.cvUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                                                            View Current CV
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    <div className="col-12">
                                        <hr className="my-4" />
                                        <h5 className="mb-3">Change Password</h5>
                                    </div>

                                    <div className="col-12">
                                        <div className="form-floating">
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="currentPassword"
                                                placeholder="Current Password"
                                                value={formData.currentPassword}
                                                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                                            />
                                            <label htmlFor="currentPassword">Current Password</label>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="newPassword"
                                                placeholder="New Password"
                                                value={formData.newPassword}
                                                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                            />
                                            <label htmlFor="newPassword">New Password</label>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="confirmPassword"
                                                placeholder="Confirm Password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                            />
                                            <label htmlFor="confirmPassword">Confirm Password</label>
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary w-100 py-3"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Updating...
                                                </>
                                            ) : 'Update Profile'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile; 