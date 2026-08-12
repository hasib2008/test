const { getStore } = require("@netlify/blobs");
const seed = require("../data/seed.json");

function store() {
    return getStore("animal-db");
}

async function getPets() {
    const s = store();
    let pets = await s.get("pets", { type: "json" });
    if (!pets) {
        pets = seed.pets;
        await s.setJSON("pets", pets);
    }
    return pets;
}

async function savePets(pets) {
    await store().setJSON("pets", pets);
}

async function getAdoptions() {
    const s = store();
    let adoptions = await s.get("adoptions", { type: "json" });
    if (!adoptions) {
        adoptions = seed.adoptions;
        await s.setJSON("adoptions", adoptions);
    }
    return adoptions;
}

async function saveAdoptions(adoptions) {
    await store().setJSON("adoptions", adoptions);
}

module.exports = { getPets, savePets, getAdoptions, saveAdoptions };
