import { generatePrimitiveColors } from './generate-primitive-colors';

const main = async () => {
  await generatePrimitiveColors();
};

main().catch((error) => console.error(error));
