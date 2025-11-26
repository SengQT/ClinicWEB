/* ============================================
   CONFIGURATION
   ============================================
   Configure your ASP.NET Core Web API base URL here.
   
   Examples:
   - Local development: 'http://localhost:5000' or 'https://localhost:5001'
   - Production: 'https://your-api-domain.com'
   - Same domain: '' (empty string if API is hosted on the same domain)
   
   IMPORTANT: Make sure CORS is enabled in your ASP.NET Core API
   to allow requests from this frontend.
*/
const API_BASE_URL = ''; // Update this with your API URL
const DOCTORS_API_URL = `${API_BASE_URL}/api/doctors`;

/* ============================================
   GLOBAL STATE
   ============================================
   Store all doctors data to enable filtering without
   making additional API calls
*/
let allDoctors = [];

/* ============================================
   INITIALIZE PAGE
   ============================================
   This function runs when the page loads.
   It sets up event listeners and loads initial data.
*/
document.addEventListener('DOMContentLoaded', function() {
    // Load doctors data from API
    loadDoctors();
    
    // Set up form submission handler
    const form = document.getElementById('doctorForm');
    form.addEventListener('submit', handleFormSubmit);
    
    // Set up search input handler
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
});

/* ============================================
   LOAD DOCTORS FROM API
   ============================================
   Fetches all doctors from the ASP.NET Core API
   using GET request to /api/doctors
   
   Expected API Response Format:
   [
     { "id": 1, "name": "Dr. Sarah Johnson", "specialty": "Cardiology" },
     { "id": 2, "name": "Dr. Michael Chen", "specialty": "Pediatrics" },
     ...
   ]
*/
async function loadDoctors() {
    const tableBody = document.getElementById('doctorsTableBody');
    
    try {
        tableBody.innerHTML = '<tr><td colspan="4" class="loading">Loading doctors...</td></tr>';

        // Fetch doctors
        const response = await fetch(DOCTORS_API_URL, { method: 'GET' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const doctors = await response.json();

        // Save all data for searching
        allDoctors = doctors;

        // Render once
        renderDoctors(allDoctors);

    } catch (error) {
        console.error('Error loading doctors:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="error-message">
                    ✗ Failed to load doctors: ${error.message}
                </td>
            </tr>
        `;
    }
}



/* ============================================
   RENDER DOCTORS IN TABLE
   ============================================
   Takes an array of doctor objects and displays
   them in the table body
*/
function renderDoctors(doctors) {
    const tableBody = document.getElementById('doctorsTableBody');
    
    // Clear existing content
    tableBody.innerHTML = '';
    
    // Check if there are no doctors
    if (doctors.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="no-results">No doctors found</td></tr>';
        return;
    }
    
    // Create a row for each doctor
    doctors.forEach(doctor => {
        const row = document.createElement('tr');
        
        // Get first letter of name for profile picture placeholder
        const initial = doctor.name ? doctor.name.charAt(0).toUpperCase() : '?';
        
        row.innerHTML = `
            <td>${doctor.id}</td>
            <td>${doctor.name}</td>
            <td>${doctor.specialty}</td>
            <td>
                <div class="profile-pic">${initial}</div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function renderDoctorsBatch(batch) {
    const tableBody = document.getElementById('doctorsTableBody');

    batch.forEach(doctor => {
        const row = document.createElement('tr');
        const initial = doctor.name ? doctor.name.charAt(0).toUpperCase() : '?';

        row.innerHTML = `
            <td>${doctor.id}</td>
            <td>${doctor.name}</td>
            <td>${doctor.specialty}</td>
            <td>
                <div class="profile-pic">${initial}</div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


/* ============================================
   HANDLE FORM SUBMISSION
   ============================================
   Sends POST request to API to add a new doctor
   
   Request Body Format:
   {
     "name": "Dr. Sarah Johnson",
     "specialty": "Cardiology"
   }
   
   Expected API Response:
   {
     "id": 3,
     "name": "Dr. Sarah Johnson",
     "specialty": "Cardiology"
   }
*/
async function handleFormSubmit(event) {
    // Prevent default form submission (page reload)
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('doctorName').value.trim();
    const specialty = document.getElementById('doctorSpecialty').value.trim();
    
    // Validate input
    if (!name || !specialty) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    // Create doctor object to send to API
    const newDoctor = {
        name: name,
        specialty: specialty
    };
    
    try {
        // Disable submit button to prevent double submission
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Adding...';
        
        // Make POST request to API
        const response = await fetch(DOCTORS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add any additional headers required by your API
                // 'Authorization': 'Bearer YOUR_TOKEN' // if authentication is needed
            },
            body: JSON.stringify(newDoctor)
        });
        
        // Check if request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Parse response (the newly created doctor with ID)
        const createdDoctor = await response.json();
        
        // Show success message
        showMessage('✓ Doctor added successfully!', 'success');
        
        // Clear form
        document.getElementById('doctorForm').reset();
        
        // Reload doctors table to show new doctor
        await loadDoctors();
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Add Doctor';
        
    } catch (error) {
        console.error('Error adding doctor:', error);
        showMessage(`✗ Failed to add doctor: ${error.message}`, 'error');
        
        // Re-enable submit button
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Add Doctor';
    }
}

/* ============================================
   HANDLE SEARCH/FILTER
   ============================================
   Filters the doctors table based on search input.
   Searches across all columns: ID, Name, and Specialty.
*/
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    // If search is empty, show all doctors
    if (searchTerm === '') {
        renderDoctors(allDoctors);
        return;
    }
    
    // Filter doctors based on search term
    const filteredDoctors = allDoctors.filter(doctor => {
        // Convert all searchable fields to lowercase strings
        const id = doctor.id.toString().toLowerCase();
        const name = doctor.name.toLowerCase();
        const specialty = doctor.specialty.toLowerCase();
        
        // Check if any field contains the search term
        return id.includes(searchTerm) || 
               name.includes(searchTerm) || 
               specialty.includes(searchTerm);
    });
    
    // Render filtered results
    renderDoctors(filteredDoctors);
}

/* ============================================
   SHOW MESSAGE
   ============================================
   Displays success or error messages to the user
*/
function showMessage(message, type) {
    const messageContainer = document.getElementById('messageContainer');
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'success' ? 'success-message' : 'error-message';
    messageDiv.textContent = message;
    
    // Clear previous messages
    messageContainer.innerHTML = '';
    
    // Add new message
    messageContainer.appendChild(messageDiv);
    
    // Auto-remove message after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

/* ============================================
   API INTEGRATION NOTES
   ============================================
   
   ASP.NET Core API Setup Required:
   
   1. ENABLE CORS in your Startup.cs or Program.cs:
   
      builder.Services.AddCors(options =>
      {
          options.AddPolicy("AllowFrontend",
              builder => builder
                  .WithOrigins("http://localhost:3000", "http://127.0.0.1:5500")
                  .AllowAnyMethod()
                  .AllowAnyHeader());
      });
      
      app.UseCors("AllowFrontend");
   
   2. Doctor Model should have:
      - int Id { get; set; }
      - string Name { get; set; }
      - string Specialty { get; set; }
   
   3. API Controller should have:
      - GET /api/doctors - Returns List<Doctor>
      - POST /api/doctors - Accepts Doctor object, returns created Doctor
   
   4. Example Controller:
      [ApiController]
      [Route("api/[controller]")]
      public class DoctorsController : ControllerBase
      {
          [HttpGet]
          public ActionResult<List<Doctor>> GetAll() { ... }
          
          [HttpPost]
          public ActionResult<Doctor> Create(Doctor doctor) { ... }
      }
*/