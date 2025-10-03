import React, { useState, useEffect } from 'react';
import { UserActivity } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity, 
  Eye, 
  Download, 
  Search, 
  Calculator,
  FileText,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import AccessDenied from '../components/common/AccessDenied';

const EVENTS_CONFIG = {
  dossier_generated: { label: 'Dossier Generated', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  dossier_viewed: { label: 'Dossier Viewed', icon: Eye, color: 'bg-green-100 text-green-800' },
  pdf_downloaded: { label: 'PDF Downloaded', icon: Download, color: 'bg-purple-100 text-purple-800' },
  data_exported: { label: 'Data Exported', icon: Download, color: 'bg-amber-100 text-amber-800' },
  regulatory_search: { label: 'Regulatory Search', icon: Search, color: 'bg-indigo-100 text-indigo-800' },
  regulatory_search_saved: { label: 'Search Saved', icon: Search, color: 'bg-teal-100 text-teal-800' },
  trir_calculated: { label: 'TRIR Calculated', icon: Calculator, color: 'bg-orange-100 text-orange-800' },
  safety_pays_calculated: { label: 'Safety Pays Calculated', icon: Calculator, color: 'bg-red-100 text-red-800' },
  training_ai_query: { label: 'Training Query', icon: Activity, color: 'bg-cyan-100 text-cyan-800' },
  training_document_viewed: { label: 'Document Viewed', icon: FileText, color: 'bg-slate-100 text-slate-800' },
  page_visited: { label: 'Page Visit', icon: Activity, color: 'bg-gray-100 text-gray-800' },
  case_study_generated: { label: 'Case Study Generated', icon: FileText, color: 'bg-emerald-100 text-emerald-800' },
  case_study_downloaded: { label: 'Case Study Downloaded', icon: Download, color: 'bg-violet-100 text-violet-800' }
};

const MetricCard = ({ title, value, icon: Icon, description, trend }) => (
  <Card className="bg-white shadow-sm border-slate-200">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        </div>
        <div className="p-3 bg-primary-100 rounded-full">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          <span className="text-green-600">{trend}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const ActivityItem = ({ activity }) => {
  const config = EVENTS_CONFIG[activity.event_type] || { 
    label: activity.event_type, 
    icon: Activity, 
    color: 'bg-gray-100 text-gray-800' 
  };
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-4 p-4 border-b border-slate-100 last:border-b-0">
      <div className="p-2 bg-slate-100 rounded-full">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={config.color}>
            {config.label}
          </Badge>
          <span className="text-sm text-slate-500">
            {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
          </span>
        </div>
        <p className="text-sm text-slate-900 font-medium">
          {activity.user_email}
        </p>
        {activity.company_name && (
          <p className="text-sm text-slate-600">
            Company: {activity.company_name}
          </p>
        )}
        {activity.feature_used && (
          <p className="text-xs text-slate-500">
            Feature: {activity.feature_used}
          </p>
        )}
      </div>
    </div>
  );
};

export default function Analytics() {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Filters
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState('7'); // days
  const [searchTerm, setSearchTerm] = useState('');

  // Metrics
  const [metrics, setMetrics] = useState({
    totalActivities: 0,
    uniqueUsers: 0,
    topEvent: '',
    activitiesToday: 0
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadActivities();
    }
  }, [user]);

  useEffect(() => {
    filterActivities();
  }, [activities, selectedEventType, selectedUser, dateRange, searchTerm]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      // Load recent activities (last 30 days worth)
      const data = await UserActivity.list('-timestamp', 1000);
      setActivities(data || []);
      calculateMetrics(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    }
    setIsLoading(false);
  };

  const calculateMetrics = (data) => {
    const today = startOfDay(new Date());
    const activitiesToday = data.filter(a => 
      new Date(a.timestamp) >= today
    ).length;
    
    const uniqueUsers = new Set(data.map(a => a.user_email)).size;
    
    const eventCounts = {};
    data.forEach(a => {
      eventCounts[a.event_type] = (eventCounts[a.event_type] || 0) + 1;
    });
    
    const topEvent = Object.keys(eventCounts).reduce((a, b) => 
      eventCounts[a] > eventCounts[b] ? a : b, ''
    );

    setMetrics({
      totalActivities: data.length,
      uniqueUsers,
      topEvent: EVENTS_CONFIG[topEvent]?.label || topEvent,
      activitiesToday
    });
  };

  const filterActivities = () => {
    let filtered = [...activities];

    // Date range filter
    if (dateRange !== 'all') {
      const daysBack = parseInt(dateRange);
      const cutoffDate = subDays(new Date(), daysBack);
      filtered = filtered.filter(a => new Date(a.timestamp) >= cutoffDate);
    }

    // Event type filter
    if (selectedEventType !== 'all') {
      filtered = filtered.filter(a => a.event_type === selectedEventType);
    }

    // User filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(a => a.user_email === selectedUser);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.company_name?.toLowerCase().includes(searchLower) ||
        a.user_email?.toLowerCase().includes(searchLower) ||
        a.feature_used?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredActivities(filtered);
  };

  const getUniqueUsers = () => {
    return [...new Set(activities.map(a => a.user_email))].sort();
  };

  const getEventTypeOptions = () => {
    const eventTypes = [...new Set(activities.map(a => a.event_type))];
    return eventTypes.map(type => ({
      value: type,
      label: EVENTS_CONFIG[type]?.label || type
    })).sort((a, b) => a.label.localeCompare(b.label));
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2">Analytics Dashboard</h1>
              <p className="text-slate-600 text-sm sm:text-lg">
                Track user activity and app usage patterns
              </p>
            </div>
            <Button onClick={loadActivities} disabled={isLoading} className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <MetricCard
            title="Total Activities"
            value={metrics.totalActivities.toLocaleString()}
            icon={Activity}
            description="All tracked user actions"
          />
          <MetricCard
            title="Active Users"
            value={metrics.uniqueUsers}
            icon={Users}
            description="Users with recorded activity"
          />
          <MetricCard
            title="Top Activity"
            value={metrics.topEvent}
            icon={TrendingUp}
            description="Most common user action"
          />
          <MetricCard
            title="Today's Activity"
            value={metrics.activitiesToday}
            icon={Calendar}
            description="Activities recorded today"
          />
        </div>

        {/* Filters */}
        <Card className="bg-white shadow-sm border-slate-200 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Time Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Event Type</Label>
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {getEventTypeOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {getUniqueUsers().map(userEmail => (
                      <SelectItem key={userEmail} value={userEmail}>
                        {userEmail}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Search</Label>
                <Input
                  placeholder="Search companies, users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Activity Feed
              </CardTitle>
              <Badge variant="secondary">
                {filteredActivities.length} activities
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-slate-600">Loading activities...</span>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No activities found matching your filters</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {filteredActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}