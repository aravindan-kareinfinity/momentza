import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Calendar, Star } from 'lucide-react';
import { CustomerClick } from '@/services/mockData';

interface CustomerClicksSectionProps {
  customerClicks: CustomerClick[];
}

export function CustomerClicksSection({ customerClicks }: CustomerClicksSectionProps) {
  const safeClicks = Array.isArray(customerClicks) ? customerClicks : [];
  if (safeClicks.length === 0) {
    return null;
  }

  // Calculate metrics
  const totalClicks = safeClicks.length;
  const uniqueUsers = new Set(safeClicks.map(click => click.customerId)).size;
  const todayClicks = safeClicks.filter(click => {
    const clickDate = new Date(click.timestamp);
    const today = new Date();
    return clickDate.toDateString() === today.toDateString();
  }).length;

  const averageRating = safeClicks.length > 0 
    ? safeClicks.reduce((sum, click) => sum + (click.rating || 0), 0) / safeClicks.length 
    : 0;

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Customer Engagement</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Track how customers interact with our halls and services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClicks}</div>
              <p className="text-xs text-muted-foreground">
                Total customer interactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">
                Individual customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Clicks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayClicks}</div>
              <p className="text-xs text-muted-foreground">
                Interactions today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Customer satisfaction
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
