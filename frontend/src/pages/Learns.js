//frontend/src/pages/Learns.js - Course-Based Learning Platform with Real Data

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, BookMarked, ExternalLink, Clock, TrendingUp, 
  PlayCircle, CheckCircle, Lock, Award, Code, Globe, 
  BookOpen, Laptop, Users, Star, ChevronRight
} from 'lucide-react';
import PersonalLearnings from '../pages/PersonalLearnings';
import { useAuth } from '../contexts/AuthContext';

const Learns = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Course data
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  
  // External resources
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const categories = [
    { id: 'all', name: 'All Courses', icon: Globe },
    { id: 'javascript', name: 'JavaScript', icon: Code },
    { id: 'react', name: 'React', icon: Laptop },
    { id: 'python', name: 'Python', icon: BookOpen },
    { id: 'fullstack', name: 'Full Stack', icon: Users },
    { id: 'nodejs', name: 'Node.js', icon: Code },
    { id: 'tools', name: 'Tools', icon: Award }
  ];

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (searchTerm) params.append('search', searchTerm);

        const response = await fetch(`${API_URL}/courses?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setCourses(data.courses || []);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    if (activeTab === 'courses') {
      fetchCourses();
    }
  }, [activeTab, selectedCategory, searchTerm, API_URL]);

  // Fetch user's enrolled courses
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        const response = await fetch(`${API_URL}/courses/my-courses`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setEnrolledCourses(data.enrollments || []);
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
      }
    };

    if (isAuthenticated) {
      fetchEnrolledCourses();
    }
  }, [isAuthenticated, user, API_URL]);

  // Fetch Dev.to articles for external resources
  useEffect(() => {
    const fetchArticles = async () => {
      if (activeTab === 'resources') {
        setLoadingArticles(true);
        try {
          const response = await fetch('https://dev.to/api/articles?per_page=12&top=7');
          const data = await response.json();
          setArticles(data);
        } catch (error) {
          console.error('Error fetching articles:', error);
        } finally {
          setLoadingArticles(false);
        }
      }
    };
    fetchArticles();
  }, [activeTab]);

  const handleEnrollCourse = async (courseId) => {
    if (!isAuthenticated) {
      alert('Please log in to enroll in courses');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Successfully enrolled in course!');
        // Refresh enrolled courses
        const enrolledResponse = await fetch(`${API_URL}/courses/my-courses`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const enrolledData = await enrolledResponse.json();
        if (enrolledData.success) {
          setEnrolledCourses(enrolledData.enrollments || []);
        }
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course');
    }
  };

  const toggleBookmark = (article) => {
    const isBookmarked = bookmarkedArticles.some(b => b.id === article.id);
    setBookmarkedArticles(isBookmarked 
      ? bookmarkedArticles.filter(b => b.id !== article.id)
      : [...bookmarkedArticles, article]
    );
  };

  const getLevelColor = (level) => {
    switch(level) {
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(e => e.course_id === courseId);
  };

  const getEnrollmentProgress = (courseId) => {
    const enrollment = enrolledCourses.find(e => e.course_id === courseId);
    return enrollment ? enrollment.progress_percentage : 0;
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F1116',
      color: '#fff',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Learning Hub
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>
            Master new skills with interactive courses and curated resources
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #2d3748'
        }}>
          {[
            { id: 'courses', label: 'Interactive Courses', icon: PlayCircle },
            { id: 'resources', label: 'External Resources', icon: ExternalLink },
            { id: 'my-learnings', label: 'My Learnings', icon: BookMarked }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: activeTab === tab.id ? '#60a5fa' : '#9ca3af',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #60a5fa' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                  marginBottom: '-2px'
                }}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Interactive Courses Tab */}
        {activeTab === 'courses' && (
          <>
            {/* Search and Filter */}
            <div style={{
              backgroundColor: '#1a1d24',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              border: '1px solid #2d3748'
            }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  pointerEvents: 'none'
                }} size={20} />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 3rem',
                    backgroundColor: '#0F1116',
                    border: '1px solid #2d3748',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Category Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {categories.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        padding: '0.625rem 1rem',
                        backgroundColor: isSelected ? '#60a5fa' : '#2d3748',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Icon size={16} />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loading State */}
            {loadingCourses ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                  display: 'inline-block',
                  width: '50px',
                  height: '50px',
                  border: '4px solid #2d3748',
                  borderTop: '4px solid #60a5fa',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            ) : courses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: '#1a1d24',
                borderRadius: '12px',
                border: '1px solid #2d3748'
              }}>
                <BookOpen size={48} color="#6b7280" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#9ca3af', fontSize: '1rem' }}>
                  No courses found. Try adjusting your filters.
                </p>
              </div>
            ) : (
              /* Courses Grid */
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: '1.5rem'
              }}>
                {courses.map(course => {
                  const enrolled = isEnrolled(course.id);
                  const progress = getEnrollmentProgress(course.id);
                  
                  return (
                    <div
                      key={course.id}
                      style={{
                        backgroundColor: '#1a1d24',
                        borderRadius: '12px',
                        border: '1px solid #2d3748',
                        overflow: 'hidden',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#60a5fa';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#2d3748';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Course Header */}
                      <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                          {course.icon_emoji || '📚'}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: getLevelColor(course.level) + '20',
                          color: getLevelColor(course.level),
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          marginBottom: '0.5rem'
                        }}>
                          {course.level}
                        </div>
                      </div>

                      {/* Course Content */}
                      <div style={{ padding: '1.5rem' }}>
                        <h3 style={{
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          marginBottom: '0.5rem',
                          color: '#fff'
                        }}>
                          {course.title}
                        </h3>
                        
                        <p style={{
                          color: '#9ca3af',
                          fontSize: '0.875rem',
                          marginBottom: '1rem',
                          lineHeight: '1.5'
                        }}>
                          {course.short_description || course.description}
                        </p>

                        {/* Course Stats */}
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '1rem',
                          marginBottom: '1rem',
                          paddingBottom: '1rem',
                          borderBottom: '1px solid #2d3748'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            <Clock size={14} />
                            {course.estimated_duration_hours}h
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            <BookOpen size={14} />
                            {course.total_modules} modules
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                            <Users size={14} />
                            {course.enrollment_count?.toLocaleString() || 0}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#f59e0b' }}>
                            <Star size={14} fill="#f59e0b" />
                            {course.average_rating || 0}
                          </div>
                        </div>

                        {/* Progress Bar (if enrolled) */}
                        {enrolled && (
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '0.5rem',
                              fontSize: '0.75rem',
                              color: '#9ca3af'
                            }}>
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '6px',
                              backgroundColor: '#2d3748',
                              borderRadius: '3px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                backgroundColor: '#10b981',
                                transition: 'width 0.3s'
                              }} />
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <button
                          onClick={() => enrolled ? null : handleEnrollCourse(course.id)}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: enrolled ? '#10b981' : '#60a5fa',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          {enrolled ? (
                            <>
                              <PlayCircle size={16} />
                              Continue Learning
                            </>
                          ) : (
                            <>
                              <PlayCircle size={16} />
                              Start Course
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* External Resources Tab */}
        {activeTab === 'resources' && (
          <>
            <div style={{
              backgroundColor: '#1a1d24',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #2d3748',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                📚 Curated External Resources
              </h3>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                Explore articles, tutorials, and courses from top learning platforms like Dev.to, Udemy, and more
              </p>
            </div>

            {loadingArticles ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{
                  display: 'inline-block',
                  width: '50px',
                  height: '50px',
                  border: '4px solid #2d3748',
                  borderTop: '4px solid #60a5fa',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem'
              }}>
                {articles.map(article => {
                  const isBookmarked = bookmarkedArticles.some(b => b.id === article.id);
                  return (
                    <div
                      key={article.id}
                      style={{
                        backgroundColor: '#1a1d24',
                        borderRadius: '12px',
                        border: '1px solid #2d3748',
                        overflow: 'hidden',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#60a5fa';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#2d3748';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {article.cover_image && (
                        <img
                          src={article.cover_image}
                          alt={article.title}
                          style={{
                            width: '100%',
                            height: '180px',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      
                      <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                          {article.tag_list?.slice(0, 2).map((tag, idx) => (
                            <span key={idx} style={{
                              padding: '0.25rem 0.625rem',
                              backgroundColor: '#2d3748',
                              color: '#60a5fa',
                              borderRadius: '4px',
                              fontSize: '0.75rem'
                            }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                        
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          marginBottom: '0.5rem',
                          color: '#fff',
                          lineHeight: '1.4'
                        }}>
                          {article.title}
                        </h3>
                        
                        {article.description && (
                          <p style={{
                            color: '#9ca3af',
                            fontSize: '0.875rem',
                            marginBottom: '1rem',
                            lineHeight: '1.5'
                          }}>
                            {article.description.substring(0, 100)}...
                          </p>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                            <span>⏱️ {article.reading_time_minutes} min</span>
                            <span>❤️ {article.positive_reactions_count}</span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => toggleBookmark(article)}
                              style={{
                                padding: '0.5rem',
                                backgroundColor: isBookmarked ? '#8b5cf6' : '#2d3748',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#fff'
                              }}
                            >
                              <BookMarked size={16} fill={isBookmarked ? '#fff' : 'none'} />
                            </button>
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '0.5rem',
                                backgroundColor: '#60a5fa',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: '#fff',
                                display: 'flex',
                                textDecoration: 'none'
                              }}
                            >
                              <ExternalLink size={16} />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* My Learnings Tab */}
        {activeTab === 'my-learnings' && (
          <>
            {isAuthenticated && user && user.id ? (
              <PersonalLearnings userId={user.id} />
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: '#1a1d24',
                borderRadius: '12px',
                border: '1px solid #2d3748'
              }}>
                <p style={{ color: '#9ca3af', fontSize: '1rem' }}>
                  Please log in to view your personal learnings.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Learns;