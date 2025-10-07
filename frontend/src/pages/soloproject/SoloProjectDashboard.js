// frontend/src/pages/soloproject/SoloProjectDashboard.js - CORRECTED WITH AWARDS
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SoloProjectService from '../../services/soloProjectService';
import { taskService } from '../../services/taskService';
import { BarChart3, Target, Clock, TrendingUp, Plus, StickyNote, FileText, Award, Trophy } from 'lucide-react';
import AwardsDisplay from '../../components/AwardsDisplay';

// Background symbols component - ALIGNED WITH OTHER DASHBOARDS
const BackgroundSymbols = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 1,
    pointerEvents: 'none'
  }}>
    {[
      { left: '52.81%', top: '48.12%', color: '#2E3344', rotate: '-10.79deg' },
      { left: '28.19%', top: '71.22%', color: '#292A2E', rotate: '-37.99deg' },
      { left: '95.09%', top: '48.12%', color: '#ABB5CE', rotate: '34.77deg' },
      { left: '86.46%', top: '15.33%', color: '#2E3344', rotate: '28.16deg' },
      { left: '7.11%', top: '80.91%', color: '#ABB5CE', rotate: '24.5deg' },
      { left: '48.06%', top: '8.5%', color: '#ABB5CE', rotate: '25.29deg' },
      { left: '72.84%', top: '4.42%', color: '#2E3344', rotate: '-19.68deg' },
      { left: '9.6%', top: '0%', color: '#1F232E', rotate: '-6.83deg' },
      { left: '31.54%', top: '54.31%', color: '#6C758E', rotate: '25.29deg' },
      { left: '25.28%', top: '15.89%', color: '#1F232E', rotate: '-6.83deg' },
      { left: '48.55%', top: '82.45%', color: '#292A2E', rotate: '-10.79deg' },
      { left: '24.41%', top: '92.02%', color: '#2E3344', rotate: '18.2deg' },
      { left: '0%', top: '12.8%', color: '#ABB5CE', rotate: '37.85deg' },
      { left: '81.02%', top: '94.27%', color: '#6C758E', rotate: '-37.99deg' },
      { left: '96.02%', top: '0%', color: '#2E3344', rotate: '-37.99deg' },
      { left: '0.07%', top: '41.2%', color: '#6C758E', rotate: '-10.79deg' }
    ].map((pos, i) => (
      <div key={i} style={{
        position: 'absolute',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontStyle: 'normal',
        fontWeight: 900,
        fontSize: '24px',
        lineHeight: '29px',
        userSelect: 'none',
        pointerEvents: 'none',
        left: pos.left,
        top: pos.top,
        color: pos.color,
        transform: `rotate(${pos.rotate})`
      }}>&#60;/&#62;</div>
    ))}
  </div>
);

function SoloProjectDashboard() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management
  const [project, setProject] = useState(null);
  const [projectStats, setProjectStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    completionRate: 0,
    totalGoals: 0,
    completedGoals: 0,
    activeGoals: 0,
    timeSpentToday: 0,
    streakDays: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [error, setError] = useState('');
  const [showAwardNotification, setShowAwardNotification] = useState(false);
  const [newAward, setNewAward] = useState(null);

  // Check for awards
  const checkForAwards = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      };

      // Check project completion award
      const completionResponse = await fetch(`${apiUrl}/awards/check/completion/${projectId}`, {
        method: 'POST',
        headers
      });
      const completionData = await completionResponse.json();
      
      if (completionData.awarded) {
        setNewAward(completionData.award);
        setShowAwardNotification(true);
        setTimeout(() => setShowAwardNotification(false), 5000);
        return;
      }

      // Check weekly challenge award
      const challengeResponse = await fetch(`${apiUrl}/awards/check/challenges/${projectId}`, {
        method: 'POST',
        headers
      });
      const challengeData = await challengeResponse.json();
      
      if (challengeData.awarded) {
        setNewAward(challengeData.award);
        setShowAwardNotification(true);
        setTimeout(() => setShowAwardNotification(false), 5000);
      }
    } catch (error) {
      console.error('Error checking for awards:', error);
    }
  };

  // Fetch dashboard data using NEW backend API
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await SoloProjectService.getDashboardData(projectId);
      
      if (response.success) {
        const { project: projectData, stats } = response.data;
        setProject(projectData);
        setProjectStats(stats);
      }

      // Fetch tasks
      try {
        const tasksResponse = await taskService.getProjectTasks(projectId);
        if (tasksResponse.success) {
          setTasks(tasksResponse.data.tasks || []);
        }
      } catch (taskError) {
        console.warn('Could not fetch tasks:', taskError);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch recent activity using NEW backend API
  const fetchRecentActivity = useCallback(async () => {
    try {
      setLoadingActivity(true);
      const response = await SoloProjectService.getRecentActivity(projectId, 10);
      
      if (response.success) {
        setRecentActivity(response.data.activities || []);
      }
    } catch (error) {
      console.warn('Could not fetch recent activity:', error);
      setRecentActivity([]);
    } finally {
      setLoadingActivity(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivity();
  }, [fetchDashboardData, fetchRecentActivity]);

  // Check awards when completion rate changes
  useEffect(() => {
    if (projectStats?.completionRate > 0) {
      checkForAwards();
    }
  }, [projectStats?.completionRate]);

  // Helper function to log activity
  const logActivity = useCallback(async (action, target, type) => {
    try {
      await SoloProjectService.logActivity(projectId, {
        action,
        target,
        type
      });
      fetchRecentActivity();
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }, [projectId, fetchRecentActivity]);

  // Quick actions
  const handleQuickTaskCreate = async () => {
    try {
      navigate(`/solo-project/${projectId}/goals`);
      await logActivity('navigated to', 'Tasks page', 'project_updated');
    } catch (error) {
      console.error('Failed to navigate to tasks:', error);
    }
  };

  const handleQuickGoalCreate = async () => {
    try {
      navigate(`/solo-project/${projectId}/goals`);
      await logActivity('navigated to', 'Goals page', 'project_updated');
    } catch (error) {
      console.error('Failed to navigate to goals:', error);
    }
  };

  const handleQuickNoteCreate = async () => {
    try {
      navigate(`/solo-project/${projectId}/notes`);
      await logActivity('navigated to', 'Notes page', 'project_updated');
    } catch (error) {
      console.error('Failed to navigate to notes:', error);
    }
  };

  // Helper functions for display
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'todo': return '#f59e0b';
      default: return '#a855f7';
    }
  };

  const getActivityTypeIcon = (type) => {
    switch (type) {
      case 'task_completed': return '✅';
      case 'task_created': return '📝';
      case 'task_started': return '🚀';
      case 'goal_created': return '🎯';
      case 'note_created': return '📄';
      default: return '📋';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Render loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <BackgroundSymbols />
        <div style={styles.loadingState}>
          <div>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const recentTasks = tasks.slice(0, 5);

  return (
    <div style={styles.container}>
      <BackgroundSymbols />

      {/* Award Notification */}
      {showAwardNotification && newAward && (
        <div style={styles.awardNotification}>
          <Trophy size={32} style={{ color: newAward.award_color }} />
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
              🎉 New Award Earned!
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {newAward.award_title}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{project?.title || 'Solo Project'}</h1>
          <p style={styles.subtitle}>Solo Workspace Dashboard</p>
        </div>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      {/* Welcome Section */}
      <div style={styles.welcomeSection}>
        <h2 style={styles.welcomeTitle}>
          Welcome back, {user?.full_name || user?.username || 'Developer'}!
        </h2>
        <p style={styles.welcomeMessage}>
          {project?.title || 'Your Solo Project'} • Keep up the great work!
        </p>
        
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${projectStats.completionRate}%` }} />
          </div>
          <p style={styles.progressText}>
            {projectStats.completionRate}% Complete • {projectStats.completedTasks} of {projectStats.totalTasks} tasks done
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div style={styles.analyticsGrid}>
        <div style={styles.analyticsCard}>
          <div style={styles.analyticsHeader}>
            <h3 style={styles.analyticsTitle}>Total Tasks</h3>
            <BarChart3 size={24} style={styles.analyticsIcon} />
          </div>
          <div style={styles.analyticsValue}>{projectStats.totalTasks}</div>
          <div style={styles.analyticsSubtext}>{projectStats.inProgressTasks} in progress</div>
        </div>

        <div style={styles.analyticsCard}>
          <div style={styles.analyticsHeader}>
            <h3 style={styles.analyticsTitle}>Goals Set</h3>
            <Target size={24} style={styles.analyticsIcon} />
          </div>
          <div style={styles.analyticsValue}>{projectStats.totalGoals}</div>
          <div style={styles.analyticsSubtext}>{projectStats.activeGoals} active goals</div>
        </div>

        <div style={styles.analyticsCard}>
          <div style={styles.analyticsHeader}>
            <h3 style={styles.analyticsTitle}>Time Today</h3>
            <Clock size={24} style={styles.analyticsIcon} />
          </div>
          <div style={styles.analyticsValue}>{projectStats.timeSpentToday}h</div>
          <div style={styles.analyticsSubtext}>{projectStats.streakDays} day streak</div>
        </div>

        <div style={styles.analyticsCard}>
          <div style={styles.analyticsHeader}>
            <h3 style={styles.analyticsTitle}>Completion Rate</h3>
            <TrendingUp size={24} style={styles.analyticsIcon} />
          </div>
          <div style={styles.analyticsValue}>{projectStats.completionRate}%</div>
          <div style={styles.analyticsSubtext}>{projectStats.completedTasks} completed</div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${projectStats.completionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActionsSection}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.quickActions}>
          <button 
            style={styles.quickActionButton}
            onClick={handleQuickTaskCreate}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 24px rgba(147, 51, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.3)';
            }}
          >
            <Plus size={16} style={styles.quickActionIcon} />
            <span>Create Task</span>
          </button>
          <button 
            style={styles.quickActionButton}
            onClick={handleQuickGoalCreate}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 24px rgba(147, 51, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.3)';
            }}
          >
            <Target size={16} style={styles.quickActionIcon} />
            <span>Set Goal</span>
          </button>
          <button 
            style={styles.quickActionButton}
            onClick={handleQuickNoteCreate}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 24px rgba(147, 51, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.3)';
            }}
          >
            <StickyNote size={16} style={styles.quickActionIcon} />
            <span>Take Note</span>
          </button>
        </div>
      </div>

      {/* 🏆 AWARDS SECTION - THIS WAS MISSING! */}
      <div style={styles.awardsSection}>
        <h3 style={styles.sectionTitle}>
          <Award size={20} style={{ color: '#FFD700', marginRight: '8px' }} />
          Your Awards
        </h3>
        <AwardsDisplay projectId={projectId} compact={false} />
      </div>

      {/* Main Content Grid */}
      <div style={styles.contentGrid}>
        {/* Recent Tasks */}
        <div style={styles.contentCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Recent Tasks</h3>
            <button 
              style={styles.viewAllButton}
              onClick={() => navigate(`/solo-project/${projectId}/goals`)}
            >
              View All →
            </button>
          </div>
          <div style={styles.cardContent}>
            {recentTasks.length > 0 ? (
              recentTasks.map(task => (
                <div key={task.id} style={styles.taskItem}>
                  <div style={styles.taskInfo}>
                    <span 
                      style={{
                        ...styles.taskStatus,
                        backgroundColor: getStatusColor(task.status)
                      }}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                    <h4 style={styles.taskTitle}>{task.title}</h4>
                    <p style={styles.taskMeta}>{task.priority} priority</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>
                  <FileText size={48} style={{ opacity: 0.5 }} />
                </div>
                <p style={styles.emptyStateText}>No tasks yet. Create your first task!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={styles.contentCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Recent Activity</h3>
            <span style={styles.activityCount}>
              {loadingActivity ? 'Loading...' : `${recentActivity.length} activities`}
            </span>
          </div>
          <div style={styles.cardContent}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} style={styles.activityItem}>
                  <div style={styles.activityIcon}>
                    {getActivityTypeIcon(activity.activity_type)}
                  </div>
                  <div style={styles.activityInfo}>
                    <p style={styles.activityText}>
                      <span style={styles.activityAction}>
                        {activity.activity_data?.action || 'performed action'}
                      </span>
                      <span style={styles.activityTarget}>
                        {activity.activity_data?.target || 'unknown target'}
                      </span>
                    </p>
                    <p style={styles.activityTime}>
                      {formatTimeAgo(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>
                  <BarChart3 size={48} style={{ opacity: 0.5 }} />
                </div>
                <p style={styles.emptyStateText}>
                  {loadingActivity ? 'Loading activities...' : 'No recent activity'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - 40px)',
    backgroundColor: '#0F1116',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '20px',
    paddingLeft: '270px',
    marginLeft: '-150px'
  },
  awardNotification: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    color: 'white',
    padding: '20px 24px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    maxWidth: '400px'
  },
  header: {
    position: 'relative',
    zIndex: 10,
    marginBottom: '30px',
    padding: '0 0 20px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: 'white',
    margin: 0
  },
  subtitle: {
    color: '#d1d5db',
    fontSize: '16px',
    margin: '8px 0 0 0'
  },
  welcomeSection: {
    position: 'relative',
    zIndex: 10,
    background: 'linear-gradient(135deg, rgba(26, 28, 32, 0.95), rgba(15, 17, 22, 0.90))',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '32px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    marginBottom: '32px'
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '12px'
  },
  welcomeMessage: {
    color: '#d1d5db',
    fontSize: '16px',
    margin: '0 0 24px 0'
  },
  progressContainer: {
    marginTop: '20px'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    margin: '16px 0'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #a855f7, #7c3aed)',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: '14px',
    color: '#9ca3af',
    textAlign: 'center',
    margin: '8px 0 0 0'
  },
  analyticsGrid: {
    position: 'relative',
    zIndex: 10,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  analyticsCard: {
    background: 'linear-gradient(135deg, rgba(26, 28, 32, 0.95), rgba(15, 17, 22, 0.90))',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '25px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  },
  analyticsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  analyticsTitle: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    margin: 0
  },
  analyticsIcon: {
    color: '#a855f7'
  },
  analyticsValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#a855f7',
    margin: '10px 0'
  },
  analyticsSubtext: {
    color: '#9ca3af',
    fontSize: '14px'
  },
  quickActionsSection: {
    position: 'relative',
    zIndex: 10,
    marginBottom: '32px'
  },
  sectionTitle: {
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center'
  },
  quickActions: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  quickActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'linear-gradient(to right, #a855f7, #7c3aed)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)'
  },
  quickActionIcon: {
    flexShrink: 0
  },
  // 🏆 AWARDS SECTION STYLES - THIS WAS MISSING!
  awardsSection: {
    position: 'relative',
    zIndex: 10,
    background: 'linear-gradient(135deg, rgba(26, 28, 32, 0.95), rgba(15, 17, 22, 0.90))',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '32px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    marginBottom: '32px'
  },
  contentGrid: {
    position: 'relative',
    zIndex: 10,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px'
  },
  contentCard: {
    background: 'linear-gradient(135deg, rgba(26, 28, 32, 0.95), rgba(15, 17, 22, 0.90))',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    margin: 0
  },
  viewAllButton: {
    background: 'none',
    border: 'none',
    color: '#a855f7',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  activityCount: {
    fontSize: '14px',
    color: '#9ca3af'
  },
  cardContent: {
    padding: '24px',
    maxHeight: '400px',
    overflowY: 'auto'
  },
  taskItem: {
    padding: '12px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  taskInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  taskStatus: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
    textTransform: 'capitalize',
    width: 'fit-content'
  },
  taskTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    margin: 0
  },
  taskMeta: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0,
    textTransform: 'capitalize'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  activityIcon: {
    fontSize: '20px',
    marginTop: '2px'
  },
  activityInfo: {
    flex: 1
  },
  activityText: {
    fontSize: '14px',
    color: 'white',
    margin: '0 0 4px 0',
    lineHeight: '1.4'
  },
  activityAction: {
    fontWeight: '500'
  },
  activityTarget: {
    fontWeight: '400',
    marginLeft: '4px',
    color: '#a855f7'
  },
  activityTime: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#9ca3af'
  },
  emptyStateIcon: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
    opacity: 0.5
  },
  emptyStateText: {
    fontSize: '16px',
    margin: 0
  },
  loadingState: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    fontSize: '18px',
    color: '#9ca3af'
  },
  errorMessage: {
    position: 'relative',
    zIndex: 10,
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '20px',
    textAlign: 'center',
    backdropFilter: 'blur(8px)'
  }
};

export default SoloProjectDashboard;