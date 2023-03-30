import dotenv from 'dotenv';
import { promises } from 'fs';
import path from 'path';

dotenv.config();
const { FIGMA_FILE_KEY, FIGMA_PERSONAL_ACCESS_TOKEN } = process.env;

/*
 * This type does not cover the actual response.
 * This only defines the property types used in this file.
 */
type FigmaStylesResponse = {
  meta: {
    styles: { node_id: string }[];
  };
};

/*
 * This type does not cover the actual response.
 * This only defines the property types used in this file.
 */
type Paint = {
  color: {
    r: number;
    g: number;
    b: number;
    // a (alpha value) is also returned actually.
  };
};

/*
 * This type does not cover the actual response.
 * This only defines the property types used in this file.
 */
type FigmaNodesResponse = {
  nodes: {
    [nodeId: string]: {
      document: {
        id: string;
        name: string;
        fills: Paint[];
      };
    };
  };
};

const fetchFigma = async <T>(path: string): Promise<T> => {
  if (!FIGMA_FILE_KEY) {
    throw Error('Set an environment variable: FIGMA_FILE_KEY');
  }
  if (!FIGMA_PERSONAL_ACCESS_TOKEN) {
    throw Error('Set an environment variable: FIGMA_PERSONAL_ACCESS_TOKEN');
  }
  const response = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_KEY}${path}`, {
    headers: {
      'X-FIGMA-TOKEN': FIGMA_PERSONAL_ACCESS_TOKEN,
    },
  });
  return response.json() as Promise<T>;
};

/**
 * Get a list of styles in a file to get node_id of each style.
 * @see https://www.figma.com/developers/api#get-file-styles-endpoint
 */
const fetchFigmaStyles = () => fetchFigma<FigmaStylesResponse>('/styles');

/**
 * Get nodes of styles to get color values.
 * @see https://www.figma.com/developers/api#get-file-nodes-endpoint
 */
const fetchFigmaNodes = (nodeIds: string[]) => {
  const nodeIdsQuery = nodeIds.join(',');
  return fetchFigma<FigmaNodesResponse>(`/nodes?ids=${nodeIdsQuery}`);
};

// Figma API returns color values as RGB so this function convert RGB to HEX for easy handling as a variable.
const rgbToHex = (r: number, g: number, b: number) => {
  const hr = Math.round(r * 255)
    .toString(16)
    .padStart(2, '0');
  const hg = Math.round(g * 255)
    .toString(16)
    .padStart(2, '0');
  const hb = Math.round(b * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${hr}${hg}${hb}`;
};

/**
 * Export a JSON of primitive colors.
 * Fetch name and value of colors from Figma API and format to be usable with Style Dictionary.
 */
export const generatePrimitiveColors = async () => {
  const {
    meta: { styles },
  } = await fetchFigmaStyles();
  const styleNodeIds = styles.map((style) => style.node_id);
  const { nodes } = await fetchFigmaNodes(styleNodeIds);
  const primitiveColors: {
    [key: string]: {
      value: string;
    };
  } = {};

  Object.values(nodes)
    .sort((a, b) => a.document.name.localeCompare(b.document.name))
    .forEach(({ document }) => {
      const {
        color: { r, g, b },
      } = document.fills[0] as Paint;
      const hexColor = rgbToHex(r, g, b);
      primitiveColors[document.name] = {
        value: hexColor,
      };
    });

  const primitiveColorContent = JSON.stringify({
    color: {
      ...primitiveColors,
    },
  });
  console.info(primitiveColorContent);

  await promises.writeFile(path.resolve(__dirname, '../tokens/color/primitive.json'), primitiveColorContent);
  console.info('DONE');
};
