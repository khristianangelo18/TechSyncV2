// frontend/src/pages/CourseLearn.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, PlayCircle, CheckCircle, Lock, BookOpen, 
  Clock, ChevronRight, ChevronDown 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CourseLearn = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setCourse(data.course);
        
        // Expand first module and select first lesson by default
        if (data.course.course_modules && data.course.course_modules.length > 0) {
          const firstModule = data.course.course_modules[0];
          setExpandedModules({ [firstModule.id]: true });
          
          if (firstModule.course_lessons && firstModule.course_lessons.length > 0) {
            setSelectedLesson(firstModule.course_lessons[0]);
          }
        }
      }

      // Fetch enrollment/progress
      const progressResponse = await fetch(`${API_URL}/courses/${courseId}/progress`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const progressData = await progressResponse.json();
      
      if (progressData.success) {
        setEnrollment(progressData.enrollment);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const getLessonIcon = (lesson) => {
    // You can check lesson progress here later
    return <PlayCircle size={16} />;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F1116',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #2d3748',
          borderTop: '4px solid #60a5fa',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
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
  }

  if (!course) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F1116',
        color: '#fff',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <p style={{ fontSize: '1.25rem' }}>Course not found</p>
        <button
          onClick={() => navigate('/learns')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#60a5fa',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F1116',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 2rem',
        backgroundColor: '#1a1d24',
        borderBottom: '1px solid #2d3748',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/learns')}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              color: '#60a5fa',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
              {course.title}
            </h1>
            {enrollment && (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                Progress: {enrollment.progress_percentage}%
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar - Course Modules */}
        <div style={{
          width: '350px',
          backgroundColor: '#1a1d24',
          borderRight: '1px solid #2d3748',
          overflow: 'auto'
        }}>
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              color: '#fff'
            }}>
              Course Content
            </h3>

            {course.course_modules?.map((module, moduleIndex) => (
              <div key={module.id} style={{ marginBottom: '0.5rem' }}>
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(module.id)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2d3748',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    marginBottom: '0.5rem'
                  }}
                >
                  <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                    {moduleIndex + 1}. {module.title}
                  </span>
                  {expandedModules[module.id] ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>

                {/* Lessons List */}
                {expandedModules[module.id] && (
                  <div style={{ paddingLeft: '1rem' }}>
                    {module.course_lessons?.map((lesson, lessonIndex) => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          backgroundColor: selectedLesson?.id === lesson.id ? '#60a5fa15' : 'transparent',
                          color: selectedLesson?.id === lesson.id ? '#60a5fa' : '#9ca3af',
                          border: selectedLesson?.id === lesson.id ? '1px solid #60a5fa' : '1px solid transparent',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          textAlign: 'left',
                          marginBottom: '0.25rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedLesson?.id !== lesson.id) {
                            e.currentTarget.style.backgroundColor = '#2d3748';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedLesson?.id !== lesson.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {getLessonIcon(lesson)}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {lessonIndex + 1}. {lesson.title}
                          </div>
                          {lesson.estimated_duration_minutes && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              marginTop: '0.25rem'
                            }}>
                              {lesson.estimated_duration_minutes} min
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Lesson Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '2rem',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {selectedLesson ? (
            <>
              <div style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                backgroundColor: '#60a5fa15',
                color: '#60a5fa',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginBottom: '1rem',
                textTransform: 'capitalize'
              }}>
                {selectedLesson.lesson_type}
              </div>

              <h2 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                {selectedLesson.title}
              </h2>

              {selectedLesson.description && (
                <p style={{
                  color: '#9ca3af',
                  fontSize: '1rem',
                  marginBottom: '2rem',
                  lineHeight: '1.6'
                }}>
                  {selectedLesson.description}
                </p>
              )}

              <div style={{
                backgroundColor: '#1a1d24',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #2d3748'
              }}>
                {selectedLesson.lesson_type === 'video' && selectedLesson.video_url ? (
                  <div style={{
                    width: '100%',
                    paddingTop: '56.25%',
                    position: 'relative',
                    backgroundColor: '#000',
                    borderRadius: '8px'
                  }}>
                    <p style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#6b7280'
                    }}>
                      Video Player (Coming Soon)
                    </p>
                  </div>
                ) : selectedLesson.lesson_type === 'coding' ? (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                      Coding Exercise
                    </h3>
                    <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
                      Practice what you've learned with hands-on coding.
                    </p>
                    <div style={{
                      backgroundColor: '#0F1116',
                      padding: '1rem',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}>
                      {selectedLesson.code_template || '// Your code here...'}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    color: '#e2e8f0',
                    lineHeight: '1.8',
                    fontSize: '1rem'
                  }}>
                    <p style={{ marginBottom: '1rem' }}>
                      {selectedLesson.content || 'Lesson content will be available here. Stay tuned!'}
                    </p>
                    <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                      Full lesson content coming soon. This is a placeholder to demonstrate the course structure.
                    </p>
                  </div>
                )}
              </div>

              {/* Lesson Navigation */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '2rem',
                paddingTop: '2rem',
                borderTop: '1px solid #2d3748'
              }}>
                <button
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#2d3748',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  ← Previous Lesson
                </button>
                <button
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#60a5fa',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Mark as Complete & Next →
                </button>
              </div>
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              color: '#6b7280'
            }}>
              <BookOpen size={64} style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '1.125rem' }}>
                Select a lesson from the sidebar to begin learning
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseLearn;