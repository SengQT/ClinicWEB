using ClinicWEB.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Read port from environment variable
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
app.UseAuthorization();
app.UseStaticFiles();

// Explicitly map all your HTML pages
var pages = new[] { "index", "doctors", "patients", "receptionists" };
foreach (var page in pages)
{
    app.MapGet($"/{page}", async context =>
    {
        context.Response.ContentType = "text/html";
        await context.Response.SendFileAsync($"wwwroot/{page}.html");
    });
}

// Optionally redirect root to index.html
app.MapGet("/", async context =>
{
    context.Response.ContentType = "text/html";
    await context.Response.SendFileAsync("wwwroot/index.html");
});

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
Console.WriteLine("Application started.");
