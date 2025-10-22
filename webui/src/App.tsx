
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RequestMonitor } from "@/components/Debug/RequestMonitor";
import Index from "./pages/Index";
import PublicHome from "./pages/PublicHome";
import HallDetail from "./pages/HallDetail";
import HallPreview from "./pages/HallPreview";
import HallEdit from "./pages/HallEdit";
import AddHall from "./pages/AddHall";
import BookingForm from "./pages/BookingForm";
import BookingConfirmation from "./pages/BookingConfirmation";
import BookingEdit from "./pages/BookingEdit";
import Login from "./pages/Login";
import Halls from "./pages/Halls";
import Bookings from "./pages/Bookings";
import Happening from "./pages/Happening";
import BookingManagement from "./pages/BookingManagement";
import Invoice from "./pages/Invoice";
import Reviews from "./pages/Reviews";
import Gallery from "./pages/Gallery";
import Carousel from "./pages/Carousel";
import CustomerClicks from "./pages/CustomerClicks";
import Microsite from "./pages/Microsite";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<PublicHome />} />
              <Route path="/org/:orgId" element={<PublicHome />} />
              <Route path="/:orgId" element={<PublicHome />} />
              <Route path="/hall/:hallId" element={<HallDetail />} />
              <Route path="/booking/:hallId" element={<BookingForm />} />
              <Route path="/booking-confirmation" element={<BookingConfirmation />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/statistics" element={<Statistics />} />
                        <Route path="/halls" element={<Halls />} />
                        <Route path="/halls/add" element={<AddHall />} />
                        <Route path="/halls/preview/:hallId" element={<HallPreview />} />
                        <Route path="/halls/edit/:hallId" element={<HallEdit />} />
                        <Route path="/bookings" element={<Bookings />} />
                        <Route path="/bookings/edit/:bookingId" element={<BookingEdit />} />
                        <Route path="/happening" element={<Happening />} />
                        <Route path="/happening/manage/:bookingId" element={<BookingManagement />} />
                        <Route path="/invoice/:bookingId" element={<Invoice />} />
                        <Route path="/reviews" element={<Reviews />} />
                        <Route path="/gallery" element={<Gallery />} />
                        <Route path="/carousel" element={<Carousel />} />
                        <Route path="/customer-clicks" element={<CustomerClicks />} />
                        <Route path="/microsite" element={<Microsite />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <RequestMonitor />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
