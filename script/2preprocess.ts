/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable no-continue */
import { promises as fs } from "fs";
import pbf2json, { Item } from "pbf2json";
import through from "through2";
import { Geometry, Position } from "geojson";
import {
  distanceBetween,
  getNameCode,
  getSector,
  ugrcJsonFile,
  UgrcPlanet,
  ugrcRawFile,
  UgrcStreet,
  OsmPlanet,
  OsmStreet,
  planetJsonFile,
  planetRawFile,
  normalizeStreetName,
} from "./util";

// baseline is 70 seconds
async function readFromPlanet(): Promise<OsmPlanet> {
  return new Promise((resolve, reject) => {
    console.log("Reading OSM Planet...");
    const out: OsmPlanet = {};
    let i = 0;

    pbf2json
      .createReadStream({
        file: planetRawFile,
        tags: ["highway"],
        leveldb: "/tmp",
      })
      .pipe(
        through.obj((item: Item, _e, next) => {
          i += 1;
          if (!(i % 100)) process.stdout.write(".");

          const {
            name,
            old_name,
            alt_name,
            official_name,
            "not:name": not_name,
          } = item.tags || {};

          // it's possible that a road has no name, but does have an old_name
          const mainName = name || alt_name || old_name || not_name;

          if (item.type === "node" || !mainName) {
            next();
            return;
          }

          const sector = getSector(item.centroid.lat, item.centroid.lon);
          const nameCode = getNameCode(mainName);

          const otherNames: string[] = [];
          if (old_name) otherNames.push(...old_name.split(";"));
          if (alt_name) otherNames.push(...alt_name.split(";"));
          if (official_name) otherNames.push(...official_name.split(";"));
          if (not_name) otherNames.push(...not_name.split(";"));

          const street: OsmStreet = {
            wayId: item.id,
            name: mainName,
            nameCode,
            lat: item.centroid.lat,
            lng: item.centroid.lon,
          };

          if (otherNames.length) {
            street.otherNameCodes = otherNames.map(getNameCode);
          }

          out[sector] ||= {};
          out[sector][nameCode] ||= [];
          out[sector][nameCode].push(street);

          next();
        })
      )
      .on("finish", () => {
        console.log("Finished OSM planet");
        resolve(out);
      })
      .on("error", reject);
  });
}

function getEnds(geometry: Geometry): [Position, Position] | [null, null] {
  if (geometry.type === "LineString") {
    return [
      geometry.coordinates[0],
      geometry.coordinates[geometry.coordinates.length - 1],
    ];
  }
  if (geometry.type === "MultiLineString") {
    // assuming the members are ordered logically
    const x = geometry.coordinates[geometry.coordinates.length - 1];
    return [geometry.coordinates[0][0], x[x.length - 1]];
  }
  return [null, null];
}

async function readFromUgrc(): Promise<UgrcPlanet> {
  console.log("Reading UGRC geojson...");
  const data = await fs.readFile(ugrcRawFile, "utf8");
  const geojson = JSON.parse(data);
  const out: UgrcPlanet = {};

  for (const feature of geojson.features) {
    const { geometry } = feature;
    const props = feature.properties || {};
    const rawName = props.FULLNAME || props.NAME || null;
    const name = rawName ? normalizeStreetName(rawName) : null;

    if (!name || !geometry) continue;

    if (geometry.type !== "LineString") {
      console.warn("Unexpected geometry type", geometry.type);
      continue;
    }

    const [first, last] = getEnds(geometry);
    if (!first || !last) continue;

    const [firstLng, firstLat] = first;
    const [lastLng, lastLat] = last;

    const [firstSector, lastSector] = [
      getSector(firstLat, firstLng),
      getSector(lastLat, lastLng),
    ];

    if (firstSector !== lastSector) continue; // skip long lines

    // console.log("Translated", getNameCode(name), "in sector", firstSector);
    const sector = firstSector;
    const street: UgrcStreet = {
      roadId: +props.OBJECTID,
      name,
      nameCode: getNameCode(name),
      streetLength: distanceBetween(firstLat, firstLng, lastLat, lastLng),
      geometry,
      lat: firstLat,
      lng: firstLng,
    };

    out[sector] ||= [];
    out[sector].push(street);
  }

  console.log("Finished reading UGRC GeoJSON");
  return out;
}

async function main() {
  const ugrcList = await readFromUgrc();
  await fs.writeFile(ugrcJsonFile, JSON.stringify(ugrcList, null, 2));

  const osmPlanet = await readFromPlanet();
  await fs.writeFile(planetJsonFile, JSON.stringify(osmPlanet, null, 2));
}

main();
