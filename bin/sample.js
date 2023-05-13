import { flyImport } from 'fly-import';

const { flyImport: flyImport2 } = await flyImport('fly-import@0.1.0');

const { flyInstall } = await flyImport2('fly-import2@npm:fly-import@0.1.0');

console.log(await flyInstall('fly-import3@github:mshima/fly-import#v0.1.0'));
