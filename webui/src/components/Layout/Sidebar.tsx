import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building,
  Calendar,
  Star,
  GalleryHorizontal,
  Globe,
  Users,
  Image,
  LogOut
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { authService, organizationService } from '@/services/ServiceFactory';
import { useOrganization } from '@/hooks/useOrganization';
import { shouldUseMockData } from '@/config/environment';

const navigationItems = [
  { title: 'Halls', url: '/halls', icon: Building },
  { title: 'Bookings', url: '/bookings', icon: Calendar },
  { title: 'Reviews', url: '/reviews', icon: Star },
  { title: 'Gallery', url: '/gallery', icon: GalleryHorizontal },
  { title: 'Carousel', url: '/carousel', icon: Image },
  { title: 'Microsite', url: '/microsite', icon: Globe },
  { title: 'Users', url: '/users', icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(null);

  // Get current organization using service hook
  const {
    organization,
    loading: orgLoading,
    error: orgError
  } = useOrganization();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setUserLoading(true);
        setUserError(null);
        
        let user;
        if (shouldUseMockData() && authService.getCurrentUserSync) {
          // Use synchronous method in mock mode for better performance
          user = authService.getCurrentUserSync();
        } else {
          // Use async method for API mode
          user = await authService.getCurrentUser();
        }
        
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        setUserError(error);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      if (shouldUseMockData() && authService.logoutSync) {
        // Use synchronous method in mock mode
        authService.logoutSync();
      } else {
        // Use async method for API mode
        await authService.logout();
      }
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, navigate to login
      navigate('/login');
    }
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground';

  const isCollapsed = state === 'collapsed';

  // Loading state
  if (userLoading || orgLoading) {
    return (
      <Sidebar className={isCollapsed ? 'w-14' : 'w-64'} collapsible="icon">
        <SidebarHeader className="p-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-primary" />
              <div className="space-y-2">
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          )}
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton disabled>
                  <item.icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Error state
  if (userError || orgError || !currentUser || !organization) {
    return (
      <Sidebar className={isCollapsed ? 'w-14' : 'w-64'} collapsible="icon">
        <SidebarHeader className="p-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">Organization</h2>
                <p className="text-sm text-muted-foreground">User</p>
              </div>
            </div>
          )}
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink to={item.url} end className={getNavCls}>
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span>Logout</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarHeader className="p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <Building className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">{organization.name}</h2>
              <p className="text-sm text-muted-foreground">{currentUser?.name}</p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink to={item.url} end className={getNavCls}>
                  <item.icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
