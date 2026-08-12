const { getPets, savePets, getAdoptions, saveAdoptions } = require("./_lib/store");

function getId(event) {
    const rest = event.path.replace(/^.*\/pets\/?/, "");
    return rest || null;
}

function json(statusCode, body) {
    return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
    try {
        if (event.httpMethod === "GET") {
            const [pets, adoptions] = await Promise.all([getPets(), getAdoptions()]);
            const withPending = pets.map((p) => ({
                ...p,
                PendingRequest: adoptions.some((a) => a.PetId === p.PetId && a.Status === "Pending") ? 1 : 0,
            }));
            return json(200, withPending);
        }

        if (event.httpMethod === "POST") {
            const { Name, Species, Breed, Age, Gender, Description, PhotoUrl } = JSON.parse(event.body || "{}");
            if (!Name || !Species || !Gender) {
                return json(400, { error: "Name, Species, and Gender are required." });
            }

            const pets = await getPets();
            const existingPet = pets.find((p) => p.Name === Name && p.Species === Species && p.Breed === Breed);
            if (existingPet) {
                return json(409, { error: `${Name} (${Species}, ${Breed}) is already listed.` });
            }

            const PetId = pets.reduce((max, p) => Math.max(max, p.PetId), 0) + 1;
            pets.push({ PetId, Name, Species, Breed, Age, Gender, Description, PhotoUrl, Available: true });
            await savePets(pets);
            return json(201, { message: "Pet added successfully!", PetId });
        }

        if (event.httpMethod === "PUT") {
            const id = Number(getId(event));
            const { Available } = JSON.parse(event.body || "{}");
            const pets = await getPets();
            const pet = pets.find((p) => p.PetId === id);
            if (!pet) return json(404, { message: "Pet not found." });
            pet.Available = Available;
            await savePets(pets);
            return json(200, { message: `Pet ${id} updated.` });
        }

        if (event.httpMethod === "DELETE") {
            const id = Number(getId(event));
            const pets = await getPets();
            const idx = pets.findIndex((p) => p.PetId === id);
            if (idx === -1) return json(404, { message: "Pet not found." });
            pets.splice(idx, 1);
            await savePets(pets);

            const adoptions = await getAdoptions();
            await saveAdoptions(adoptions.filter((a) => a.PetId !== id));

            return json(200, { message: "Pet deleted successfully." });
        }

        return json(405, { error: "Method not allowed" });
    } catch (err) {
        return json(500, { error: err.message });
    }
};
