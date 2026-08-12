const sqlite3 = require("sqlite3").verbose();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
// Set the maximum limit to 50mb to handle high-resolution image text strings safely
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = 3000;

// Connect to SQLite database
const db = new sqlite3.Database("./animal.db", (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
        return;
    }
    console.log("Connected to SQLite database.");

    // Create Pets table
    db.run(`
        CREATE TABLE IF NOT EXISTS Pets (
            PetId INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL,
            Species TEXT NOT NULL,
            Breed TEXT,
            Age INTEGER,
            Gender TEXT,
            Description TEXT,
            PhotoUrl TEXT,
            Available BOOLEAN DEFAULT 1
        )
    `);

    // Create Adoption table
    db.run(`
        CREATE TABLE IF NOT EXISTS Adoption (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            PetId INTEGER NOT NULL,
            Name TEXT NOT NULL,
            Surname TEXT NOT NULL,
            City TEXT NOT NULL,
            Email TEXT NOT NULL,
            Phone TEXT NOT NULL,
            Status TEXT DEFAULT 'Pending',
            FOREIGN KEY (PetId) REFERENCES Pets(PetId)
        )
    `);
});

// GET all pets — includes a PendingRequest flag so the frontend can show
// Adopt / Pending / Adopted correctly
app.get("/api/pets", (req, res) => {
    const query = `
        SELECT P.*,
            CASE WHEN EXISTS (
                SELECT 1 FROM Adoption A WHERE A.PetId = P.PetId AND A.Status = 'Pending'
            ) THEN 1 ELSE 0 END AS PendingRequest
        FROM Pets P
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST add a new pet — rejects exact duplicates (same Name + Species + Breed)
app.post("/api/pets", (req, res) => {
    const { Name, Species, Breed, Age, Gender, Description, PhotoUrl } = req.body;
    if (!Name || !Species || !Gender) {
        return res.status(400).json({ error: "Name, Species, and Gender are required." });
    }

    db.get(
        "SELECT PetId FROM Pets WHERE Name = ? AND Species = ? AND Breed = ?",
        [Name, Species, Breed],
        (err, existingPet) => {
            if (err) return res.status(500).json({ error: err.message });

            if (existingPet) {
                return res.status(409).json({ error: `${Name} (${Species}, ${Breed}) is already listed.` });
            }

            const query = `INSERT INTO Pets (Name, Species, Breed, Age, Gender, Description, PhotoUrl) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.run(query, [Name, Species, Breed, Age, Gender, Description, PhotoUrl], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ message: "Pet added successfully!", PetId: this.lastID });
            });
        }
    );
});

// PUT update a pet (used to mark as adopted/unavailable)
app.put("/api/pets/:id", (req, res) => {
    const { id } = req.params;
    const { Available } = req.body;
    db.run("UPDATE Pets SET Available = ? WHERE PetId = ?", [Available, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Pet not found." });
        res.json({ message: `Pet ${id} updated.` });
    });
});

// DELETE a pet — also removes any adoption requests tied to it
app.delete("/api/pets/:id", (req, res) => {
    const { id } = req.params;

    db.run("DELETE FROM Adoption WHERE PetId = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        db.run("DELETE FROM Pets WHERE PetId = ?", [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ message: "Pet not found." });
            res.json({ message: "Pet deleted successfully." });
        });
    });
});

// GET all adoption requests (With INNER JOIN to fetch pet names)
app.get("/api/adoptions", (req, res) => {
    const query = `
        SELECT
            A.Id,
            A.PetId,
            P.Name AS AnimalName,
            A.Name,
            A.Surname,
            A.City,
            A.Email,
            A.Phone,
            A.Status
        FROM Adoption A
        INNER JOIN Pets P ON A.PetId = P.PetId
        `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST a new adoption request
app.post("/api/adoptions", (req, res) => {
    const { PetId, Name, Surname, City, Email, Phone } = req.body;
    if (!PetId || !Name || !Surname || !City || !Email || !Phone) {
        return res.status(400).json({ error: "All fields are required." });
    }
    const query = `INSERT INTO Adoption (PetId, Name, Surname, City, Email, Phone) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [PetId, Name, Surname, City, Email, Phone], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Adoption request submitted!", Id: this.lastID });
    });
});

// PUT update adoption status
// - Approving: marks the pet unavailable and auto-denies other pending
//   requests for the same pet, so two people can't end up approved for
//   one animal.
// - Changing AWAY from Approved (e.g. Approved -> Denied): reopens the
//   pet (Available = 1) so the Adopt button becomes clickable again.
app.put("/api/adoptions/:id", (req, res) => {
    const { id } = req.params;
    const { Status } = req.body;

    db.get("SELECT PetId, Status AS OldStatus FROM Adoption WHERE Id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: "Request not found." });

        const petId = row.PetId;
        const oldStatus = row.OldStatus;

        db.run("UPDATE Adoption SET Status = ? WHERE Id = ?", [Status, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            if (Status === "Approved") {
                // Mark the pet as no longer available
                db.run("UPDATE Pets SET Available = 0 WHERE PetId = ?", [petId], (err) => {
                    if (err) console.error("Failed to mark pet as adopted:", err.message);
                });

                // Auto-deny any other pending requests for the same pet
                db.run(
                    "UPDATE Adoption SET Status = 'Denied' WHERE PetId = ? AND Id != ? AND Status = 'Pending'",
                    [petId, id],
                    (err) => {
                        if (err) console.error("Failed to auto-deny other requests:", err.message);
                    }
                );

                return res.json({ message: `Request ${id} approved. Pet ${petId} marked as adopted.` });
            }

            // If this request WAS Approved and is now being changed to something
            // else (e.g. Denied), reopen the pet for adoption
            if (oldStatus === "Approved" && Status !== "Approved") {
                db.run("UPDATE Pets SET Available = 1 WHERE PetId = ?", [petId], (err) => {
                    if (err) console.error("Failed to reopen pet availability:", err.message);
                });

                return res.json({ message: `Request ${id} updated to ${Status}. Pet ${petId} is available for adoption again.` });
            }

            res.json({ message: `Request ${id} updated to ${Status}` });
        });
    });
});

// DELETE adoption request
app.delete("/api/adoptions/:id", (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM Adoption WHERE Id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Request not found." });
        res.json({ message: "Request deleted successfully." });
    });
});

app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});