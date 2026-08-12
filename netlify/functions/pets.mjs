import { getPets, savePets, getAdoptions, saveAdoptions } from "./_lib/store.mjs";

function json(status, body) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function getId(req) {
    const parts = new URL(req.url).pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    return last === "pets" ? null : last;
}

export default async (req) => {
    try {
        if (req.method === "GET") {
            const [pets, adoptions] = await Promise.all([getPets(), getAdoptions()]);
            const withPending = pets.map((p) => ({
                ...p,
                PendingRequest: adoptions.some((a) => a.PetId === p.PetId && a.Status === "Pending") ? 1 : 0,
            }));
            return json(200, withPending);
        }

        if (req.method === "POST") {
            const { Name, Species, Breed, Age, Gender, Description, PhotoUrl } = await req.json();
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

        if (req.method === "PUT") {
            const id = Number(getId(req));
            const { Available } = await req.json();
            const pets = await getPets();
            const pet = pets.find((p) => p.PetId === id);
            if (!pet) return json(404, { message: "Pet not found." });
            pet.Available = Available;
            await savePets(pets);
            return json(200, { message: `Pet ${id} updated.` });
        }

        if (req.method === "DELETE") {
            const id = Number(getId(req));
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

export const config = { path: ["/api/pets", "/api/pets/:id"] };
