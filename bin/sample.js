import { flyImport } from 'fly-import';

const { flyImport: flyImport2 } = await flyImport('fly-import@0.1.3');

console.log('fly-import@0.1.3 installed');

const { flyInstall } = await flyImport2('fly-import2@npm:fly-import@0.1.3');

console.log('fly-import2@npm:fly-import@0.1.3 installed');

console.log(await flyInstall('fly-import3@github:mshima/fly-import#v0.1.3'));
