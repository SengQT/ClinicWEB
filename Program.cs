using ClinicWEB.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Read port from environment variable (for Render/Railway/etc.)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add controllers
builder.Services.AddControllers();

// Add DbContext using PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Allow any origin for deployment
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

// Middleware
app.UseCors("AllowAll");

// Remove HTTPS redirection for cloud deployment (they handle SSL)
// app.UseHttpsRedirection();

app.UseAuthorization();

// Serve static files
app.UseStaticFiles();

// SPA-style fallback to serve any .html file in wwwroot
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value;

    // If request has no extension, try to serve a corresponding .html file
    if (!System.IO.Path.HasExtension(path))
    {
        var file = $"wwwroot{path}.html";
        if (System.IO.File.Exists(file))
        {
            context.Response.ContentType = "text/html";
            await context.Response.SendFileAsync(file);
            return;
        }
    }

    await next();
});

// Map API endpoints
app.MapControllers();

// Apply migrations on startup (optional, auto-create tables)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.Migrate();
        Console.WriteLine("Database migration completed successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database migration failed: {ex.Message}");
    }
}

app.Run();
Console.WriteLine("Application started.");
