using System.ComponentModel.DataAnnotations;

namespace Momantza.Models
{
    /// <summary>
    /// Strongly-typed configuration for microsite components
    /// This class handles all possible configuration fields for different component types
    /// </summary>
    public class MicrositeComponentConfig
    {
        // Common configuration fields used across multiple component types
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Width { get; set; } = "full"; // 1/4, 1/3, 1/2, full
        public int? Height { get; set; }
        public string? Alignment { get; set; } = "left"; // left, center, right
        public string? Position { get; set; } = "center"; // left, center, right
        
        // Image-related fields
        public string? ImageId { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImagePosition { get; set; } = "center"; // left, center, right
        public int? ImageWidth { get; set; }
        public int? ImageHeight { get; set; }
        
        // Carousel-specific configuration
        public int? SlotTime { get; set; } = 5; // seconds between slides
        
        // Halls Grid-specific configuration
        public int? ItemsPerPage { get; set; } = 6;
        public bool? ShowFilters { get; set; } = true;
        
        // Reviews-specific configuration
        public int? MaxReviews { get; set; } = 5;
        public bool? ShowRating { get; set; } = true;
        public int? MaxCount { get; set; } = 6; // Alternative field name used in frontend
        
        // Search-specific configuration (if needed in future)
        public bool? EnableSearch { get; set; } = true;
        public string? SearchPlaceholder { get; set; } = "Search halls...";
        
        // Additional styling and layout options
        public string? BackgroundColor { get; set; }
        public string? TextColor { get; set; }
        public string? BorderRadius { get; set; }
        public string? Padding { get; set; }
        public string? Margin { get; set; }
        
        // Animation and interaction settings
        public bool? EnableAnimations { get; set; } = true;
        public string? AnimationType { get; set; } = "fade"; // fade, slide, zoom
        public int? AnimationDuration { get; set; } = 300; // milliseconds
        
        // Responsive behavior
        public bool? Responsive { get; set; } = true;
        public string? MobileLayout { get; set; } = "stack"; // stack, grid, carousel
        public string? TabletLayout { get; set; } = "grid"; // stack, grid, carousel
        
        // Custom CSS classes and styling
        public string? CustomCssClass { get; set; }
        public string? CustomStyles { get; set; }
        
        // SEO and accessibility
        public string? AltText { get; set; }
        public string? AriaLabel { get; set; }
        public bool? LazyLoad { get; set; } = true;
        
        // Performance settings
        public bool? EnableLazyLoading { get; set; } = true;
        public int? PreloadCount { get; set; } = 2;
        public bool? EnableCaching { get; set; } = true;
        
        // Validation and error handling
        public bool? ShowErrorMessages { get; set; } = true;
        public string? FallbackContent { get; set; }
        public bool? GracefulDegradation { get; set; } = true;
        
        /// <summary>
        /// Gets the component type-specific configuration as a dictionary
        /// Useful for serialization and dynamic access
        /// </summary>
        public Dictionary<string, object?> ToDictionary()
        {
            var dict = new Dictionary<string, object?>();
            
            // Use reflection to get all properties
            var properties = typeof(MicrositeComponentConfig).GetProperties();
            foreach (var prop in properties)
            {
                var value = prop.GetValue(this);
                if (value != null)
                {
                    dict[prop.Name] = value;
                }
            }
            
            return dict;
        }
        
        /// <summary>
        /// Creates a configuration object from a dictionary
        /// Useful for deserialization and dynamic configuration
        /// </summary>
        public static MicrositeComponentConfig FromDictionary(Dictionary<string, object?> dict)
        {
            var config = new MicrositeComponentConfig();
            
            if (dict == null) return config;
            
            var properties = typeof(MicrositeComponentConfig).GetProperties();
            foreach (var prop in properties)
            {
                if (dict.ContainsKey(prop.Name) && dict[prop.Name] != null)
                {
                    try
                    {
                        var value = Convert.ChangeType(dict[prop.Name], prop.PropertyType);
                        prop.SetValue(config, value);
                    }
                    catch
                    {
                        // Skip invalid conversions
                    }
                }
            }
            
            return config;
        }
        
        /// <summary>
        /// Validates the configuration based on component type
        /// </summary>
        public bool IsValidForComponentType(string componentType)
        {
            switch (componentType?.ToLower())
            {
                case "carousel":
                    return SlotTime > 0;
                    
                case "halls":
                    return ItemsPerPage > 0;
                    
                case "reviews":
                    return MaxReviews > 0 || MaxCount > 0;
                    
                case "text":
                    return !string.IsNullOrEmpty(Title) && !string.IsNullOrEmpty(Description);
                    
                case "image":
                    return !string.IsNullOrEmpty(ImageId) || !string.IsNullOrEmpty(ImageUrl);
                    
                case "search":
                    return true; // Search components don't have strict validation requirements
                    
                default:
                    return true; // Unknown component types are considered valid
            }
        }
        
        /// <summary>
        /// Gets default configuration for a specific component type
        /// </summary>
        public static MicrositeComponentConfig GetDefaultForComponentType(string componentType)
        {
            var config = new MicrositeComponentConfig();
            
            switch (componentType?.ToLower())
            {
                case "carousel":
                    config.SlotTime = 5;
                    config.Width = "full";
                    config.EnableAnimations = true;
                    config.AnimationType = "fade";
                    config.AnimationDuration = 300;
                    break;
                    
                case "halls":
                    config.ItemsPerPage = 6;
                    config.ShowFilters = true;
                    config.Width = "full";
                    config.Responsive = true;
                    config.MobileLayout = "stack";
                    config.TabletLayout = "grid";
                    break;
                    
                case "reviews":
                    config.MaxReviews = 5;
                    config.ShowRating = true;
                    config.Width = "full";
                    config.Alignment = "center";
                    break;
                    
                case "text":
                    config.Width = "full";
                    config.Alignment = "left";
                    config.EnableAnimations = false;
                    break;
                    
                case "image":
                    config.Width = "full";
                    config.Height = 300;
                    config.Position = "center";
                    config.EnableLazyLoading = true;
                    config.LazyLoad = true;
                    break;
                    
                case "search":
                    config.EnableSearch = true;
                    config.SearchPlaceholder = "Search halls...";
                    config.Width = "full";
                    config.Responsive = true;
                    break;
            }
            
            return config;
        }
    }
}
