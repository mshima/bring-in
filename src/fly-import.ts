import path, { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import envPaths from 'env-paths';
import Arborist from '@npmcli/arborist';

// eslint-disable-next-line @typescript-eslint/naming-convention
const { cache: DEFAULT_REPOSITORY_PATH } = envPaths('fly-import');

const defaultConfig: RepositoryConfig = { repositoryPath: DEFAULT_REPOSITORY_PATH };

export type RepositoryConfig = {
  repositoryPath: string;
  arboristConfig?: any;
};

type IntalledPackage = {
  name: string;
  path: string;
  realpath: string;
  pkgid: string;
  version: string;
  packageName: string;
  import: <T = any>() => Promise<T>;
};

type NotIntalledPackage = {
  name: undefined;
  path: undefined;
  realpath: undefined;
  pkgid: string;
  version: undefined;
  packageName: undefined;
  import: <T = any>() => Promise<T>;
};

export type ResultPackage = NotIntalledPackage | IntalledPackage;

/**
 * @private
 */
export class Repository {
  private readonly arboristConfig: any;
  private _arborist?: Arborist;
  private _repositoryPath!: string;
  private nodeModulesPath!: string;
  private _require?: NodeRequire;

  constructor(config: RepositoryConfig) {
    this.repositoryPath = config.repositoryPath;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.arboristConfig = config.arboristConfig;
  }

  get #arborist() {
    if (!this._arborist) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this._arborist = new Arborist({
        global: true,
        path: this.repositoryPath,
        ...this.arboristConfig,
      });
    }

    return this._arborist;
  }

  get #tree() {
    if (!this.#arborist.actualTree) {
      throw new Error('Repository has not been initialized');
    }

    return this.#arborist.actualTree;
  }

  get #require() {
    if (!this._require) {
      this._require = createRequire(pathToFileURL(join(this.nodeModulesPath)).href);
    }

    return this._require;
  }

  /**
   * Repository absolute path (npm --prefix).
   */
  get repositoryPath(): string {
    return this._repositoryPath;
  }

  private set repositoryPath(repositoryPath) {
    this._repositoryPath = path.resolve(repositoryPath);
    this.nodeModulesPath = path.join(this._repositoryPath, 'node_modules');
    this._require = undefined;
    this._arborist = undefined;
  }

  async load() {
    return this.#arborist.loadActual();
  }

  async install(spec: string): Promise<ResultPackage>;
  async install(spec: string[]): Promise<ResultPackage[]>;
  async install(spec: string | string[]): Promise<ResultPackage[] | ResultPackage> {
    const specs = Array.isArray(spec) ? spec : [spec];
    await this.#arborist.reify({ add: specs });
    const installed = this.findSpecs(specs);
    return Array.isArray(spec) ? installed : installed[0];
  }

  async import<T = any>(spec: string): Promise<T> {
    return this.findSpecs([spec])[0].import<T>();
  }

  private async resolve(realpath: string) {
    // Node's import.resolve is experimental and not enabled
    /* c8 ignore next 3 */
    if (import.meta.resolve) {
      return import.meta.resolve(pathToFileURL(realpath).href, pathToFileURL(this.nodeModulesPath).href);
    }

    return pathToFileURL(this.#require.resolve(realpath)).href;
  }

  private findSpecs(specs: string[]): ResultPackage[] {
    const edgesOut = new Map<string, string>();
    for (const edgeOut of this.#tree.edgesOut) {
      // Type is not correct.
      const edge = (edgeOut as any)[1] as Arborist.Edge;
      edgesOut.set(`${edge.name}@${edge.spec}`, edge.name);
    }

    return specs.map(spec => {
      const child = edgesOut.get(spec)!;
      const node = this.#tree.children.get(child) as Arborist.Node;
      if (node) {
        const { realpath } = node;
        return {
          name: node.name,
          path: node.path,
          realpath,
          pkgid: node.pkgid,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          version: (node as any).version,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          packageName: (node as any).packageName,
          import: async <T = any>() => import(await this.resolve(realpath)) as Promise<T>,
        };
      }

      return {
        pkgid: spec,
        async import() {
          throw new Error(`Could not find installed spec ${spec}`);
        },
      };
    });
  }
}

let defaultRepository = new Repository(defaultConfig);

export const resetConfig = () => {
  Object.assign(defaultConfig, { repositoryPath: DEFAULT_REPOSITORY_PATH, arboristConfig: undefined });
  defaultRepository = new Repository(defaultConfig);
};

export const defineConfig = (config: Partial<RepositoryConfig>) => {
  if (config.repositoryPath) {
    defaultConfig.repositoryPath = config.repositoryPath;
  }

  if (config.arboristConfig) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    defaultConfig.arboristConfig = config.arboristConfig;
  }

  defaultRepository = new Repository(defaultConfig);
};

export const getConfig = (): RepositoryConfig => ({ ...defaultConfig });

export const getDefaultRepository = () => defaultRepository;

export const npmInstall = async (specifier: string, options?: RepositoryConfig) => {
  let repo = defaultRepository;
  if (options) {
    repo = new Repository({ ...defaultConfig, ...options });
  }

  return repo.install(specifier);
};

export const flyImport = async <T = any>(specifier: string, options?: RepositoryConfig): Promise<T> => {
  let repo = defaultRepository;
  if (options) {
    repo = new Repository({ ...defaultConfig, ...options });
  }

  await repo.install(specifier);
  return repo.import<T>(specifier);
};
