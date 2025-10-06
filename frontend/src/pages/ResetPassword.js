// Save as: frontend/src/pages/ResetPassword.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link');
        }
    }, [token]);

    const validatePassword = (password) => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters';
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return 'Password must contain uppercase, lowercase, and number';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const passwordError = validatePassword(formData.newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    newPassword: formData.newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.message || 'Failed to reset password');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.successIcon}>
                        <CheckCircle size={64} color="#10b981" />
                    </div>
                    <h1 style={styles.title}>Password Reset Successful!</h1>
                    <p style={styles.text}>
                        Your password has been successfully reset.
                    </p>
                    <p style={styles.textSmall}>
                        Redirecting to login page...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.iconContainer}>
                    <Lock size={48} color="#667eea" />
                </div>
                
                <h1 style={styles.title}>Reset Password</h1>
                <p style={styles.subtitle}>
                    Enter your new password below
                </p>

                {error && (
                    <div style={styles.errorAlert}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>New Password</label>
                        <div style={styles.passwordContainer}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.newPassword}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    newPassword: e.target.value
                                })}
                                placeholder="Enter new password"
                                required
                                style={styles.input}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Confirm Password</label>
                        <div style={styles.passwordContainer}>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    confirmPassword: e.target.value
                                })}
                                placeholder="Confirm new password"
                                required
                                style={styles.input}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.eyeButton}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div style={styles.requirements}>
                        <p style={styles.requirementsTitle}>Password must contain:</p>
                        <ul style={styles.requirementsList}>
                            <li style={{
                                color: formData.newPassword.length >= 8 ? '#10b981' : '#999',
                                fontSize: '14px',
                                marginBottom: '4px'
                            }}>
                                ✓ At least 8 characters
                            </li>
                            <li style={{
                                color: /[A-Z]/.test(formData.newPassword) ? '#10b981' : '#999',
                                fontSize: '14px',
                                marginBottom: '4px'
                            }}>
                                ✓ One uppercase letter
                            </li>
                            <li style={{
                                color: /[a-z]/.test(formData.newPassword) ? '#10b981' : '#999',
                                fontSize: '14px',
                                marginBottom: '4px'
                            }}>
                                ✓ One lowercase letter
                            </li>
                            <li style={{
                                color: /\d/.test(formData.newPassword) ? '#10b981' : '#999',
                                fontSize: '14px'
                            }}>
                                ✓ One number
                            </li>
                        </ul>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || !token}
                        style={{
                            ...styles.button,
                            opacity: (loading || !token) ? 0.7 : 1,
                            cursor: (loading || !token) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
    },
    card: {
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
    },
    iconContainer: {
        marginBottom: '20px'
    },
    successIcon: {
        marginBottom: '20px'
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: '12px'
    },
    subtitle: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '30px'
    },
    text: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '16px',
        lineHeight: '1.6'
    },
    textSmall: {
        fontSize: '14px',
        color: '#999',
        marginBottom: '24px'
    },
    errorAlert: {
        background: '#fee2e2',
        color: '#dc2626',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px'
    },
    form: {
        marginBottom: '24px'
    },
    inputGroup: {
        marginBottom: '20px',
        textAlign: 'left'
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '8px'
    },
    passwordContainer: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    input: {
        width: '100%',
        padding: '12px 48px 12px 16px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '16px',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box'
    },
    eyeButton: {
        position: 'absolute',
        right: '12px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#999',
        padding: '4px',
        display: 'flex',
        alignItems: 'center'
    },
    requirements: {
        background: '#f9fafb',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'left'
    },
    requirementsTitle: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#666',
        marginBottom: '8px'
    },
    requirementsList: {
        listStyle: 'none',
        padding: 0,
        margin: 0
    },
    button: {
        width: '100%',
        padding: '14px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'transform 0.2s'
    }
};

export default ResetPassword;