import type { Feature, LineString } from "geojson";
import type { ConflatedStreet } from "../script/util/types";

export type MissingStreet = Feature<LineString, ConflatedStreet>;
