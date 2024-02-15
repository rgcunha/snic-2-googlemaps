import proj4 from "proj4"
import fs from "fs"
import { createObjectCsvWriter } from 'csv-writer';


//proj4.defs("EPSG:3763","+proj=tmerc +lat_0=39.6682583333333 +lon_0=-8.13310833333333 +k=1 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
// const ptTm06Projection = '+proj=tmerc +lat_0=39.66825833333333 +lon_0=-8 +k=1 +x_0=0 +y_0=0 +ellps=GRS80 +units=m +no_defs';
const ptTm06Projection = '+proj=tmerc +lat_0=39.6682583333333 +lon_0=-8.13310833333333 +k=1 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
const wgs84Projection = 'EPSG:4326';
//const ptTm06Projection = 'EPSG:3673';

const ptTm06Coordinates = [88033.094, 66568.929]; // => WORKS
//const ptTm06Coordinates = [66568.929, 88033.094];


// Perform the coordinate transformation
const wgs84Coordinates = proj4(ptTm06Projection, wgs84Projection, ptTm06Coordinates);

console.log('WGS 84 Coordinates:', wgs84Coordinates);


// Read GeoJSON file with PT-TM06 coordinates
const geojsonFilePath = 'ponte da pedra-122.geojson';
const geojsonString = fs.readFileSync(geojsonFilePath, 'utf-8');
const geojsonData = JSON.parse(geojsonString);

// Perform coordinate transformation for each feature
geojsonData.features.forEach((feature) => {
  const coordinates = feature.geometry.coordinates;

  // Convert PT-TM06 to WGS 84
  const wgs84Coordinates = proj4(ptTm06Projection, wgs84Projection, coordinates);

  // Update the feature with WGS 84 coordinates
  feature.geometry.coordinates = wgs84Coordinates;
});

// Write the result to a new GeoJSON file
const outputFilePath = 'output.geojson';
fs.writeFileSync(outputFilePath, JSON.stringify(geojsonData, null, 2), 'utf-8');

console.log('Conversion complete. WGS 84 GeoJSON file written to:', outputFilePath);

// CSV Conversion
const csvFile = 'output.csv';

// Read GeoJSON file
// const geojsonData = JSON.parse(fs.readFileSync(geojsonFile, 'utf-8'));

// Extract features and format for CSV
const csvData = geojsonData.features.map(feature => {
  const coordinates = feature.geometry.coordinates;
  const properties = feature.properties || {};
  return {
    name: `Meimao_${properties.id_point || ''}`,
    latitude: coordinates[1],
    longitude: coordinates[0]
  };
});

// Create CSV file
const csvWriter = createObjectCsvWriter({
  path: csvFile,
  header: [
    { id: 'name', title: 'name' },
    { id: 'latitude', title: 'latitude' },
    { id: 'longitude', title: 'longitude' }
  ]
});

csvWriter.writeRecords(csvData)
  .then(() => console.log(`CSV file ${csvFile} written successfully`))
  .catch(error => console.error('Error writing CSV file:', error));