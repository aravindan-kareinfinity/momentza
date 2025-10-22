import { 
  mockMonthlyData, 
  mockGrowthMetrics, 
  mockCustomerInsights,
  MonthlyData, 
  StatusData, 
  HallUtilization, 
  GrowthMetrics, 
  CustomerInsights 
} from '../mockData';
import { bookingService } from './bookingService';
import { hallService } from './hallService';
import { reviewService } from './reviewService';

class StatisticsService {
  // Basic Statistics
  async getBasicStatistics(organizationId: string) {
    const bookings = await bookingService.getBookingsByOrganization(organizationId);
    const reviews = await reviewService.getReviewsByOrganization(organizationId);

    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => b.status === 'active').length;
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'active')
      .reduce((sum, b) => sum + b.totalAmount, 0);
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    return {
      totalBookings,
      activeBookings,
      confirmedBookings,
      totalRevenue,
      averageRating,
      totalReviews: reviews.length
    };
  }

  // Lead Metrics
  async getLeadMetrics(organizationId: string) {
    const bookings = await bookingService.getBookingsByOrganization(organizationId);
    
    const newLeads = bookings.filter(b => b.status === 'pending').length;
    const rejectedLeads = bookings.filter(b => b.status === 'cancelled').length;
    const confirmedLeads = bookings.filter(b => b.status === 'confirmed').length;
    const upcomingEvents = bookings.filter(b => 
      b.status === 'confirmed' && new Date(b.eventDate) > new Date()
    ).length;
    const happeningEvents = bookings.filter(b => b.status === 'active').length;

    return {
      newLeads,
      rejectedLeads,
      confirmedLeads,
      upcomingEvents,
      happeningEvents
    };
  }

  // Booking Status Distribution
  async getStatusDistribution(organizationId: string): Promise<StatusData[]> {
    const bookings = await bookingService.getBookingsByOrganization(organizationId);
    
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const activeBookings = bookings.filter(b => b.status === 'active').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

    return [
      { name: 'Confirmed', value: confirmedBookings, color: '#10b981' },
      { name: 'Active', value: activeBookings, color: '#3b82f6' },
      { name: 'Pending', value: pendingBookings, color: '#f59e0b' },
      { name: 'Cancelled', value: cancelledBookings, color: '#ef4444' },
    ];
  }

  // Hall Utilization
  async getHallUtilization(organizationId: string): Promise<HallUtilization[]> {
    const bookings = await bookingService.getBookingsByOrganization(organizationId);
    const halls = await hallService.getHallsByOrganization(organizationId);

    return halls.map(hall => {
      const hallBookings = bookings.filter(b => 
        b.hallId === hall.id && (b.status === 'confirmed' || b.status === 'active')
      );
      return {
        name: hall.name,
        bookings: hallBookings.length,
        revenue: hallBookings.reduce((sum, b) => sum + b.totalAmount, 0)
      };
    });
  }

  // Monthly Data
  async getMonthlyData(): Promise<MonthlyData[]> {
    return mockMonthlyData;
  }

  // Growth Metrics
  async getGrowthMetrics(organizationId: string): Promise<GrowthMetrics> {
    const { totalRevenue, totalBookings } = await this.getBasicStatistics(organizationId);
    
    return {
      ...mockGrowthMetrics,
      averageBookingValue: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0
    };
  }

  // Customer Insights
  async getCustomerInsights(organizationId: string): Promise<CustomerInsights> {
    const { totalBookings, averageRating } = await this.getBasicStatistics(organizationId);
    
    return {
      ...mockCustomerInsights,
      totalCustomers: totalBookings,
      customerSatisfaction: averageRating
    };
  }

  // Chart Configuration
  async getChartConfig() {
    return {
      bookings: {
        label: "Bookings",
        color: "#3b82f6",
      },
      revenue: {
        label: "Revenue",
        color: "#10b981",
      },
    };
  }

  // Comprehensive Statistics
  async getAllStatistics(organizationId: string) {
    return {
      basic: await this.getBasicStatistics(organizationId),
      leads: await this.getLeadMetrics(organizationId),
      statusDistribution: await this.getStatusDistribution(organizationId),
      hallUtilization: await this.getHallUtilization(organizationId),
      monthlyData: await this.getMonthlyData(),
      growthMetrics: await this.getGrowthMetrics(organizationId),
      customerInsights: await this.getCustomerInsights(organizationId),
      chartConfig: await this.getChartConfig()
    };
  }
}

export const statisticsService = new StatisticsService();
export type { 
  MonthlyData, 
  StatusData, 
  HallUtilization, 
  GrowthMetrics, 
  CustomerInsights 
}; 