using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Linq;
using System.Reflection;

namespace Momantza.Swagger
{
    public class FileUploadOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var fileParameters = context.MethodInfo.GetParameters()
                .Where(p => p.ParameterType == typeof(IFormFile) || 
                           p.GetCustomAttributes(typeof(FromFormAttribute), false).Any())
                .ToList();

            if (fileParameters.Any())
            {
                operation.RequestBody = new OpenApiRequestBody
                {
                    Content = new Dictionary<string, OpenApiMediaType>
                    {
                        ["multipart/form-data"] = new OpenApiMediaType
                        {
                            Schema = new OpenApiSchema
                            {
                                Type = "object",
                                Properties = context.MethodInfo.GetParameters()
                                    .Where(p => p.GetCustomAttributes(typeof(FromFormAttribute), false).Any())
                                    .ToDictionary(
                                        p => p.Name ?? string.Empty,
                                        p =>
                                        {
                                            if (p.ParameterType == typeof(IFormFile))
                                            {
                                                return new OpenApiSchema
                                                {
                                                    Type = "string",
                                                    Format = "binary",
                                                    Description = "File to upload"
                                                };
                                            }
                                            return new OpenApiSchema
                                            {
                                                Type = p.ParameterType == typeof(string) ? "string" : "string"
                                            };
                                        }
                                    ),
                                Required = context.MethodInfo.GetParameters()
                                    .Where(p => p.GetCustomAttributes(typeof(FromFormAttribute), false).Any() &&
                                               !p.IsOptional)
                                    .Select(p => p.Name ?? string.Empty)
                                    .ToHashSet()
                            }
                        }
                    }
                };

                // Remove file parameters from parameters list since they're now in the request body
                operation.Parameters = operation.Parameters?
                    .Where(p => !fileParameters.Any(fp => fp.Name == p.Name))
                    .ToList() ?? new List<OpenApiParameter>();
            }
        }
    }
}
