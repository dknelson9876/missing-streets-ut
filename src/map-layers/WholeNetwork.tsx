import { Polyline, Popup } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import type { MissingStreet } from "../types";

// TODO: this previously queried the LINZ api to show all roads on command
// instead this should be updated to load UGRC streets from the processed UGRC JSON

export const WholeNetwork: React.FC<{
  missingStreets: MissingStreet[];
  hidden: boolean;
}> = ({ missingStreets, hidden }) => {
  if (hidden) return null;
  console.log("rendering", missingStreets.length, "streets");
  return (
    <>
      {missingStreets.map((street) => {
        const { geometry, properties } = street;
        const { roadId, name } = properties;

        if (geometry.type !== "LineString") {
          console.warn("Unsupported geometry type:", geometry.type);
          return null;
        }
        const coords = geometry.coordinates.map(
          ([lng, lat]) => [lat, lng] as LatLngTuple
        );

        return (
          <Polyline
            key={roadId}
            positions={coords}
            color="red"
            weight={8}
            pane="overlayPane"
          >
            <Popup>
              <span className="popup-text">{name}</span>
            </Popup>
          </Polyline>
        );
      })}
    </>
  );
};
