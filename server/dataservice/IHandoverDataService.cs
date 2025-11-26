using Momantza.Models;

namespace Momantza.Services
{
    public interface IHandoverDataService
    {
        Task<Handover?> GetByBookingIdAsync(string bookingId);
        Task<bool> UpsertHandoverAsync(string bookingId, HandoverRequest request);
        Task<bool> DeleteByBookingIdAsync(string bookingId);
        Task<bool> CreateAsync(Handover entity);
        Task<bool> UpdateAsync(Handover entity);
        Task<List<Handover>> GetAllAsync();
        Task<Handover?> GetByIdAsync(string id);
        Task<bool> DeleteAsync(string id);
        Task<List<Handover>> GetByOrganizationIdAsync(string organizationId);

        // Handover image methods
        Task<string?> UploadHandoverImageAsync(HandoverImageUploadDto dto);
        Task<List<HandoverImage>> GetImagesByBookingIdAsync(string bookingId);
        Task<HandoverImage?> GetImageByIdAsync(string id);
        Task<bool> DeleteHandoverImageAsync(string id);
    }
}