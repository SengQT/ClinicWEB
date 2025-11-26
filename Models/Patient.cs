using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
namespace ClinicWEB.Models
{
    public class Patient
    {
        [Key]
        public int PatientId { get; set; }
        [Required]
        [StringLength(100)]
        public string Name { get; set; }
        [Required]
        [Range(0, 3000)]
        public int Age { get; set; }

    }
}