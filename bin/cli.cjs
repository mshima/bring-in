#!/usr/bin/env node
/* eslint-disable unicorn/prefer-top-level-await */

(async () => {
  const { FlyRepository, getConfig } = await import('../src/fly-import.js');
  const repo = new FlyRepository(getConfig());
  console.log(await repo.install('camelcase3@npm:camelcase@7.0.0'));
  console.log(await repo.load());
  console.log(await repo.import('camelcase3'));
})();
