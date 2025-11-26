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

// Serve static files
app.UseDefaultFiles();   // serves index.html at root
app.UseStaticFiles();    // serves other HTML/CSS/JS

// Optional: fallback for SPA (if you want unknown paths to go to index.html)
// app.Use(async (context, next) =>
// {
//     await next();
//     if (context.Response.StatusCode == 404 && !System.IO.Path.HasExtension(context.Request.Path.Value))
//     {
//         context.Request.Path = "/index.html";
//         await next();
//     }
// });

app.UseRouting();
app.UseAuthorization();

// Map API endpoints
app.MapControllers();

// Apply migrations on startup
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
