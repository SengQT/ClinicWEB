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

// Enable CORS
app.UseCors("AllowAll");

// Serve static files and default index.html
app.UseDefaultFiles();
app.UseStaticFiles();

// SPA-style fallback for clean URLs (/doctors, /patients, /receptionists)
app.Use(async (context, next) =>
{
    await next();

    // If 404 and no file extension, serve index.html
    if (context.Response.StatusCode == 404 && 
        !System.IO.Path.HasExtension(context.Request.Path.Value))
    {
        context.Request.Path = "/index.html";
        await next();
    }
});

app.UseRouting();
app.UseAuthorization();

// Map API endpoints
app.MapControllers();

// Apply EF Core migrations on startup
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

// Run the app
app.Run();
Console.WriteLine("Application started.");
