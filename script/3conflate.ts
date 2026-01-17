import { promises as fs } from "fs";
import { FeatureCollection, LineString } from "geojson";
import {
  ConflatedStreet,
  conflationResult,
  distanceBetween,
  ugrcJsonFile,
  UgrcPlanet,
  UgrcStreet,
  OsmPlanet,
  OsmStreet,
  planetJsonFile,
} from "./util";
import { calcBBox } from "./util/calcBbox";

type GeoJsonOutput = FeatureCollection<LineString, ConflatedStreet> & {
  lastUpdated: string;
};

const checkIfMatches = (ugrcStreet: UgrcStreet) => (osmStreet: OsmStreet) => {
  // console.log("comparing", osmStreet, "to", ugrcStreet);
  const namesMatch =
    osmStreet.nameCode === ugrcStreet.nameCode ||
    osmStreet.otherNameCodes?.includes(ugrcStreet.nameCode);

  // higher tolerance for long roads
  const closeEnough =
    distanceBetween(
      osmStreet.lat,
      osmStreet.lng,
      ugrcStreet.lat,
      ugrcStreet.lng
    ) <
    10_000 + 2 * ugrcStreet.streetLength;

  return namesMatch && closeEnough;
};

async function main() {
  console.log("Reading LINZ json...");
  const ugrcDB: UgrcPlanet = JSON.parse(
    await fs.readFile(ugrcJsonFile, "utf8")
  );

  console.log("Reading OSM json...");
  const osmDB: OsmPlanet = JSON.parse(
    await fs.readFile(planetJsonFile, "utf8")
  );

  console.log("Confating...");
  const missing: GeoJsonOutput = {
    type: "FeatureCollection",
    features: [],
    lastUpdated: new Date().toISOString(),
  };

  for (const sector in ugrcDB) {
    const allUgrc = ugrcDB[sector];
    const osmGrouped = osmDB[sector] || {};
    const allOsm = Object.values(osmGrouped).flat();

    for (const [i, ugrcStreet] of allUgrc.entries()) {
      // 1. if we're lucky we can find an exact match within this group
      let possibleOsmMatches = osmGrouped[ugrcStreet.nameCode]?.filter(
        checkIfMatches(ugrcStreet)
      );

      if (!possibleOsmMatches?.length) {
        // 2. If not, we try again by searching thru the full list.
        possibleOsmMatches = allOsm.filter(checkIfMatches(ugrcStreet));
      }

      if (!possibleOsmMatches.length) {
        // 3. If there are still no matches, do a final check if it's a state highway
        // const skip =
        //   ugrcStreet.name.includes("State Highway") ||
        //   ugrcStreet.name.includes("Motorway");

        // if (!skip) {
        // 4. If we get to this point, flag the street as missing
        console.log("found no match for", ugrcStreet.name);
        missing.features.push({
          type: "Feature",
          id: `${sector}_${i}`,
          bbox: calcBBox(ugrcStreet.geometry),
          geometry: ugrcStreet.geometry,
          properties: {
            roadId: ugrcStreet.roadId,
            name: ugrcStreet.name,
          },
        });
        // }
      }
    }
  }

  console.log(`Saving ${missing.features.length} issues...`);
  await fs.writeFile(conflationResult, JSON.stringify(missing, null, 2));
}
main();
