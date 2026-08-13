const API_URL = "/api/adoptions";
const PETS_URL = "/api/pets";

const ADMIN_PASSWORD ="admin123";

let allPets = []; // holds the full pet list so we can filter it client-side

document.addEventListener("DOMContentLoaded", () => {

    // Admin Login Handling: only runs if we're on admin.html
    const loginScreen = document.getElementById("login-screen");
    const adminContent = document.getElementById("admin-content");
    const loginForm = document.getElementById("login-form");

    if (loginScreen && adminContent && loginForm) {
        // If already logged in this session, skip straight to the dashboard
        if (sessionStorage.getItem("isAdminAuthenticated") === "true") {
            loginScreen.style.display = "none";
            adminContent.style.display = "block";
        }

        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const enteredPassword = document.getElementById("admin-password").value;
            const loginError = document.getElementById("login-error");

            if (enteredPassword === ADMIN_PASSWORD) {
                sessionStorage.setItem("isAdminAuthenticated", "true");
                loginScreen.style.display = "none";
                adminContent.style.display = "block";
                if (loginError) loginError.style.display = "none";
            } else {
                if (loginError) loginError.style.display = "block";
            }
        });

        const logoutLink = document.getElementById("logout-link");
        if (logoutLink) {
            logoutLink.addEventListener("click", (e) => {
                e.preventDefault();
                sessionStorage.removeItem("isAdminAuthenticated");
                window.location.reload();
            });
        }
    }

    // Only load admin requests table rows if we are on admin.html
    if (document.getElementById("requests-table-body")) {
        loadRequests();
    }

    // Only load the admin "Manage Pets" table if we are on admin.html
    if (document.getElementById("pets-table-body")) {
        loadAdminPets();
    }

    // Only load the grid cards if we are on index.html
    if (document.getElementById("pets-container")) {
        loadPets();
    }

    // Species dropdown filter on index.html
    const speciesSearch = document.getElementById("species-search");
    if (speciesSearch) {
        speciesSearch.addEventListener("change", () => {
            const selectedSpecies = speciesSearch.value;

            if (!selectedSpecies) {
                renderPets(allPets);
                return;
            }

            const filtered = allPets.filter(pet => pet.Species === selectedSpecies);
            renderPets(filtered);
        });
    }

    // Handle dynamic pet details filling on AdoptionForm.html
    const animalNameField = document.getElementById("ANIMALNAME");
    if (animalNameField) {
        const urlParams = new URLSearchParams(window.location.search);
        const petIdFromUrl = urlParams.get('petId');

        if (petIdFromUrl) {
            // Save the selected ID into our hidden input field
            const petIdInput = document.getElementById("PETID");
            if (petIdInput) petIdInput.value = petIdFromUrl;

            // Fetch the pet list to match the ID and grab their string name cleanly
            fetch(PETS_URL)
                .then(res => res.json())
                .then(petsArray => {
                    console.log("Database records received from server:", petsArray);

                    // Case-insensitive database row matching checks
                    const clickedPet = petsArray.find(pet => {
                        const currentId = pet.PetId || pet.petId || pet.PETID;
                        return currentId == petIdFromUrl;
                    });

                    if (clickedPet) {
                        animalNameField.value = clickedPet.Name || clickedPet.name;
                    } else {
                        console.error(`Could not find an animal matching database reference key number ${petIdFromUrl}`);
                    }
                })
                .catch(err => console.error("Error auto-fetching pet details:", err));
        }
    }

    // Handles the adoption form submission safely inside the load window
    const adoptionForm = document.getElementById("adoption-form");
    if (adoptionForm) {
        adoptionForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Pull properties from input fields
            const PetId = document.getElementById("PETID").value.trim();
            const Name = document.getElementById("NAME").value.trim();
            const Surname = document.getElementById("SURNAME").value.trim();
            const City = document.getElementById("CITY").value.trim();
            const Email = document.getElementById("EMAIL").value.trim();
            const Phone = document.getElementById("PHONE").value.trim();

            if (!PetId || !Name || !Surname || !City || !Email || !Phone) {
                alert("Please fill in all adoption details.");
                return;
            }

            try {
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ PetId, Name, Surname, City, Email, Phone })
                });

                const result = await response.json();

                if (!response.ok) {
                    console.error("Error adding request:", result);
                    alert(`Error: ${result.message || result.error || 'Unknown error'}`);
                    return;
                }

                console.log("Request added successfully:", result);
                alert(result.message || "Adoption request submitted!");
                adoptionForm.reset();
                window.location.href = "index.html";
            } catch (error) {
                console.error("Network or parsing error:", error);
                alert("1. A network error occurred. Check console for details.");
            }
        });
    }

    // Handles uploading a new pet directly from admin.html form fields
    const petForm = document.getElementById("pet-upload-form");
    if (petForm) {
        petForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const fileInput = document.getElementById("pet-photo");

            const convertFileToBase64 = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (error) => reject(error);
                });
            };

            let PhotoUrl = "images/FaviconPawprint.png";

            try {
                if (fileInput && fileInput.files.length > 0) {
                    PhotoUrl = await convertFileToBase64(fileInput.files[0]);
                }

                const Name = document.getElementById("pet-name").value.trim();
                const Species = document.getElementById("pet-species").value;
                const Breed = document.getElementById("pet-breed").value.trim();
                const Age = parseInt(document.getElementById("pet-age").value) || 0;
                const Gender = document.getElementById("pet-gender").value;
                const Description = document.getElementById("pet-description").value.trim();

                const response = await fetch(PETS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ Name, Species, Breed, Age, Gender, Description, PhotoUrl })
                });

                const result = await response.json();

                if (!response.ok) {
                    // Covers the duplicate-pet 409 response as well as other errors
                    alert(`Upload Error: ${result.error || 'Unknown error occurred'}`);
                    return;
                }

                alert("Success! The new pet profile has been added and published onto your public home page!");

                petForm.reset();

                if (document.getElementById("requests-table-body")) {
                    loadRequests();
                }
                if (document.getElementById("pets-table-body")) {
                    loadAdminPets();
                }

            } catch (err) {
                console.error("Failed uploading pet profile record:", err);
                alert("Could not upload pet profile. Make sure your server is running.");
            }
        });
    }
});

async function loadRequests() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error fetching requests:", errorData);
            alert(`Error loading requests: ${errorData.message || errorData.error || 'Unknown error'}`);
            return;
        }

        const requests = await response.json();
        const tbody = document.getElementById("requests-table-body");

        if (!tbody) return;
        tbody.innerHTML = "";

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9">No adoption requests found.</td></tr>';
            return;
        }

        requests.forEach(req => {
            const row = document.createElement("tr");
            row.innerHTML = `
            <td>${req.Id}</td>
            <td>${req.AnimalName}</td> 
            <td>${req.Name}</td>
            <td>${req.Surname}</td>
            <td>${req.City}</td>
            <td>${req.Email}</td>
            <td>${req.Phone}</td>
            <td>${req.Status}</td>
            <td>
                <button class="approve" onclick="updateRequest(${req.Id}, 'Approved')">Approve</button>
                <button class="deny" onclick="updateRequest(${req.Id}, 'Denied')">Deny</button>
                <button class="delete" onclick="deleteRequest(${req.Id})">Delete</button>
            </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching requests:", error);
        alert("2. A network error occurred. Please check console for details.");
    }
}

async function updateRequest(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Status: newStatus })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error(`Error updating request ID ${id}:`, result);
            alert(`Error updating request: ${result.message || result.error || 'Unknown error'}`);
            return;
        }

        alert(result.message || `Request ${id} updated to ${newStatus}`);
        loadRequests();
        // The pet's availability may have changed (approved, or reverted from approved) - refresh the pets table too
        if (document.getElementById("pets-table-body")) {
            loadAdminPets();
        }
    } catch (error) {
        console.error(`Error updating request ID ${id}`, error);
        alert("3. A network error occurred. Please check console for details.");
    }
}

async function deleteRequest(id) {
    if (!confirm(`Are you sure you want to delete request ID ${id}`)) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        const result = await response.json();

        if (!response.ok) {
            console.error(`Error deleting request ID ${id}`, result);
            alert(`Error deleting request: ${result.message || result.error || 'Unknown error'}`);
            return;
        }

        console.log("Request deleted:", result);
        alert(result.message || `Request ${id} deleted`);
        loadRequests();
    } catch (error) {
        console.error(`Error deleting request ID ${id}`, error);
        alert("4. A network error occurred. Please check console for details.");
    }
}

// Loads the "Manage Pets" table on admin.html and wires up Delete buttons
async function loadAdminPets() {
    try {
        const response = await fetch(PETS_URL);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error loading pets:", errorData);
            return;
        }

        const pets = await response.json();
        const tbody = document.getElementById("pets-table-body");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (pets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No pets found.</td></tr>';
            return;
        }

        pets.forEach(pet => {
            let statusLabel;
            if (!pet.Available) {
                statusLabel = "Adopted";
            } else if (pet.PendingRequest) {
                statusLabel = "Pending Request";
            } else {
                statusLabel = "Available";
            }

            const row = document.createElement("tr");
            row.innerHTML = `
            <td><img src="${pet.PhotoUrl}" alt="${pet.Name}" class="admin-pet-thumb"></td>
            <td>${pet.Name}</td>
            <td>${pet.Species}</td>
            <td>${pet.Breed}</td>
            <td>${pet.Age}</td>
            <td>${pet.Gender}</td>
            <td>${statusLabel}</td>
            <td><button class="delete" onclick="deletePet(${pet.PetId})">Delete</button></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching pets for admin table:", error);
    }
}

async function deletePet(id) {
    if (!confirm("Are you sure you want to delete this pet? This will also remove any adoption requests linked to it.")) return;

    try {
        const response = await fetch(`${PETS_URL}/${id}`, { method: "DELETE" });
        const result = await response.json();

        if (!response.ok) {
            console.error(`Error deleting pet ID ${id}`, result);
            alert(`Error deleting pet: ${result.message || result.error || 'Unknown error'}`);
            return;
        }

        alert(result.message || `Pet ${id} deleted`);
        loadAdminPets();
        if (document.getElementById("requests-table-body")) {
            loadRequests();
        }
    } catch (error) {
        console.error(`Error deleting pet ID ${id}`, error);
        alert("6. A network error occurred. Please check console for details.");
    }
}

async function loadPets() {
    try {
        const response = await fetch(PETS_URL);
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error loading pets:", errorData);
            alert(`Error loading pets: ${errorData.message || errorData.error || 'Unknown error'}`);
            return;
        }

        allPets = await response.json();
        renderPets(allPets);
    } catch (error) {
        console.error("Error fetching pets:", error);
        alert("5. A network error occurred. Please check console.");
    }
}

// Builds the pet cards for whatever array of pets is passed in
// (used both for the initial full list and for filtered dropdown results)
// Button states:
//  - Not Available (adopted)               -> "Adopted" label
//  - Available but has a Pending request    -> disabled "Pending" button
//  - Available with no pending request      -> clickable "Adopt" button
function renderPets(pets) {
    const container = document.getElementById("pets-container");
    if (!container) return;
    container.innerHTML = "";

    if (pets.length === 0) {
        container.innerHTML = "<p>No animals found for that species.</p>";
        return;
    }

    pets.forEach(pet => {
        const card = document.createElement("div");
        card.className = "pet-card";

        let actionHtml;
        if (!pet.Available) {
            actionHtml = `<span class="adopted-label">Adopted 🎉</span>`;
        } else if (pet.PendingRequest) {
            actionHtml = `<button class="pending-btn" disabled>Pending</button>`;
        } else {
            actionHtml = `<a href="AdoptionForm.html?petId=${pet.PetId}"><button>Adopt</button></a>`;
        }

        card.innerHTML = `
        <img src="${pet.PhotoUrl}" alt="${pet.Name}">
        <h3>${pet.Name}</h3>
        <p>${pet.Species} - ${pet.Gender}, Age ${pet.Age}</p>
        <p>${pet.Description}</p>
        ${actionHtml}
        `;
        container.appendChild(card);
    });
}