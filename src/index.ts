import type { FileSink } from 'bun';
import { readdir } from 'node:fs/promises'
import proj4 from 'proj4';

interface GeoJSONFeature {
  type: string;
  properties: Record<string, any>;
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

function createPointWithGoogleCoordinates(feature: GeoJSONFeature): string {
  const { coordinates } = feature.geometry;
  const wgs84Coordinates = convertToGoogleCoordinates(coordinates as number[]);
  return wgs84Coordinates.join(" ");
}

function toWKTPoint(feature: GeoJSONFeature): string {
  return `POINT (${createPointWithGoogleCoordinates(feature)})`;
}

function toWKTPolygon(features: GeoJSONFeature[]): string {
  const points = features.map(feature => createPointWithGoogleCoordinates(feature));
  const polygonPoints = [...points, points[0]];
  return `POLYGON ((${polygonPoints.join(", ")}))`;
}

// Function to convert coordinates from Portuguese coordinate system to WGS84 (Google Maps)
function convertToGoogleCoordinates(ptTm06Coordinates: number[]): number[] {
  const ptTm06Projection = '+proj=tmerc +lat_0=39.6682583333333 +lon_0=-8.13310833333333 +k=1 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
  const wgs84Projection = 'EPSG:4326';
  const wgs84Coordinates = proj4(ptTm06Projection, wgs84Projection, ptTm06Coordinates);
  return wgs84Coordinates;
}

// Function to process GeoJSON file and convert to CSV
async function processGeoJSONFile(inputFilePath: string, writer: FileSink): Promise<void> {
  const inputFile = Bun.file(inputFilePath);
  const geoJson = await inputFile.json();

  const inputFileName = inputFilePath.split("/").pop();
  const fileNameWithoutExtension = inputFileName!.replace(/\.[^/.]+$/, ''); // Remove file extension

  const features: GeoJSONFeature[] = geoJson.features;
  // const wktPoints = features.map(toWKTPoint);

  // wktPoints.forEach((wktPoint, index) => {
  //   const pointTitle = `${fileNameWithoutExtension}__${index + 1}`;
  //   const csvPointLine = `${[wktPoint, pointTitle].join(",")}\n`;
  //   writer.write(csvPointLine);
  // });

  const wktPolygon = toWKTPolygon(features);
  const polygonTitle = fileNameWithoutExtension;
  const csvPolygonLine = `${[`"${wktPolygon}"`, polygonTitle].join(",")}\n`;
  console.log(csvPolygonLine);
  writer.write(csvPolygonLine);
}

// Main function to process multiple GeoJSON files
async function convertGeoJSONFilesToCSV(
  inputFolderPath: string,
  outputFolderPath: string
): Promise<void> {
  const files = await readdir(inputFolderPath);
  const outputFilePath = `${outputFolderPath}/all.csv`;
  const outputFile = Bun.file(outputFilePath);
  const writer = outputFile.writer();
  writer.write('WKT,TITLE\n');

  for (const file of files.sort()) {
    const inputFilePath = `${inputFolderPath}/${file}`;
    console.log(`Processing: ${inputFilePath}`);
    try {
      await processGeoJSONFile(inputFilePath, writer);
      console.log(`Completed: ${inputFilePath}`);
    } catch(err) {
      console.log(`Failed: ${inputFilePath}`);
      console.log(err);
    }
  }
  writer.end();
}

async function run() {
  const inputFolderPath = 'input';
  const outputFolderPath = 'output';
  try {
    await convertGeoJSONFilesToCSV(inputFolderPath, outputFolderPath)
  } catch(error) {
    console.error('Error:', error)
  }
}

run();
