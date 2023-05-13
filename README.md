# fly-import

Install and import packages on-the-fly

## Usage

Supports many different specifications.

```js
import { flyImport } from 'fly-import';

const { flyImport: flyImport2 } = await flyImport('fly-import@0.1.2');

const { flyInstall } = await 'fly-import2@npm:fly-import@0.1.2';

console.log(await flyInstall('fly-import3@github:mshima/fly-import#v0.1.2'));
```

## License

MIT
