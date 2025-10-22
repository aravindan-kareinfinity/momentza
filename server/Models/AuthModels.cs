namespace Momantza.Models
{
    public class LoginRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = "";
        public string NewPassword { get; set; } = "";
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; } = "";
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string Name { get; set; } = "";
        public string? OrganizationId { get; set; }
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = "";
    }

    public class LoginResponse
    {
        public UserResponse User { get; set; } = new();
        public string Token { get; set; } = "";
        public string Message { get; set; } = "";
    }

    public class UserResponse
    {
        public string Id { get; set; } = "";
        public string Email { get; set; } = "";
        public string Name { get; set; } = "";
        public string OrganizationId { get; set; } = "";
        public string Role { get; set; } = "";
        public List<string> AccessibleHalls { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
