using System.Data;

namespace Momantza.Services
{
    public interface IBaseDataService<T> where T : class
    {
        Task<bool> CreateTableAsync();
        Task<T?> GetByIdAsync(string id);
        Task<List<T>> GetAllAsync();
        Task<List<T>> GetByOrganizationIdAsync(string organizationId);
        Task<bool> CreateAsync(T entity);
        Task<bool> UpdateAsync(T entity);
        Task<bool> DeleteAsync(string id);
        Task<bool> ExistsAsync(string id);
    }
} 