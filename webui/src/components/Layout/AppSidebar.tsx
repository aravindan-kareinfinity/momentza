
import {
  Calendar,
  Home,
  Users,
  Building2,
  BookOpen,
  Settings,
  BarChart3,
  MessageSquare,
  Images,
  Image,
  Globe,
  Activity,
  Camera
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavLink, useLocation } from "react-router-dom";

const items = [
  /*{
    title: "Dashboard",
    url: "/admin",
    icon: Home,
  },*/
  {
    title: "Dashboard",
    url: "/admin/statistics",
    icon: Home,
  },
  {
    title: "Halls",
    url: "/admin/halls",
    icon: Building2,
  },
  {
    title: "Bookings",
    url: "/admin/bookings",
    icon: Calendar,
  },
  {
    title: "Happening",
    url: "/admin/happening",
    icon: Activity,
  },
  {
    title: "Reviews",
    url: "/admin/reviews",
    icon: MessageSquare,
  },
  {
    title: "Gallery",
    url: "/admin/gallery",
    icon: Images,
  },
  {
    title: "Carousel",
    url: "/admin/carousel",
    icon: Image,
  },
  {
    title: "Customer Clicks",
    url: "/admin/customer-clicks",
    icon: Camera,
  },
  {
    title: "Microsite",
    url: "/admin/microsite",
    icon: Globe,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Hall Management System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
