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
const RECEPTIONISTS_API_URL = `${API_BASE_URL}/api/receptionists`;

/* ============================================
   GLOBAL STATE
   ============================================
   Store all receptionists data to enable filtering without
   making additional API calls
*/
let allReceptionists = [];

/* ============================================
   INITIALIZE PAGE
   ============================================
   This function runs when the page loads.
   It sets up event listeners and loads initial data.
*/
document.addEventListener('DOMContentLoaded', function() {
    // Load receptionists data from API
    loadReceptionists();
    
    // Set up form submission handler
    const form = document.getElementById('receptionistForm');
    form.addEventListener('submit', handleFormSubmit);
    
    // Set up search input handler
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
});

/* ============================================
   LOAD RECEPTIONISTS FROM API
   ============================================
   Fetches all receptionists from the ASP.NET Core API
   using GET request to /api/receptionists
   
   Expected API Response Format:
   [
     { "id": 1, "name": "Emily Davis", "shift": "Morning", "salary": 45000 },
     { "id": 2, "name": "David Wilson", "shift": "Evening", "salary": 48000 },
     ...
   ]
*/
async function loadReceptionists() {
    const tableBody = document.getElementById('receptionistsTableBody');
    
    try {
        tableBody.innerHTML = '<tr><td colspan="5" class="loading">Loading receptionists...</td></tr>';

        allReceptionists = [];

        const response = await fetch(RECEPTIONISTS_API_URL, { method: 'GET' });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const receptionists = await response.json();

        const PAGE_SIZE = 10;
        const FETCH_DELAY = 200;
        const totalPages = Math.ceil(receptionists.length / PAGE_SIZE);

        tableBody.innerHTML = '';

        for (let page = 0; page < totalPages; page++) {
            const start = page * PAGE_SIZE;
            const end = start + PAGE_SIZE;
            const batch = receptionists.slice(start, end);

            allReceptionists.push(...batch);

            renderReceptionistsBatch(batch);

            await new Promise(resolve => setTimeout(resolve, FETCH_DELAY));
        }

    } catch (error) {
        console.error('Error loading receptionists:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="error-message">
                    ✗ Failed to load receptionists: ${error.message}
                </td>
            </tr>
        `;
    }
}


/* ============================================
   RENDER RECEPTIONISTS IN TABLE
   ============================================
   Takes an array of receptionist objects and displays
   them in the table body
*/
function renderReceptionists(receptionists) {
    const tableBody = document.getElementById('receptionistsTableBody');
    
    // Clear existing content
    tableBody.innerHTML = '';
    
    // Check if there are no receptionists
    if (receptionists.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="no-results">No receptionists found</td></tr>';
        return;
    }
    
    // Create a row for each receptionist
    receptionists.forEach(receptionist => {
        const row = document.createElement('tr');
        
        // Get first letter of name for profile picture placeholder
        const initial = receptionist.name ? receptionist.name.charAt(0).toUpperCase() : '?';
        
        // Format salary with currency symbol and thousands separator
        const formattedSalary = formatCurrency(receptionist.salary);
        
        row.innerHTML = `
            <td>${receptionist.id}</td>
            <td>${receptionist.name}</td>
            <td>${receptionist.shift}</td>
            <td>${formattedSalary}</td>
            <td>
                <div class="profile-pic">${initial}</div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function renderReceptionistsBatch(batch) {
    const tableBody = document.getElementById('receptionistsTableBody');

    batch.forEach(receptionist => {
        const row = document.createElement('tr');
        const initial = receptionist.name ? receptionist.name.charAt(0).toUpperCase() : '?';
        const formattedSalary = formatCurrency(receptionist.salary);

        row.innerHTML = `
            <td>${receptionist.id}</td>
            <td>${receptionist.name}</td>
            <td>${receptionist.shift}</td>
            <td>${formattedSalary}</td>
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
   Sends POST request to API to add a new receptionist
   
   Request Body Format:
   {
     "name": "Emily Davis",
     "shift": "Morning",
     "salary": 45000
   }
   
   Expected API Response:
   {
     "id": 3,
     "name": "Emily Davis",
     "shift": "Morning",
     "salary": 45000
   }
*/
async function handleFormSubmit(event) {
    // Prevent default form submission (page reload)
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('receptionistName').value.trim();
    const shift = document.getElementById('receptionistShift').value.trim();
    const salary = parseFloat(document.getElementById('receptionistSalary').value);
    
    // Validate input
    if (!name || !shift || !salary || isNaN(salary)) {
        showMessage('Please fill in all required fields with valid values', 'error');
        return;
    }
    
    if (salary < 0) {
        showMessage('Salary cannot be negative', 'error');
        return;
    }
    
    // Create receptionist object to send to API
    const newReceptionist = {
        name: name,
        shift: shift,
        salary: salary
    };
    
    try {
        // Disable submit button to prevent double submission
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Adding...';
        
        // Make POST request to API
        const response = await fetch(RECEPTIONISTS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add any additional headers required by your API
                // 'Authorization': 'Bearer YOUR_TOKEN' // if authentication is needed
            },
            body: JSON.stringify(newReceptionist)
        });
        
        // Check if request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Parse response (the newly created receptionist with ID)
        const createdReceptionist = await response.json();
        
        // Show success message
        showMessage('✓ Receptionist added successfully!', 'success');
        
        // Clear form
        document.getElementById('receptionistForm').reset();
        
        // Reload receptionists table to show new receptionist
        await loadReceptionists();
        
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Add Receptionist';
        
    } catch (error) {
        console.error('Error adding receptionist:', error);
        showMessage(`✗ Failed to add receptionist: ${error.message}`, 'error');
        
        // Re-enable submit button
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Add Receptionist';
    }
}

/* ============================================
   HANDLE SEARCH/FILTER
   ============================================
   Filters the receptionists table based on search input.
   Searches across all columns: ID, Name, Shift, and Salary.
*/
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    // If search is empty, show all receptionists
    if (searchTerm === '') {
        renderReceptionists(allReceptionists);
        return;
    }
    
    // Filter receptionists based on search term
    const filteredReceptionists = allReceptionists.filter(receptionist => {
        // Convert all searchable fields to lowercase strings
        const id = receptionist.id.toString().toLowerCase();
        const name = receptionist.name.toLowerCase();
        const shift = receptionist.shift.toLowerCase();
        const salary = receptionist.salary.toString().toLowerCase();
        
        // Check if any field contains the search term
        return id.includes(searchTerm) || 
               name.includes(searchTerm) || 
               shift.includes(searchTerm) || 
               salary.includes(searchTerm);
    });
    
    // Render filtered results
    renderReceptionists(filteredReceptionists);
}

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

/**
 * Format number as currency with $ symbol and thousands separator
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return '$' + amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
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
   
   2. Receptionist Model should have:
      - int Id { get; set; }
      - string Name { get; set; }
      - string Shift { get; set; }
      - decimal Salary { get; set; } or double Salary { get; set; }
   
   3. API Controller should have:
      - GET /api/receptionists - Returns List<Receptionist>
      - POST /api/receptionists - Accepts Receptionist object, returns created Receptionist
   
   4. Example Controller:
      [ApiController]
      [Route("api/[controller]")]
      public class ReceptionistsController : ControllerBase
      {
          [HttpGet]
          public ActionResult<List<Receptionist>> GetAll() { ... }
          
          [HttpPost]
          public ActionResult<Receptionist> Create(Receptionist receptionist) { ... }
      }
   
   5. IMPORTANT: Ensure your API returns proper JSON responses and handles CORS correctly
   
   6. For testing, you can use tools like Postman or curl to verify your API endpoints
      before connecting the frontend.
*/