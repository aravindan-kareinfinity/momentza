import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Calendar, DollarSign, Building, Star, Activity } from 'lucide-react';
import { statisticsService } from '@/services/ServiceFactory';
import { useOrganization } from '@/hooks/useOrganization';
import { AnimatedPage } from '@/components/Layout/AnimatedPage';

const Statistics = () => {
  const {
    organization,
    loading: orgLoading,
    error: orgError
  } = useOrganization();

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  const fetchStatistics = useCallback(async () => {
    if (!organization?.id) {
      setStats(null);
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError(null);
      const statisticsData = await statisticsService.getAllStatistics(organization.id);
      console.log('Fetched statistics data:', statisticsData); // Debug log
      setStats(statisticsData);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatsError(error.message || 'Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Loading state
  if (orgLoading || statsLoading) {
    return (
      <AnimatedPage className="space-y-8">
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
      </AnimatedPage>
    );
  }

  // Error state
  if (orgError || statsError) {
    return (
      <AnimatedPage className="space-y-8">
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
      </AnimatedPage>
    );
  }

  // If no stats data, show empty state
  if (!stats) {
    return (
      <AnimatedPage className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Statistics</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of your marriage hall business performance
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">No statistics available</p>
        </div>
      </AnimatedPage>
    );
  }

  // Safely extract data with defaults
  const {
    basic = {
      totalBookings: 0,
      activeBookings: 0,
      confirmedBookings: 0,
      totalRevenue: 0,
      averageRating: 0,
      totalReviews: 0
    },
    leads = {
      newLeads: 0,
      rejectedLeads: 0,
      confirmedLeads: 0,
      upcomingEvents: 0,
      happeningEvents: 0
    },
    statusDistribution = [],
    hallUtilization = [],
    monthlyData = [],
    growthMetrics = {
      monthlyGrowth: 0,
      customerRetention: 0,
      averageBookingValue: 0
    },
    customerInsights = {
      totalCustomers: 0,
      repeatCustomers: 0,
      customerSatisfaction: 0
    },
    chartConfig = {
      bookings: { label: "Bookings", color: "#3b82f6" },
      revenue: { label: "Revenue", color: "#10b981" }
    }
  } = stats;

  // Ensure data types are correct
  const safeBasic = {
    totalBookings: Number(basic.totalBookings) || 0,
    activeBookings: Number(basic.activeBookings) || 0,
    confirmedBookings: Number(basic.confirmedBookings) || 0,
    totalRevenue: Number(basic.totalRevenue) || 0,
    averageRating: Number(basic.averageRating) || 0,
    totalReviews: Number(basic.totalReviews) || 0
  };

  const safeLeads = {
    newLeads: Number(leads.newLeads) || 0,
    rejectedLeads: Number(leads.rejectedLeads) || 0,
    confirmedLeads: Number(leads.confirmedLeads) || 0,
    upcomingEvents: Number(leads.upcomingEvents) || 0,
    happeningEvents: Number(leads.happeningEvents) || 0
  };

  const safeGrowthMetrics = {
    monthlyGrowth: Number(growthMetrics.monthlyGrowth) || 0,
    customerRetention: Number(growthMetrics.customerRetention) || 0,
    averageBookingValue: Number(growthMetrics.averageBookingValue) || 0
  };

  const safeCustomerInsights = {
    totalCustomers: Number(customerInsights.totalCustomers) || 0,
    repeatCustomers: Number(customerInsights.repeatCustomers) || 0,
    customerSatisfaction: Number(customerInsights.customerSatisfaction) || 0
  };

  // Prepare chart data
  const safeMonthlyData = Array.isArray(monthlyData) 
    ? monthlyData.map(item => ({
        month: String(item.month || ''),
        bookings: Number(item.bookings) || 0,
        revenue: Number(item.revenue) || 0
      }))
    : [];

  const safeStatusDistribution = Array.isArray(statusDistribution)
    ? statusDistribution.map(item => ({
        name: String(item.name || ''),
        value: Number(item.value) || 0,
        color: String(item.color || '#6b7280')
      }))
    : [];

  const safeHallUtilization = Array.isArray(hallUtilization)
    ? hallUtilization.map(item => ({
        name: String(item.name || ''),
        bookings: Number(item.bookings) || 0,
        revenue: Number(item.revenue) || 0
      }))
    : [];

  // Debug log to verify customer insights
  console.log('Customer Insights:', safeCustomerInsights);

  return (
    <AnimatedPage className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Statistics</h1>
        <p className="text-muted-foreground">
          Comprehensive overview of your marriage hall business performance
        </p>
      </div>

      {/* Lead Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{safeLeads.newLeads}</div>
            <p className="text-xs text-muted-foreground">Pending inquiries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{safeLeads.rejectedLeads}</div>
            <p className="text-xs text-muted-foreground">Cancelled bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Leads</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{safeLeads.confirmedLeads}</div>
            <p className="text-xs text-muted-foreground">Successful conversions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{safeLeads.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">Events scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Happening Now</CardTitle>
            <Building className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{safeLeads.happeningEvents}</div>
            <p className="text-xs text-muted-foreground">Active events</p>
          </CardContent>
        </Card>
      </div>

      {/* Basic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeBasic.totalBookings.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{safeBasic.activeBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Currently ongoing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{safeBasic.totalRevenue.toLocaleString('en-IN')}</div>
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
        {/* Monthly Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Bookings and revenue trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelStyle={{ color: "#374151" }}
                  />
                  <Bar 
                    dataKey="bookings" 
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
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
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safeStatusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {safeStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => [`${value} bookings`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Revenue progression over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safeMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Line
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
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
            <CardDescription>Booking intensity per hall</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeHallUtilization} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80}
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value, name) => {
                      if (name === 'bookings') return [`${value} bookings`, 'Bookings'];
                      if (name === 'revenue') return [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue'];
                      return [value, name];
                    }}
                  />
                  <Bar 
                    dataKey="bookings" 
                    fill="#0ea5e9"
                    barSize={30}
                    radius={[0, 4, 4, 0]}
                  />
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
                <span className="font-medium">₹{safeGrowthMetrics.averageBookingValue.toLocaleString('en-IN')}</span>
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
                <span className="font-medium">{safeCustomerInsights.totalCustomers.toLocaleString()}</span>
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
    </AnimatedPage>
  );
};

export default Statistics;