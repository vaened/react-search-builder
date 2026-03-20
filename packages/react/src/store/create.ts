/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { empty, url } from "../persistence";
import { PersistenceAdapter } from "../persistence/PersistenceAdapter";
import { FieldValidator } from "../validations/FieldValidator";
import { SearchBuilderFieldValidator } from "../validations/SearchBuilderFieldValidator";
import { ErrorManager } from "./ErrorManager";
import { createEventEmitter, EventEmitter } from "./event-emitter";
import { FieldStore } from "./FieldStore";
import { TaskMonitor } from "./TaskMonitor";

export type FieldStoreConfig = {
  persistence?: PersistenceAdapter;
  validator?: FieldValidator;
  emitter?: EventEmitter;
};

export type CreateStoreConfigResolver = () => FieldStoreConfig;
export type CreateStoreQuickOptions = { persistInUrl: boolean };
export type CreateStoreOptions = FieldStoreConfig | CreateStoreQuickOptions | CreateStoreConfigResolver;

export function createFieldStore(options: CreateStoreQuickOptions): FieldStore;
export function createFieldStore(config: FieldStoreConfig): FieldStore;
export function createFieldStore(resolver: CreateStoreConfigResolver): FieldStore;
export function createFieldStore(arg: CreateStoreOptions | undefined): FieldStore;
export function createFieldStore(): FieldStore;

export function createFieldStore(args: CreateStoreOptions | undefined = undefined): FieldStore {
  return create(resolveCreateStoreConfig(args));
}

export function resolveCreateStoreConfig(args: CreateStoreOptions | undefined = undefined): FieldStoreConfig | undefined {
  if (args === undefined) {
    return undefined;
  }

  if (isResolverFunction(args)) {
    return args();
  }

  if (isQuickStoreOptions(args)) {
    return { persistence: args.persistInUrl ? url() : empty() };
  }

  return args;
}

export function resolveCreateStoreConfigWithDefaultPersistence(
  args: CreateStoreOptions | undefined,
  createPersistence: (() => PersistenceAdapter) | undefined
): FieldStoreConfig | undefined {
  if (!createPersistence) {
    return resolveCreateStoreConfig(args);
  }

  const resolved = resolveCreateStoreConfig(args);

  if (resolved === undefined) {
    return { persistence: createPersistence() };
  }

  return resolved.persistence !== undefined ? resolved : { ...resolved, persistence: createPersistence() };
}

function create({ persistence = undefined, validator = undefined, emitter = undefined }: FieldStoreConfig = {}): FieldStore {
  return new FieldStore(
    persistence ?? empty(),
    validator ?? new SearchBuilderFieldValidator(),
    new ErrorManager(),
    new TaskMonitor(),
    emitter ?? createEventEmitter()
  );
}

function isResolverFunction(arg: unknown): arg is CreateStoreConfigResolver {
  return typeof arg === "function";
}

function isQuickStoreOptions(arg: unknown): arg is CreateStoreQuickOptions {
  return typeof arg === "object" && arg !== null && "persistInUrl" in arg;
}
