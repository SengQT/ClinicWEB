using Microsoft.EntityFrameworkCore;
using ClinicWEB.Models;

namespace ClinicWEB.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // Tables
        public DbSet<Doctor> Doctors { get; set; } = null!;
        public DbSet<Patient> Patients { get; set; } = null!;
        public DbSet<Receptionist> Receptionists { get; set; } = null!;
    }
}
