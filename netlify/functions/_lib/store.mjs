import { getStore } from "@netlify/blobs";
import seed from "../data/seed.json" with { type: "json" };

function store() {
    return getStore("animal-db");
}

export async function getPets() {
    const s = store();
    let pets = await s.get("pets", { type: "json" });
    if (!pets) {
        pets = seed.pets;
        await s.setJSON("pets", pets);
    }
    return pets;
}

export async function savePets(pets) {
    await store().setJSON("pets", pets);
}

export async function getAdoptions() {
    const s = store();
    let adoptions = await s.get("adoptions", { type: "json" });
    if (!adoptions) {
        adoptions = seed.adoptions;
        await s.setJSON("adoptions", adoptions);
    }
    return adoptions;
}

export async function saveAdoptions(adoptions) {
    await store().setJSON("adoptions", adoptions);
}
