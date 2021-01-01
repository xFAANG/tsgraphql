import * as fs from 'fs';
import * as path from 'path';
import yargs from 'yargs';
import { getCompilerOptions, processFile } from './processFile';
const { hideBin } = require('yargs/helpers');

export { getSchemaForCode } from './getSchemaForCode';
export { gql } from './gql';
export * from './types';

yargs(hideBin(process.argv)).command<{ filePath: string }>(
  'module <filePath>',
  'prepares the module for graphql',
  () => {},
  ({ filePath }) => {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    const { rootDir, outDir } = getCompilerOptions();
    if (!rootDir) {
      throw new Error('Your tsconfig file must specify rootDir');
    }
    if (!outDir) {
      throw new Error('Your tsconfig file must specify outDir');
    }

    const relativePath = path.relative(rootDir, fullPath);
    if (relativePath.startsWith('..')) {
      throw new Error(
        `Specified file ${fullPath} is not under the rootDir ${rootDir}`
      );
    }

    // TODO
    // each file that contains definitions used by the modules should
    // include its own .graphql.json file for easier merges

    const outFilePath = path.join(outDir, relativePath);
    const jsonFilePath = path.format({
      ...path.parse(outFilePath),
      base: undefined,
      ext: '.graphql.json',
    });

    updateJsonFile();

    // enter watch mode
    fs.watch(fullPath, () => {
      console.log(`Change to ${fullPath} detected.`);
      updateJsonFile();
    });

    function updateJsonFile() {
      const declarations = processFile(fullPath);
      fs.writeFileSync(
        jsonFilePath,
        JSON.stringify(declarations, undefined, 4)
      );
      console.log(`Data written to file ${jsonFilePath}`);
    }
  }
).argv;
