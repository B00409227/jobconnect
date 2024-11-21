import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

function JobListings() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [applying, setApplying] = useState(false);
    const { currentUser, userRole } = useAuth();
    const navigate = useNavigate();
    const [filterType, setFilterType] = useState('all');
    const [filterRemote, setFilterRemote] = useState(false);
    const [filterEducation, setFilterEducation] = useState('all');
    const [filterSalaryRange, setFilterSalaryRange] = useState({ min: '', max: '' });
    const [filterExperience, setFilterExperience] = useState('all');
    const [filterLocation, setFilterLocation] = useState('all');
    const [filterSkills, setFilterSkills] = useState('all');
    const [locations, setLocations] = useState([]);
    const [skills, setSkills] = useState([]);

    const jobCategories = [
        'Technology', 'Marketing', 'Sales', 'Design', 
        'Finance', 'Healthcare', 'Education', 'Other'
    ];

    const jobTypes = [
        'full-time', 'part-time', 'contract', 'internship', 'remote'
    ];

    const educationLevels = [
        'High School', 'Bachelor\'s Degree', 'Master\'s Degree', 
        'PhD', 'Other', 'Not Required'
    ];

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        // Extract unique locations and skills from jobs
        const uniqueLocations = [...new Set(jobs.map(job => job.location))].filter(Boolean);
        const uniqueSkills = [...new Set(jobs.flatMap(job => 
            job.skills?.split(',').map(skill => skill.trim()) || []
        ))].filter(Boolean);
        
        setLocations(uniqueLocations);
        setSkills(uniqueSkills);
    }, [jobs]);

    const fetchJobs = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'jobs'));
            const jobsData = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
            setJobs(jobsData);
        } catch (err) {
            setError('Error fetching jobs: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (job) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (userRole !== 'jobseeker') {
            alert('Only job seekers can apply for jobs');
            return;
        }

        setApplying(true);
        try {
            const application = {
                jobId: job.id,
                jobTitle: job.title,
                userId: currentUser.uid,
                employerId: job.ownerId,
                status: 'pending',
                appliedOn: new Date(),
                company: job.company,
                salary: job.salary
            };

            await addDoc(collection(db, 'applications'), application);
            alert('Application submitted successfully!');
        } catch (err) {
            console.error('Error applying for job:', err);
            alert('Failed to submit application: ' + err.message);
        } finally {
            setApplying(false);
        }
    };

    const handleDelete = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        
        try {
            await deleteDoc(doc(db, 'jobs', jobId));
            // Update the local state to remove the deleted job
            setJobs(jobs.filter(job => job.id !== jobId));
            alert('Job deleted successfully');
        } catch (err) {
            console.error("Error deleting job:", err);
            alert('Failed to delete job: ' + err.message);
        }
    };

    const filteredJobs = jobs.filter(job => {
        // Search across all fields
        const searchFields = [
            job.title,
            job.description,
            job.company,
            job.location,
            job.skills,
            job.category,
            job.type,
            job.experience,
            job.education,
            job.benefits
        ].map(field => field?.toLowerCase() || '');

        const searchTerms = searchTerm.toLowerCase().split(' ');
        const matchesSearch = searchTerms.every(term =>
            searchFields.some(field => field.includes(term))
        );

        // Apply all filters
        const matchesCategory = filterCategory === 'all' || job.category === filterCategory;
        const matchesType = filterType === 'all' || job.type === filterType;
        const matchesRemote = !filterRemote || job.remote === true;
        const matchesEducation = filterEducation === 'all' || 
            job.education?.toLowerCase() === filterEducation;

        // Salary range filter
        const matchesSalary = (
            (!filterSalaryRange.min || job.salary >= parseInt(filterSalaryRange.min)) &&
            (!filterSalaryRange.max || job.salary <= parseInt(filterSalaryRange.max))
        );

        return matchesSearch && matchesCategory && matchesType && 
               matchesRemote && matchesEducation && matchesSalary;
    });

    if (loading) return (
        <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    if (error) return (
        <div className="alert alert-danger m-4" role="alert">{error}</div>
    );

    return (
        <div className="container py-5">
            <div className="row mb-4">
                <div className="col-12">
                    <h1 className="display-4 mb-4">Find Your Dream Job</h1>
                    <div className="card bg-light">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-12">
                                    <input
                                        type="text"
                                        className="form-control form-control-lg"
                                        placeholder="Search jobs by title, company, skills, or location..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                    >
                                        <option value="all">All Categories</option>
                                        {jobCategories.map(category => (
                                            <option key={category} value={category.toLowerCase()}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                    >
                                        <option value="all">All Job Types</option>
                                        {jobTypes.map(type => (
                                            <option key={type} value={type}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={filterLocation}
                                        onChange={(e) => setFilterLocation(e.target.value)}
                                    >
                                        <option value="all">All Locations</option>
                                        {locations.map(location => (
                                            <option key={location} value={location}>
                                                {location}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={filterSkills}
                                        onChange={(e) => setFilterSkills(e.target.value)}
                                    >
                                        <option value="all">All Skills</option>
                                        {skills.map(skill => (
                                            <option key={skill} value={skill}>
                                                {skill}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={filterEducation}
                                        onChange={(e) => setFilterEducation(e.target.value)}
                                    >
                                        <option value="all">Any Education Level</option>
                                        {educationLevels.map(level => (
                                            <option key={level} value={level.toLowerCase()}>
                                                {level}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={filterExperience}
                                        onChange={(e) => setFilterExperience(e.target.value)}
                                    >
                                        <option value="all">Any Experience</option>
                                        <option value="entry">Entry Level</option>
                                        <option value="1-2">1-2 Years</option>
                                        <option value="3-5">3-5 Years</option>
                                        <option value="5+">5+ Years</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <div className="input-group">
                                        <span className="input-group-text">Salary Range</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Min"
                                            value={filterSalaryRange.min}
                                            onChange={(e) => setFilterSalaryRange(prev => ({
                                                ...prev,
                                                min: e.target.value
                                            }))}
                                        />
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Max"
                                            value={filterSalaryRange.max}
                                            onChange={(e) => setFilterSalaryRange(prev => ({
                                                ...prev,
                                                max: e.target.value
                                            }))}
                                        />
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="d-flex gap-2 flex-wrap">
                                        <button 
                                            className={`btn ${filterRemote ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setFilterRemote(!filterRemote)}
                                        >
                                            🏠 Remote Work
                                        </button>
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => {
                                                setFilterCategory('all');
                                                setFilterType('all');
                                                setFilterEducation('all');
                                                setFilterExperience('all');
                                                setFilterLocation('all');
                                                setFilterSkills('all');
                                                setFilterSalaryRange({ min: '', max: '' });
                                                setFilterRemote(false);
                                                setSearchTerm('');
                                            }}
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {filteredJobs.map(job => (
                    <div key={job.id} className="col-md-6 col-lg-4">
                        <div className="card h-100 shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title">{job.title}</h5>
                                <h6 className="card-subtitle mb-2 text-muted">{job.company}</h6>
                                
                                <p className="card-text text-truncate mb-3">
                                    {job.description}
                                </p>
                                
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <span className="text-success fw-bold">
                                        ${job.salary.toLocaleString()}
                                    </span>
                                    <span className="badge bg-primary">
                                        {job.type}
                                    </span>
                                </div>

                                <div className="text-muted small mb-3">
                                    <i className="far fa-calendar-alt me-1"></i>
                                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                                </div>
                            </div>
                            
                            <div className="card-footer bg-white border-top-0">
                                {userRole === 'jobseeker' && currentUser && (
                                    <button 
                                        className="btn btn-primary w-100"
                                        onClick={() => navigate(`/job/${job.id}`)}
                                        disabled={applying}
                                    >
                                        {applying ? 'Applying...' : 'Apply Now'}
                                    </button>
                                )}
                                {userRole === 'employer' && currentUser?.uid === job.ownerId && (
                                    <div className="d-flex gap-2">
                                        <button 
                                            className="btn btn-outline-primary flex-grow-1"
                                            onClick={() => {
                                                navigate('/employer-dashboard');
                                                localStorage.setItem('editingJobId', job.id);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="btn btn-outline-danger flex-grow-1"
                                            onClick={() => handleDelete(job.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                                {!currentUser && (
                                    <button 
                                        className="btn btn-secondary w-100"
                                        onClick={() => navigate('/login')}
                                    >
                                        Login to Apply
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default JobListings;
