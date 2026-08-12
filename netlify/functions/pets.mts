import type { Config, Context } from "@netlify/functions";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { adoption, pets } from "../../db/schema.js";

export default async (req: Request, context: Context) => {
  try {
    const id = context.params.id;

    // GET all pets — includes a PendingRequest flag so the frontend can show
    // Adopt / Pending / Adopted correctly
    if (req.method === "GET" && !id) {
      const rows = await db
        .select({
          PetId: pets.PetId,
          Name: pets.Name,
          Species: pets.Species,
          Breed: pets.Breed,
          Age: pets.Age,
          Gender: pets.Gender,
          Description: pets.Description,
          PhotoUrl: pets.PhotoUrl,
          Available: pets.Available,
          PendingRequest: sql<boolean>`EXISTS (
            SELECT 1 FROM adoption WHERE adoption.pet_id = pets.pet_id AND adoption.status = 'Pending'
          )`,
        })
        .from(pets);
      return Response.json(rows);
    }

    // POST add a new pet — rejects exact duplicates (same Name + Species + Breed)
    if (req.method === "POST") {
      const { Name, Species, Breed, Age, Gender, Description, PhotoUrl } = await req.json();
      if (!Name || !Species || !Gender) {
        return Response.json({ error: "Name, Species, and Gender are required." }, { status: 400 });
      }

      const existingPet = await db
        .select({ PetId: pets.PetId })
        .from(pets)
        .where(and(eq(pets.Name, Name), eq(pets.Species, Species), eq(pets.Breed, Breed)));

      if (existingPet.length > 0) {
        return Response.json({ error: `${Name} (${Species}, ${Breed}) is already listed.` }, { status: 409 });
      }

      const [inserted] = await db
        .insert(pets)
        .values({ Name, Species, Breed, Age, Gender, Description, PhotoUrl })
        .returning({ PetId: pets.PetId });

      return Response.json({ message: "Pet added successfully!", PetId: inserted.PetId }, { status: 201 });
    }

    // PUT update a pet (used to mark as adopted/unavailable)
    if (req.method === "PUT" && id) {
      const { Available } = await req.json();
      const updated = await db
        .update(pets)
        .set({ Available })
        .where(eq(pets.PetId, Number(id)))
        .returning({ PetId: pets.PetId });

      if (updated.length === 0) {
        return Response.json({ message: "Pet not found." }, { status: 404 });
      }
      return Response.json({ message: `Pet ${id} updated.` });
    }

    // DELETE a pet — also removes any adoption requests tied to it
    if (req.method === "DELETE" && id) {
      await db.delete(adoption).where(eq(adoption.PetId, Number(id)));
      const deleted = await db.delete(pets).where(eq(pets.PetId, Number(id))).returning({ PetId: pets.PetId });

      if (deleted.length === 0) {
        return Response.json({ message: "Pet not found." }, { status: 404 });
      }
      return Response.json({ message: "Pet deleted successfully." });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
};

export const config: Config = {
  path: ["/api/pets", "/api/pets/:id"],
};
