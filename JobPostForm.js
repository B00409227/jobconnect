import React, { useState } from 'react';
import { db } from './firebase-config';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import './styles.css';

function JobPostForm() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        salary: '',
        category: '',
        company: '',
        location: '',
        type: 'full-time',
        experience: '',
        skills: '',
        benefits: '',
        deadline: '',
        remote: false,
        education: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { currentUser } = useAuth();
    const navigate = useNavigate();

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = [
            'title',
            'description',
            'category',
            'salary',
            'deadline',
            'type',
            'company',
            'location'
        ];
        
        requiredFields.forEach(field => {
            if (!formData[field]?.trim()) {
                newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
            }
        });

        if (formData.salary && !/^\d+$/.test(formData.salary)) {
            newErrors.salary = 'Salary must be a valid number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setLoading(true);
        try {
            await addDoc(collection(db, 'jobs'), {
                ...formData,
                salary: parseInt(formData.salary),
                createdAt: new Date(),
                updatedAt: new Date(),
                ownerId: currentUser.uid,
                status: 'active'
            });
            alert('Job posted successfully!');
            navigate('/employer-dashboard');
        } catch (error) {
            console.error("Error adding document: ", error);
            alert('Failed to post job: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h3 className="mb-0">Post a New Job</h3>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="text"
                                                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                                id="title"
                                                name="title"
                                                placeholder="Job Title"
                                                value={formData.title}
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="title">Job Title</label>
                                            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="text"
                                                className={`form-control ${errors.company ? 'is-invalid' : ''}`}
                                                id="company"
                                                name="company"
                                                placeholder="Company Name"
                                                value={formData.company}
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="company">Company Name</label>
                                            {errors.company && <div className="invalid-feedback">{errors.company}</div>}
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div className="form-floating">
                                            <textarea
                                                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                                id="description"
                                                name="description"
                                                placeholder="Job Description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                style={{ height: '150px' }}
                                            ></textarea>
                                            <label htmlFor="description">Job Description</label>
                                            {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <select
                                                className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                                                id="category"
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select a category</option>
                                                {jobCategories.map(category => (
                                                    <option key={category} value={category.toLowerCase()}>
                                                        {category}
                                                    </option>
                                                ))}
                                            </select>
                                            <label htmlFor="category">Job Category</label>
                                            {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <select
                                                className="form-select"
                                                id="type"
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                            >
                                                {jobTypes.map(type => (
                                                    <option key={type} value={type}>
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                            <label htmlFor="type">Job Type</label>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="text"
                                                className={`form-control ${errors.salary ? 'is-invalid' : ''}`}
                                                id="salary"
                                                name="salary"
                                                placeholder="Salary"
                                                value={formData.salary}
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="salary">Salary (USD)</label>
                                            {errors.salary && <div className="invalid-feedback">{errors.salary}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="text"
                                                className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                                                id="location"
                                                name="location"
                                                placeholder="Location"
                                                value={formData.location}
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="location">Location</label>
                                            {errors.location && <div className="invalid-feedback">{errors.location}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="text"
                                                className={`form-control ${errors.skills ? 'is-invalid' : ''}`}
                                                id="skills"
                                                name="skills"
                                                placeholder="Required Skills"
                                                value={formData.skills}
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="skills">Required Skills (comma separated)</label>
                                            {errors.skills && <div className="invalid-feedback">{errors.skills}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <select
                                                className={`form-select ${errors.education ? 'is-invalid' : ''}`}
                                                id="education"
                                                name="education"
                                                value={formData.education}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select education level</option>
                                                {educationLevels.map(level => (
                                                    <option key={level} value={level.toLowerCase()}>
                                                        {level}
                                                    </option>
                                                ))}
                                            </select>
                                            <label htmlFor="education">Required Education</label>
                                            {errors.education && <div className="invalid-feedback">{errors.education}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="text"
                                                className={`form-control ${errors.experience ? 'is-invalid' : ''}`}
                                                id="experience"
                                                name="experience"
                                                placeholder="Required Experience"
                                                value={formData.experience}
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="experience">Required Experience (e.g., '2 years')</label>
                                            {errors.experience && <div className="invalid-feedback">{errors.experience}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <textarea
                                                className={`form-control ${errors.benefits ? 'is-invalid' : ''}`}
                                                id="benefits"
                                                name="benefits"
                                                placeholder="Benefits"
                                                value={formData.benefits}
                                                onChange={handleChange}
                                                style={{ height: '100px' }}
                                            ></textarea>
                                            <label htmlFor="benefits">Benefits</label>
                                            {errors.benefits && <div className="invalid-feedback">{errors.benefits}</div>}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-floating">
                                            <input
                                                type="date"
                                                className={`form-control ${errors.deadline ? 'is-invalid' : ''}`}
                                                id="deadline"
                                                name="deadline"
                                                value={formData.deadline}
                                                onChange={handleChange}
                                            />
                                            <label htmlFor="deadline">Application Deadline</label>
                                            {errors.deadline && <div className="invalid-feedback">{errors.deadline}</div>}
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="remote"
                                                name="remote"
                                                checked={formData.remote}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    remote: e.target.checked
                                                }))}
                                            />
                                            <label className="form-check-label" htmlFor="remote">
                                                Remote Work Available
                                            </label>
                                        </div>
                                    </div>

                                    <div className="col-12 d-flex gap-2 justify-content-end">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => navigate('/employer-dashboard')}
                                            disabled={loading}
                                        >
                                            <FaTimes className="me-2" />Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            <FaSave className="me-2" />
                                            {loading ? 'Posting...' : 'Post Job'}
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

export default JobPostForm;
