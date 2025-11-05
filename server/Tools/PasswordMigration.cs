using System;
using System.Threading.Tasks;
using Momantza.Services;
using BCrypt.Net;

namespace Momantza.Tools
{
    // One-time tool to migrate plaintext passwords in DB to bcrypt hashes.
    // Run this from a safe admin context (local console or an authenticated admin-only endpoint).
    public static class PasswordMigration
    {
        public static async Task MigrateAsync(IUserDataService userDataService)
        {
            var users = await userDataService.GetAllAsync();
            foreach (var u in users)
            {
                if (string.IsNullOrEmpty(u.Password))
                    continue;

                // skip already-hashed bcrypt values
                if (u.Password.StartsWith("$2"))
                    continue;

                try
                {
                    var hashed = BCrypt.Net.BCrypt.HashPassword(u.Password, BCrypt.Net.BCrypt.GenerateSalt(12));
                    var ok = await userDataService.UpdatePasswordAsync(u.Id, hashed);
                    Console.WriteLine(ok ? $"Migrated {u.Email}" : $"Failed to migrate {u.Email}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error migrating {u.Email}: {ex.Message}");
                }
            }
        }
    }
}