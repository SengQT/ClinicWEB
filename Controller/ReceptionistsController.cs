using Microsoft.AspNetCore.Mvc;
using ClinicWEB.Data;
using ClinicWEB.Models;
using System.Linq;

namespace ClinicWEB.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReceptionistsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReceptionistsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/receptionists
        [HttpGet]
        public IActionResult GetReceptionists()
        {
            var receptionists = _context.Receptionists.ToList();
            return Ok(receptionists);
        }

        // POST: api/receptionists
        [HttpPost]
        public IActionResult AddReceptionist([FromBody] Receptionist receptionist)
        {
            if (receptionist == null) return BadRequest();

            _context.Receptionists.Add(receptionist);
            _context.SaveChanges();

            return Ok(receptionist);
        }
    }
}
