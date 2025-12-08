/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { empty, url } from "../persistence";
import { PersistenceAdapter } from "../persistence/PersistenceAdapter";
import { FieldValidator } from "../validations/FieldValidator";
import { SearchBuilderFieldValidator } from "../validations/SearchBuilderFieldValidator";
import { createEventEmitter, EventEmitter } from "./event-emitter";
import { FieldStore } from "./FieldStore";

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
  if (args === undefined) {
    return create();
  }

  if (isResolverFunction(args)) {
    return create(args());
  }

  if (isStoreOptionsObject(args)) {
    return create({ persistence: args.persistInUrl ? url() : empty() });
  }

  return create(args);
}

function create({ persistence = undefined, validator = undefined, emitter = undefined }: FieldStoreConfig = {}): FieldStore {
  return new FieldStore(persistence ?? empty(), validator ?? new SearchBuilderFieldValidator(), emitter ?? createEventEmitter());
}

function isResolverFunction(arg: unknown): arg is CreateStoreConfigResolver {
  return typeof arg === "function";
}

function isStoreOptionsObject(arg: unknown): arg is CreateStoreQuickOptions {
  return typeof arg === "object" && arg !== null && "persistInUrl" in arg;
}
