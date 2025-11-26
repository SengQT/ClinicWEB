using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
namespace ClinicWEB.Models
{
    public class Receptionist
    {
        [Key]
        public int ReceptionistId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        [StringLength(10)]
        public string Shift { get; set; }
        [Required]
        [Range(0, 5000)]
        public double Salary { get; set; }
    }
}