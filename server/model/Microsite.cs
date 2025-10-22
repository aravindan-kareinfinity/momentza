using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    public class Microsite
    {
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string OrganizationId { get; set; } = string.Empty;
        
        public bool IsActive { get; set; }
        
        public List<MicrositeComponent> Components { get; set; } = new List<MicrositeComponent>();
    }

    //public class MicrositeComponent
    //{
    //    public string Id { get; set; }
        
    //    [Required]
    //    public string Type { get; set; } 
        
    //    [Required]
    //    [Range(1, int.MaxValue)]
    //    public int Order { get; set; }
        
    //    public bool IsActive { get; set; } = true;
    //}
} 