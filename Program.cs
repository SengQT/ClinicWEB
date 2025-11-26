using ClinicWEB.Data;
using ClinicWEB.Controllers;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ===== Add Services =====

// Add controllers
builder.Services.AddControllers();

// Add DbContext (replace with your connection string)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Enable CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:3000", "http://127.0.0.1:5500") // adjust your frontend URL
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// ===== Build App =====
var app = builder.Build();

// ===== Middleware =====
app.UseCors("AllowFrontend");     // Enable CORS
app.UseHttpsRedirection();        // Redirect HTTP -> HTTPS (optional)
app.UseAuthorization();           // Authorization if needed

// Serve static files (index.html, JS, CSS)
app.UseDefaultFiles();  // looks for index.html
app.UseStaticFiles();   // serve wwwroot content

// Map controllers (API endpoints)
app.MapControllers();

// Run app
app.Run();