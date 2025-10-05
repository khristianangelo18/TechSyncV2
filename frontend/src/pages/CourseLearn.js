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
  const [lessonProgress, setLessonProgress] = useState({});
  const [allLessons, setAllLessons] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  useEffect(() => {
    if (selectedLesson && enrollment) {
      markLessonAsStarted(selectedLesson.id);
    }
  }, [selectedLesson]);

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
        
        // Create flat array of all lessons for navigation
        const lessons = [];
        data.course.course_modules?.forEach(module => {
          module.course_lessons?.forEach(lesson => {
            lessons.push({ ...lesson, moduleId: module.id });
          });
        });
        setAllLessons(lessons);
        
        // Expand first module and select first lesson by default
        if (data.course.course_modules && data.course.course_modules.length > 0) {
          const firstModule = data.course.course_modules[0];
          setExpandedModules({ [firstModule.id]: true });
          
          if (firstModule.course_lessons && firstModule.course_lessons.length > 0) {
            setSelectedLesson({ ...firstModule.course_lessons[0], moduleId: firstModule.id });
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
        
        // Build lesson progress map
        const progressMap = {};
        progressData.lessons?.forEach(lesson => {
          if (lesson.user_lesson_progress && lesson.user_lesson_progress.length > 0) {
            progressMap[lesson.id] = lesson.user_lesson_progress[0];
          }
        });
        setLessonProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (!allLessons.length) return 0;
    const completedCount = allLessons.filter(lesson => 
      lessonProgress[lesson.id]?.status === 'completed'
    ).length;
    return Math.round((completedCount / allLessons.length) * 100);
  };

  const markLessonAsStarted = async (lessonId) => {
    if (lessonProgress[lessonId]?.status === 'completed') return;
    if (lessonProgress[lessonId]?.status === 'in_progress') return;

    try {
      await fetch(`${API_URL}/courses/lessons/${lessonId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'in_progress',
          enrollmentId: enrollment.id
        })
      });

      setLessonProgress(prev => ({
        ...prev,
        [lessonId]: { status: 'in_progress' }
      }));
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  const updateEnrollmentProgress = async (updatedProgress) => {
    // Calculate progress percentage based on updated lesson progress
    const completedCount = Object.values(updatedProgress).filter(
      p => p?.status === 'completed'
    ).length;
    const progressPercentage = Math.round((completedCount / allLessons.length) * 100);

    try {
      const response = await fetch(`${API_URL}/courses/${courseId}/enrollment/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          progress_percentage: progressPercentage
        })
      });

      const data = await response.json();
      if (data.success && data.enrollment) {
        setEnrollment(data.enrollment);
      }
    } catch (error) {
      console.error('Error updating enrollment progress:', error);
    }
  };

  const markLessonAsCompleted = async () => {
    if (!selectedLesson) return;

    try {
      const response = await fetch(`${API_URL}/courses/lessons/${selectedLesson.id}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'completed',
          enrollmentId: enrollment.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedProgress = {
          ...lessonProgress,
          [selectedLesson.id]: { status: 'completed', completed_at: new Date().toISOString() }
        };
        
        setLessonProgress(updatedProgress);

        // Update overall enrollment progress
        await updateEnrollmentProgress(updatedProgress);

        // Move to next lesson
        navigateToNextLesson();
      }
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
    }
  };

  const navigateToNextLesson = () => {
    const currentIndex = allLessons.findIndex(l => l.id === selectedLesson?.id);
    if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      setSelectedLesson(nextLesson);
      
      // Expand the module containing the next lesson
      setExpandedModules(prev => ({
        ...prev,
        [nextLesson.moduleId]: true
      }));
    }
  };

  const navigateToPreviousLesson = () => {
    const currentIndex = allLessons.findIndex(l => l.id === selectedLesson?.id);
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1];
      setSelectedLesson(prevLesson);
      
      // Expand the module containing the previous lesson
      setExpandedModules(prev => ({
        ...prev,
        [prevLesson.moduleId]: true
      }));
    }
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const getLessonIcon = (lesson) => {
    const progress = lessonProgress[lesson.id];
    
    if (progress?.status === 'completed') {
      return <CheckCircle size={16} style={{ color: '#10b981' }} />;
    } else if (progress?.status === 'in_progress') {
      return <PlayCircle size={16} style={{ color: '#60a5fa' }} />;
    } else {
      return <PlayCircle size={16} style={{ color: '#6b7280' }} />;
    }
  };

  const isFirstLesson = () => {
    return allLessons.findIndex(l => l.id === selectedLesson?.id) === 0;
  };

  const isLastLesson = () => {
    return allLessons.findIndex(l => l.id === selectedLesson?.id) === allLessons.length - 1;
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
        flexDirection: 'column'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Course not found</h2>
        <button
          onClick={() => navigate('/learns')}
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
          Back to Courses
        </button>
      </div>
    );
  }

  const currentProgress = calculateProgress();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F1116',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1a1d24',
        borderBottom: '1px solid #2d3748',
        padding: '1rem 2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => navigate('/learns')}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                color: '#9ca3af',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <ArrowLeft size={20} style={{ marginRight: '0.5rem' }} />
              Back to Courses
            </button>
            <div style={{ height: '24px', width: '1px', backgroundColor: '#2d3748' }} />
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#fff',
              margin: 0
            }}>
              {course.title}
            </h1>
          </div>
          <div>
            {enrollment && (
              <p style={{
                color: '#9ca3af',
                fontSize: '0.875rem',
                margin: '0.25rem 0 0 0'
              }}>
                Progress: {currentProgress}%
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
                    {module.course_lessons?.map((lesson, lessonIndex) => {
                      const isSelected = selectedLesson?.id === lesson.id;
                      const progress = lessonProgress[lesson.id];
                      
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLesson({ ...lesson, moduleId: module.id })}
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: isSelected ? '#60a5fa15' : 'transparent',
                            color: isSelected ? '#60a5fa' : '#9ca3af',
                            border: isSelected ? '1px solid #60a5fa' : '1px solid transparent',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            textAlign: 'left',
                            marginBottom: '0.25rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          {getLessonIcon(lesson)}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                              {lessonIndex + 1}. {lesson.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                              {lesson.duration_minutes} min
                            </div>
                          </div>
                          {progress?.status === 'completed' && (
                            <CheckCircle size={14} style={{ color: '#10b981' }} />
                          )}
                        </button>
                      );
                    })}
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
          color: '#fff'
        }}>
          {selectedLesson ? (
            <>
              {/* Lesson Header */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#60a5fa20',
                  color: '#60a5fa',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  marginBottom: '1rem'
                }}>
                  {selectedLesson.lesson_type || 'Text'}
                </div>
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem'
                }}>
                  {selectedLesson.title}
                </h2>
                <p style={{
                  color: '#9ca3af',
                  fontSize: '1rem',
                  marginBottom: '1rem'
                }}>
                  {selectedLesson.description || 'Understanding JavaScript and its role in web development'}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} />
                    {selectedLesson.duration_minutes} minutes
                  </div>
                  {lessonProgress[selectedLesson.id]?.status === 'completed' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      color: '#10b981'
                    }}>
                      <CheckCircle size={14} />
                      Completed
                    </div>
                  )}
                </div>
              </div>

              {/* Lesson Content */}
              <div style={{
                backgroundColor: '#1a1d24',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                {selectedLesson.content ? (
                  <div style={{ lineHeight: '1.8', color: '#e5e7eb' }}>
                    {selectedLesson.content}
                  </div>
                ) : (
                  <div>
                    <p style={{ marginBottom: '1rem' }}>
                      Lesson content will be available here. Stay tuned!
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
                  onClick={navigateToPreviousLesson}
                  disabled={isFirstLesson()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isFirstLesson() ? '#1a1d24' : '#2d3748',
                    color: isFirstLesson() ? '#6b7280' : '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isFirstLesson() ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    opacity: isFirstLesson() ? 0.5 : 1
                  }}
                >
                  ← Previous Lesson
                </button>
                <button
                  onClick={markLessonAsCompleted}
                  disabled={isLastLesson() && lessonProgress[selectedLesson.id]?.status === 'completed'}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#60a5fa',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    opacity: (isLastLesson() && lessonProgress[selectedLesson.id]?.status === 'completed') ? 0.5 : 1
                  }}
                >
                  {isLastLesson() ? 'Complete Course' : 'Mark as Complete & Next →'}
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