import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Calendar, DollarSign, Building, Star, Activity } from 'lucide-react';
import { statisticsService } from '@/services/ServiceFactory';
import { useOrganization } from '@/hooks/useOrganization';

const Statistics = () => {
  // Get current organization using singleton pattern
  const {
    organization,
    loading: orgLoading,
    error: orgError
  } = useOrganization();

  // State for statistics data
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Fetch statistics when organization changes
  const fetchStatistics = useCallback(async () => {
    if (!organization?.id) {
      setStats(null);
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError(null);
      const statisticsData = await statisticsService.getAllStatistics(organization.id);
      setStats(statisticsData);
    } catch (error) {
      setStatsError(error.message || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  }, [organization?.id]);

  // Effect to fetch statistics when organization changes
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Loading state
  if (orgLoading || statsLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (orgError || statsError) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading statistics
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{orgError || statsError}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no stats data, show empty state
  if (!stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Statistics</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of your marriage hall business performance
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">No statistics available</p>
        </div>
      </div>
    );
  }

  const {
    basic,
    leads,
    statusDistribution,
    hallUtilization,
    monthlyData,
    growthMetrics,
    customerInsights,
    chartConfig
  } = stats;
  
  // Defensive checks for potentially undefined objects
  const safeBasic = basic && typeof basic === 'object'
    ? basic
    : { totalBookings: 0, activeBookings: 0, confirmedBookings: 0, totalRevenue: 0, averageRating: 0, totalReviews: 0 };
    
  const safeLeads = leads && typeof leads === 'object'
    ? leads
    : { newLeads: 0, rejectedLeads: 0, confirmedLeads: 0, upcomingEvents: 0, happeningEvents: 0 };
    
  const safeStatusDistribution = Array.isArray(statusDistribution) ? statusDistribution : [];
  const safeHallUtilization = Array.isArray(hallUtilization) ? hallUtilization : [];
  const safeMonthlyData = Array.isArray(monthlyData) ? monthlyData : [];
  
  const safeGrowthMetrics = growthMetrics && typeof growthMetrics === 'object'
    ? growthMetrics
    : { monthlyGrowth: 0, customerRetention: 0, averageBookingValue: 0 };
    
  const safeCustomerInsights = customerInsights && typeof customerInsights === 'object'
    ? customerInsights
    : { totalCustomers: 0, repeatCustomers: 0, customerSatisfaction: 0 };
    
  const safeChartConfig = chartConfig && typeof chartConfig === 'object' ? chartConfig : {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Statistics</h1>
        <p className="text-muted-foreground">
          Comprehensive overview of your marriage hall business performance
        </p>
      </div>

      {/* Enhanced Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{safeLeads.newLeads}</div>
            <p className="text-xs text-muted-foreground">
              Pending inquiries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{safeLeads.rejectedLeads}</div>
            <p className="text-xs text-muted-foreground">
              Cancelled bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Leads</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{safeLeads.confirmedLeads}</div>
            <p className="text-xs text-muted-foreground">
              Successful conversions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{safeLeads.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">
              Events scheduled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Happening Now</CardTitle>
            <Building className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{safeLeads.happeningEvents}</div>
            <p className="text-xs text-muted-foreground">
              Active events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Legacy metrics for comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeBasic.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              +{safeGrowthMetrics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeBasic.activeBookings}</div>
            <p className="text-xs text-muted-foreground">
              Currently ongoing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{safeBasic.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{safeGrowthMetrics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeBasic.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              From {safeBasic.totalReviews} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bookings and Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Bookings and revenue trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={safeChartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="var(--color-bookings)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Distribution</CardTitle>
            <CardDescription>Current status of all bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={safeChartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeStatusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {safeStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue progression</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={safeChartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safeMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--color-revenue)" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Hall Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Hall Utilization</CardTitle>
            <CardDescription>Bookings per hall</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={safeChartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeHallUtilization} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="bookings" fill="var(--color-bookings)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Business Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Hall Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {safeHallUtilization.slice(0, 3).map((hall, index) => (
                <div key={hall.name} className="flex justify-between items-center">
                  <span className="text-sm">{hall.name}</span>
                  <span className="font-medium">{hall.bookings} bookings</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Growth Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Monthly Growth</span>
                <span className="font-medium text-green-600">+{safeGrowthMetrics.monthlyGrowth}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Customer Retention</span>
                <span className="font-medium text-blue-600">{safeGrowthMetrics.customerRetention}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Average Booking Value</span>
                <span className="font-medium">₹{safeGrowthMetrics.averageBookingValue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Customers</span>
                <span className="font-medium">{safeCustomerInsights.totalCustomers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Repeat Customers</span>
                <span className="font-medium">{safeCustomerInsights.repeatCustomers}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Customer Satisfaction</span>
                <span className="font-medium">{safeCustomerInsights.customerSatisfaction.toFixed(1)}/5.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
