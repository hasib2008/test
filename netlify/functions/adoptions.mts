import type { Config, Context } from "@netlify/functions";
import { and, eq, ne } from "drizzle-orm";
import { db } from "../../db/index.js";
import { adoption, pets } from "../../db/schema.js";

export default async (req: Request, context: Context) => {
  try {
    const id = context.params.id;

    // GET all adoption requests (with a join to fetch pet names)
    if (req.method === "GET" && !id) {
      const rows = await db
        .select({
          Id: adoption.Id,
          PetId: adoption.PetId,
          AnimalName: pets.Name,
          Name: adoption.Name,
          Surname: adoption.Surname,
          City: adoption.City,
          Email: adoption.Email,
          Phone: adoption.Phone,
          Status: adoption.Status,
        })
        .from(adoption)
        .innerJoin(pets, eq(adoption.PetId, pets.PetId));
      return Response.json(rows);
    }

    // POST a new adoption request
    if (req.method === "POST") {
      const { PetId, Name, Surname, City, Email, Phone } = await req.json();
      if (!PetId || !Name || !Surname || !City || !Email || !Phone) {
        return Response.json({ error: "All fields are required." }, { status: 400 });
      }

      const [inserted] = await db
        .insert(adoption)
        .values({ PetId, Name, Surname, City, Email, Phone })
        .returning({ Id: adoption.Id });

      return Response.json({ message: "Adoption request submitted!", Id: inserted.Id }, { status: 201 });
    }

    // PUT update adoption status
    // - Approving: marks the pet unavailable and auto-denies other pending
    //   requests for the same pet, so two people can't end up approved for
    //   one animal.
    // - Changing AWAY from Approved (e.g. Approved -> Denied): reopens the
    //   pet (Available = true) so the Adopt button becomes clickable again.
    if (req.method === "PUT" && id) {
      const { Status } = await req.json();

      const [existing] = await db
        .select({ PetId: adoption.PetId, OldStatus: adoption.Status })
        .from(adoption)
        .where(eq(adoption.Id, Number(id)));

      if (!existing) {
        return Response.json({ message: "Request not found." }, { status: 404 });
      }

      const petId = existing.PetId;
      const oldStatus = existing.OldStatus;

      await db.update(adoption).set({ Status }).where(eq(adoption.Id, Number(id)));

      if (Status === "Approved") {
        await db.update(pets).set({ Available: false }).where(eq(pets.PetId, petId));

        await db
          .update(adoption)
          .set({ Status: "Denied" })
          .where(and(eq(adoption.PetId, petId), ne(adoption.Id, Number(id)), eq(adoption.Status, "Pending")));

        return Response.json({ message: `Request ${id} approved. Pet ${petId} marked as adopted.` });
      }

      if (oldStatus === "Approved" && Status !== "Approved") {
        await db.update(pets).set({ Available: true }).where(eq(pets.PetId, petId));

        return Response.json({
          message: `Request ${id} updated to ${Status}. Pet ${petId} is available for adoption again.`,
        });
      }

      return Response.json({ message: `Request ${id} updated to ${Status}` });
    }

    // DELETE adoption request
    if (req.method === "DELETE" && id) {
      const deleted = await db.delete(adoption).where(eq(adoption.Id, Number(id))).returning({ Id: adoption.Id });
      if (deleted.length === 0) {
        return Response.json({ message: "Request not found." }, { status: 404 });
      }
      return Response.json({ message: "Request deleted successfully." });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
};

export const config: Config = {
  path: ["/api/adoptions", "/api/adoptions/:id"],
};
