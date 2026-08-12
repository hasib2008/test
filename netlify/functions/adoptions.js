const { getAdoptions, saveAdoptions, getPets, savePets } = require("./_lib/store");

function getId(event) {
    const rest = event.path.replace(/^.*\/adoptions\/?/, "");
    return rest || null;
}

function json(statusCode, body) {
    return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
    try {
        if (event.httpMethod === "GET") {
            const [adoptions, pets] = await Promise.all([getAdoptions(), getPets()]);
            const withNames = adoptions.map((a) => {
                const pet = pets.find((p) => p.PetId === a.PetId);
                return { ...a, AnimalName: pet ? pet.Name : null };
            });
            return json(200, withNames);
        }

        if (event.httpMethod === "POST") {
            const { PetId, Name, Surname, City, Email, Phone } = JSON.parse(event.body || "{}");
            if (!PetId || !Name || !Surname || !City || !Email || !Phone) {
                return json(400, { error: "All fields are required." });
            }
            const adoptions = await getAdoptions();
            const Id = adoptions.reduce((max, a) => Math.max(max, a.Id), 0) + 1;
            adoptions.push({ Id, PetId, Name, Surname, City, Email, Phone, Status: "Pending" });
            await saveAdoptions(adoptions);
            return json(201, { message: "Adoption request submitted!", Id });
        }

        if (event.httpMethod === "PUT") {
            const id = Number(getId(event));
            const { Status } = JSON.parse(event.body || "{}");
            const adoptions = await getAdoptions();
            const request = adoptions.find((a) => a.Id === id);
            if (!request) return json(404, { message: "Request not found." });

            const petId = request.PetId;
            const oldStatus = request.Status;
            request.Status = Status;

            const pets = await getPets();

            if (Status === "Approved") {
                const pet = pets.find((p) => p.PetId === petId);
                if (pet) pet.Available = false;
                adoptions.forEach((a) => {
                    if (a.PetId === petId && a.Id !== id && a.Status === "Pending") a.Status = "Denied";
                });
                await Promise.all([saveAdoptions(adoptions), savePets(pets)]);
                return json(200, { message: `Request ${id} approved. Pet ${petId} marked as adopted.` });
            }

            if (oldStatus === "Approved" && Status !== "Approved") {
                const pet = pets.find((p) => p.PetId === petId);
                if (pet) pet.Available = true;
                await Promise.all([saveAdoptions(adoptions), savePets(pets)]);
                return json(200, { message: `Request ${id} updated to ${Status}. Pet ${petId} is available for adoption again.` });
            }

            await saveAdoptions(adoptions);
            return json(200, { message: `Request ${id} updated to ${Status}` });
        }

        if (event.httpMethod === "DELETE") {
            const id = Number(getId(event));
            const adoptions = await getAdoptions();
            const idx = adoptions.findIndex((a) => a.Id === id);
            if (idx === -1) return json(404, { message: "Request not found." });
            adoptions.splice(idx, 1);
            await saveAdoptions(adoptions);
            return json(200, { message: "Request deleted successfully." });
        }

        return json(405, { error: "Method not allowed" });
    } catch (err) {
        return json(500, { error: err.message });
    }
};
