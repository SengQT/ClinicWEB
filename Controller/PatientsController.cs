using Microsoft.AspNetCore.Mvc;
using ClinicWEB.Data;
using ClinicWEB.Models;
using System.Linq;

namespace ClinicWEB.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PatientsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PatientsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/patients
        [HttpGet]
        public IActionResult GetPatients()
        {
            var patients = _context.Patients.ToList();
            return Ok(patients);
        }

        // POST: api/patients
        [HttpPost]
        public IActionResult AddPatient([FromBody] Patient patient)
        {
            if (patient == null) return BadRequest();

            _context.Patients.Add(patient);
            _context.SaveChanges();

            return Ok(patient);
        }
    }
}
