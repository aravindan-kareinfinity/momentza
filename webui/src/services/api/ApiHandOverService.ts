import { Handover } from "@/types";
import { HandOverImage } from "@/types";
import { apiClient } from "../http/ApiClient";
import { buildApiUrl } from "@/environment";


export class ApiHandoverService {

    // ---------------------------
    //  HANDOVER CRUD
    // ---------------------------
  
    async getHandover(bookingId: string) {
      return apiClient.get(`/api/bookings/${bookingId}/handover`);
    }
  
    async saveHandover(bookingId: string, data: Handover) {
      return apiClient.post(`/api/bookings/${bookingId}/handover`, data);
    }
  
    async deleteHandover(bookingId: string) {
      return apiClient.delete(`/api/bookings/${bookingId}/handover`);
    }
  
    // ---------------------------
    // HANDOVER IMAGE API
    // ---------------------------
  
    async uploadImage(bookingId: string, formData: FormData) {
      return apiClient.upload(`/api/bookings/${bookingId}/handover/images`, formData);
    }
  
    async getImages(bookingId: string): Promise<HandOverImage[]> {
        return apiClient.get<HandOverImage[]>(`/api/bookings/${bookingId}/handover/images`);
      }
  
    async deleteImage(bookingId: string, imageId: string) {
      return apiClient.delete(`/api/bookings/${bookingId}/handover/images/${imageId}`);
    }
  
    getImageUrl(bookingId: string, imageId: string) {
      return buildApiUrl(`/api/bookings/${bookingId}/handover/images/${imageId}`);
    }
  }