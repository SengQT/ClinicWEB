using Microsoft.AspNetCore.Mvc;
using ClinicWEB.Data;
using ClinicWEB.Models;
using System.Linq;

namespace ClinicWEB.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DoctorsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DoctorsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/doctors
        [HttpGet]
        public IActionResult GetDoctors()
        {
            var doctors = _context.Doctors.ToList();
            return Ok(doctors);
        }

        // POST: api/doctors
        [HttpPost]
        public IActionResult AddDoctor([FromBody] Doctor doctor)
        {
            if (doctor == null) return BadRequest();

            _context.Doctors.Add(doctor);
            _context.SaveChanges();

            return Ok(doctor);
        }
    }
}
