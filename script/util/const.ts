import { join } from "path";

export const planetRawFile = join(__dirname, "../../tmp/osm.pbf");
export const planetJsonFile = join(__dirname, "../../tmp/osm.json");

export const ugrcRawFile = join(__dirname, "../../tmp/ugrc.geojson");
export const ugrcJsonFile = join(__dirname, "../../tmp/ugrc.json");

export const conflationResult = join(
  __dirname,
  "../../public/conflationResult.geo.json"
);
