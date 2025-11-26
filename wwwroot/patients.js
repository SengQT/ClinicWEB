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
const PATIENTS_API_URL = `${API_BASE_URL}/api/patients`;

/* ============================================
   GLOBAL STATE
   ============================================
   Store all patients data to enable filtering without
   making additional API calls
*/
let allPatients = [];

/* ============================================
   INITIALIZE PAGE
   ============================================
   This function runs when the page loads.
   It sets up event listeners and loads initial data.
*/
document.addEventListener('DOMContentLoaded', function() {
    // Load patients data from API
    loadPatients();
    
    // Set up form submission handler
    const form = document.getElementById('patientForm');
    form.addEventListener('submit', handleFormSubmit);
    
    // Set up search input handler
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
});

/* ============================================
   LOAD PATIENTS FROM API
   ============================================
   Fetches all patients from the ASP.NET Core API
   using GET request to /api/patients
   
   Expected API Response Format:
   [
     { "id": 1, "name": "John Doe", "age": 35 },
     { "id": 2, "name": "Jane Smith", "age": 28 },
     ...
   ]
*/
async function loadPatients() {
    try {
        const tableBody = document.getElementById('patientsTableBody');
        tableBody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

        const res = await fetch(PATIENTS_API_URL);
        if (!res.ok) throw new Error("Failed to fetch patient data");

        allPatients = await res.json();  // store all
        renderPatients(allPatients);     // render once

    } catch (error) {
        console.error(error);
        document.getElementById('patientsTableBody').innerHTML =
            '<tr><td colspan="4">Error loading patients</td></tr>';
    }
}



/* ============================================
   RENDER PATIENTS IN TABLE
   ============================================
   Takes an array of patient objects and displays
   them in the table body
*/
function renderPatients(patients) {
    const tableBody = document.getElementById('patientsTableBody');
    
    // Clear existing content
    tableBody.innerHTML = '';
    
    // Check if there are no patients
    if (patients.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="no-results">No patients found</td></tr>';
        return;
    }
    
    // Create a row for each patient
    patients.forEach(patient => {
        const row = document.createElement('tr');
        
        // Get first letter of name for profile picture placeholder
        const initial = patient.name ? patient.name.charAt(0).toUpperCase() : '?';
        
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.name}</td>
            <td>${patient.age}</td>
            <td>
                <div class="profile-pic">${initial}</div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

document.getElementById('patientSearchBar').addEventListener('keyup', function () {
    const keyword = this.value.toLowerCase();

    const filtered = allPatients.filter(p =>
        p.patientName.toLowerCase().includes(keyword) ||
        p.patientPhone.toLowerCase().includes(keyword) ||
        p.emergencyPhone.toLowerCase().includes(keyword) ||
        p.gender.toLowerCase().includes(keyword) ||
        p.age.toString().includes(keyword)
    );

    renderPatients(filtered);
});


function renderPatientsBatch(batch) {
    const tableBody = document.getElementById('patientsTableBody');

    batch.forEach(patient => {
        const row = document.createElement('tr');
        const initial = patient.name ? patient.name.charAt(0).toUpperCase() : '?';

        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.name}</td>
            <td>${patient.age}</td>
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
   Sends POST request to API to add a new patient
   
   Request Body Format:
   {
     "name": "John Doe",
     "age": 35
   }
   
   Expected API Response:
   {
     "id": 3,
     "name": "John Doe",
     "age": 35
   }
*/
async function handleFormSubmit(event) {
    // Prevent default form submission (page reload)
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('patientName').value.trim();
    const age = parseInt(document.getElementById('patientAge').value);
    
    // Validate input
    if (!name || !age) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    // Create patient object to send to API
    const newPatient = {
        name: name,
        age: age
    };
    
    try {
        // Disable submit button to prevent double submission
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Adding...';
        
        // Make POST request to API
        const response = await fetch(PATIENTS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add any additional headers required by your API
                // 'Authorization': 'Bearer YOUR_TOKEN' // if authentication is needed
            },
            body: JSON.stringify(newPatient)
        });
        
        // Check if request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Parse response (the newly created patient with ID)
        const createdPatient = await response.json();
        
        // Show success message
        showMessage('✓ Patient added successfully!', 'success');
        
        // Clear form
        document.getElementById('patientForm').reset();
        
        // Reload patients table to show new patient
        await loadPatients();
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Add Patient';
        
    } catch (error) {
        console.error('Error adding patient:', error);
        showMessage(`✗ Failed to add patient: ${error.message}`, 'error');
        
        // Re-enable submit button
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Add Patient';
    }
}

/* ============================================
   HANDLE SEARCH/FILTER
   ============================================
   Filters the patients table based on search input.
   Searches across all columns: ID, Name, and Age.
*/
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    // If search is empty, show all patients
    if (searchTerm === '') {
        renderPatients(allPatients);
        return;
    }
    
    // Filter patients based on search term
    const filteredPatients = allPatients.filter(patient => {
        // Convert all searchable fields to lowercase strings
        const id = patient.id.toString().toLowerCase();
        const name = patient.name.toLowerCase();
        const age = patient.age.toString().toLowerCase();
        
        // Check if any field contains the search term
        return id.includes(searchTerm) || 
               name.includes(searchTerm) || 
               age.includes(searchTerm);
    });
    
    // Render filtered results
    renderPatients(filteredPatients);
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


loadPatients();

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
   
   2. Patient Model should have:
      - int Id { get; set; }
      - string Name { get; set; }
      - int Age { get; set; }
   
   3. API Controller should have:
      - GET /api/patients - Returns List<Patient>
      - POST /api/patients - Accepts Patient object, returns created Patient
   
   4. Example Controller:
      [ApiController]
      [Route("api/[controller]")]
      public class PatientsController : ControllerBase
      {
          [HttpGet]
          public ActionResult<List<Patient>> GetAll() { ... }
          
          [HttpPost]
          public ActionResult<Patient> Create(Patient patient) { ... }
      }
*/