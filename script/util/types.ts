import { LineString } from "geojson";

export type BaseStreet = {
  name: string;
  nameCode: string;
  lat: number;
  lng: number;
};
export type OsmStreet = BaseStreet & {
  wayId: number;
  otherNameCodes?: string[];
};

export type OsmPlanet = {
  [sector: string]: {
    [nameCode: string]: OsmStreet[];
  };
};

export type UgrcStreet = BaseStreet & {
  roadId: number;
  geometry: LineString;
  streetLength: number;
};

export type UgrcPlanet = {
  [sector: string]: UgrcStreet[];
};

export type Coord = [lng: number, lat: number];

/** the final output that gets published */
export type ConflatedStreet = {
  roadId: number;
  name: string;
};
