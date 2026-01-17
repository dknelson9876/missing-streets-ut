mkdir -p tmp
cd tmp
rm -rf osm.pbf

PLANET_URL="https://download.geofabrik.de/north-america/us/utah-latest.osm.pbf"

curl -L $PLANET_URL --output osm.pbf
