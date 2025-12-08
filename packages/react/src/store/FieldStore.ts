/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import type { GenericRegisteredField, RegisteredField, RegisteredFieldDictionary, RegisteredFieldValue } from ".";
import type {
  FieldOptions,
  FilterName,
  FilterTypeKey,
  FilterTypeMap,
  FilterValue,
  GenericField,
  PrimitiveFilterDictionary,
  PrimitiveValue,
  Serializer,
  Validator,
  ValueFilterDictionary,
} from "../field";
import type { PersistenceAdapter } from "../persistence/PersistenceAdapter";
import { FieldValidator } from "../validations/FieldValidator";
import { FieldsCollection } from "./FieldsCollection";
import { type EventEmitter, type Unsubscribe } from "./event-emitter";
import { createTaskMonitor, TaskMonitor } from "./task-monitor";

export type FieldOperation = "set" | "flush" | "update" | "hydrate" | "unregister" | "register" | "rehydrate" | "reset" | null;

export type AsynchronousValue = { deferred: true; hydrated: Promise<RegisteredFieldValue> };
export type SynchronousValue = { deferred: false; hydrated: RegisteredFieldValue };
export type ParseValue = AsynchronousValue | SynchronousValue;

export type HydratorResponse = { label: string; value: FilterValue };

export type FieldStoreState = Readonly<{
  collection: FieldsCollection;
  operation: FieldOperation;
  touched: FilterName[];
  isHydrating: boolean;
}>;

export class FieldStore {
  readonly #persistence: PersistenceAdapter;
  readonly #validator: FieldValidator;
  readonly #emitter: EventEmitter;
  readonly #tracker: TaskMonitor;

  #whitelist: FilterName[];
  #initial: PrimitiveFilterDictionary;
  #listeners: Set<() => void> = new Set();
  #fields: RegisteredFieldDictionary;
  #state: FieldStoreState;

  constructor(persistence: PersistenceAdapter, validator: FieldValidator, emitter: EventEmitter) {
    this.#fields = new Map();
    this.#persistence = persistence;
    this.#validator = validator;
    this.#emitter = emitter;
    this.#initial = persistence.read();
    this.#state = this.#initialState();
    this.#whitelist = [];
    this.#tracker = createTaskMonitor();
  }

  state = () => this.#state;

  exists = (name: FilterName) => this.#fields.has(name);

  collection = () => this.#state.collection;

  isHydrating = () => this.#tracker.isHydrating();

  whenReady = (name: string, task: () => void) => this.#tracker.whenReady(name, task);

  subscribe = (listener: () => void): Unsubscribe => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  listen = <TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    name: FilterName
  ): (() => RegisteredField<TKey, TValue> | undefined) => {
    return () => this.#state.collection.get(name) as RegisteredField<TKey, TValue> | undefined;
  };

  rehydrate = async (): Promise<void> => {
    const newValues = this.#persistence.read();
    const touched: FilterName[] = [];
    const hydrators: Record<FilterName, Promise<FilterValue>> = {};

    for (const field of this.#fields.values()) {
      const { deferred, hydrated } = this.#parse(newValues[field.name], field);

      if (deferred) {
        this.#tracker.capture();
        this.#override(field, { isHydrating: true });
        hydrators[field.name] = hydrated;
        continue;
      }

      if (this.#isDirty(field, hydrated)) {
        this.#override(field, { value: hydrated });
        touched.push(field.name);
      }
    }

    const deferredFieldNames = Object.keys(hydrators);

    if (touched.length > 0 || deferredFieldNames.length > 0) {
      this.#commit();
    }

    const results = await Promise.allSettled(Object.values(hydrators));

    results.forEach((result, index) => {
      const field = this.#fields.get(deferredFieldNames[index]);
      const isSuccessful = result.status === "fulfilled";

      if (field === undefined) {
        return;
      }

      this.#tracker.release();
      const value = (!isSuccessful ? field.value : result.value) ?? field.defaultValue;

      if (isSuccessful && this.#isDirty(field, result.value)) {
        touched.push(field.name);
      }

      this.#override(field, {
        value,
        isHydrating: false,
      });
    });

    if (touched.length === 0) {
      return;
    }

    this.#commit({ operation: "rehydrate", touched });
  };

  persist = () => {
    const collection = this.#state.collection;
    this.#persistence.write(collection.toPrimitives(), this.#whitelist);
    this.#emitter.emit("persist", collection);
  };

  register<F extends GenericField>(field: F): void {
    if (this.exists(field.name)) {
      throwAlreadyRegisteredErrorFor(field, this.#fields);
    }

    const defaultValue = field.value;
    const persistedValue = this.#initial[field.name];
    const parsed = this.#parse(persistedValue, { defaultValue, serializer: field.serializer });
    const { deferred, hydrated } = parsed;
    const value = deferred ? defaultValue : hydrated;

    const registered = {
      ...field,
      value,
      defaultValue,
      updatedAt: Date.now(),
      isHydrating: deferred,
    } as GenericRegisteredField;

    this.#process(registered, parsed);
    this.#whitelist.push(field.name);
    this.#fields.set(field.name, registered);

    this.#commit({
      operation: "register",
      collection: new FieldsCollection(this.#fields),
    });
  }

  unregister = (name: FilterName) => {
    const field = this.#fields.get(name);

    if (!field) {
      return;
    }

    this.#fields.delete(name);
    this.#whitelist = this.#whitelist.filter((field) => field !== name);

    if (field.isHydrating) {
      this.#tracker.release();
    }

    this.#commit({
      operation: "unregister",
      collection: new FieldsCollection(this.#fields),
    });
  };

  update = (name: FilterName, meta: Partial<FieldOptions>) => {
    if (Object.keys(meta).length === 0) {
      return;
    }

    const field = this.#fields.get(name);

    if (!field) {
      throw new Error(`Field "${name}" does not exist`);
    }

    this.#fields.set(name, { ...field, ...meta });

    this.#commit({
      operation: "update",
      touched: [name],
      collection: new FieldsCollection(this.#fields),
    });
  };

  get = <TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(name: FilterName): RegisteredField<TKey, TValue> | undefined => {
    return this.#state.collection.get(name) as RegisteredField<TKey, TValue> | undefined;
  };

  set = (name: FilterName, value: RegisteredFieldValue) => {
    this.#apply(name, value, "set");
  };

  flush = (name: FilterName, value: RegisteredFieldValue) => {
    this.#apply(name, value, "flush");
  };

  reset = (newValues: ValueFilterDictionary = {}): FilterName[] | undefined => {
    const touched: FilterName[] = [];

    this.#fields.forEach((field) => {
      const value = newValues[field.name] ?? field.defaultValue;

      if (this.#isDirty(field, value)) {
        this.#override(field, { value });
        touched.push(field.name);
      }
    });

    if (touched.length === 0) {
      return;
    }

    this.#commit({ operation: "reset", collection: new FieldsCollection(this.#fields), touched });

    return touched;
  };

  clean = () => {
    this.#fields.clear();
    this.#whitelist = [];
    this.#commit(this.#initialState());
  };

  onPersistenceChange = (listener: (state: FieldStoreState) => void): Unsubscribe => {
    return this.#persistence.subscribe(async () => {
      await this.rehydrate();
      listener(this.#state);
    });
  };

  onFieldPersisted = (listener: (fields: FieldsCollection) => void): Unsubscribe => {
    return this.#emitter.on("persist", listener);
  };

  onStateChange = (listener: (state: FieldStoreState) => void): Unsubscribe => {
    return this.#emitter.on("change", (state) => listener(state));
  };

  #apply(name: FilterName, value: RegisteredFieldValue, operation: Extract<FieldOperation, "set" | "flush">) {
    const field = this.#fields.get(name);

    if (!field || Object.is(field.value, value)) {
      return;
    }

    this.#override(field, { value: value as RegisteredFieldValue });

    this.#commit({ operation, touched: [name], collection: new FieldsCollection(this.#fields) });
  }

  #process = ({ name, defaultValue }: Pick<GenericRegisteredField, "name" | "defaultValue">, { deferred, hydrated }: ParseValue) => {
    if (!deferred) {
      return;
    }

    this.#tracker.capture();

    hydrated
      .then((value) => value ?? defaultValue)
      .catch(() => defaultValue)
      .then((value) => {
        const field = this.#fields.get(name);

        if (!field) {
          return;
        }

        this.#tracker.release();

        if (!this.#isDirty(field, value)) {
          this.#override(field, { isHydrating: false });
          this.#commit({
            collection: new FieldsCollection(this.#fields),
          });

          return;
        }

        this.#override(field, {
          value,
          isHydrating: false,
        });

        this.#commit({
          operation: "hydrate",
          collection: new FieldsCollection(this.#fields),
        });
      });
  };

  #commit = (state: Partial<FieldStoreState> = {}) => {
    const operation = state.operation ?? null;
    const touched = state.touched ?? [];
    const collection = state.collection ?? new FieldsCollection(this.#fields);

    this.#state = {
      ...this.#state,
      operation,
      touched,
      collection,
      isHydrating: this.#tracker.isHydrating(),
    };

    this.#listeners.forEach((listener) => listener());
    this.#emitter.emit("change", this.#state);
  };

  #parse = <T extends GenericRegisteredField>(newValue: PrimitiveValue, field: Pick<T, "defaultValue" | "serializer">): ParseValue => {
    if (newValue === undefined || newValue === null || !field.serializer.unserialize) {
      return {
        deferred: false,
        hydrated: field.defaultValue,
      };
    }

    const unserialize = field.serializer.unserialize as Serializer<RegisteredFieldValue>["unserialize"];

    const hydrated = unserialize(newValue);
    const deferred = hydrated instanceof Promise;

    return { deferred, hydrated } as ParseValue;
  };

  #override<F extends GenericRegisteredField>(field: F, partial: Partial<Pick<F, "value" | "isHydrating">>): void {
    const newValue = partial.value;
    let errors = undefined;

    if (newValue !== undefined && field.validate !== undefined) {
      const validate = field.validate as Validator<FilterValue>;
      const rules = validate(newValue, this.collection());

      errors = this.#validator.validate(newValue, rules, this.collection());
    }

    this.#fields.set(field.name, {
      ...(field as F),
      updatedAt: Date.now(),
      ...partial,
      errors,
    });
  }

  #isDirty = (field: GenericRegisteredField, value: FilterValue) => {
    return !Object.is(field.value, value);
  };

  #initialState = (): FieldStoreState => ({
    collection: FieldsCollection.empty(),
    touched: [],
    operation: null,
    isHydrating: false,
  });
}

function throwAlreadyRegisteredErrorFor(field: GenericField, fields: Map<string, GenericRegisteredField>) {
  throw new Error(`
DUPLICATE FIELD REGISTRATION
=================================

Field "${field.name}" is already registered and cannot be registered again.

QUICK FIX:
Check for multiple components using the same field name "${field.name}" in your application.

TECHNICAL CONTEXT:
Field names must be unique across your entire application. Each field name can only be registered once.

CURRENT FIELD REGISTRY:
• Total registered fields: ${fields.size}
• All field names: [${Array.from(fields.keys()).join(", ")}]

=================================
  `);
}
