/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import type { GenericRegisteredField, RegisteredField, RegisteredFieldValue } from ".";
import type {
  Field,
  FieldOptions,
  FilterName,
  FilterTypeKey,
  FilterTypeMap,
  FilterValue,
  PrimitiveFilterDictionary,
  SerializeReturnType,
  ValueFilterDictionary,
} from "../field";
import type { PersistenceAdapter } from "../persistence/PersistenceAdapter";
import { FieldValidator } from "../validations/FieldValidator";
import { ErrorManager } from "./ErrorManager";
import { FieldsCollection } from "./FieldsCollection";
import { FieldRepository, NotExecuted } from "./FieldsRepository";
import { type EventEmitter, type Unsubscribe } from "./event-emitter";
import { createTaskMonitor, TaskMonitor } from "./task-monitor";

export type FieldOperation = "set" | "flush" | "update" | "hydrate" | "unregister" | "register" | "rehydrate" | "reset" | null;

export type AsynchronousValue<TValue> = { deferred: true; hydrated: Promise<TValue | null> };
export type SynchronousValue<TValue> = { deferred: false; hydrated: TValue | null };
export type ParseValue<TValue> = AsynchronousValue<TValue> | SynchronousValue<TValue>;

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
  readonly #repository: FieldRepository;

  #whitelist: FilterName[];
  #initial: PrimitiveFilterDictionary;
  #listeners: Set<() => void> = new Set();
  #state: FieldStoreState;

  constructor(persistence: PersistenceAdapter, validator: FieldValidator, emitter: EventEmitter) {
    this.#persistence = persistence;
    this.#validator = validator;
    this.#emitter = emitter;
    this.#initial = persistence.read();
    this.#state = this.#initialState();
    this.#whitelist = [];
    this.#tracker = createTaskMonitor();
    this.#repository = new FieldRepository(this.#validator, new ErrorManager());
  }

  state = () => this.#state;

  exists = (name: FilterName) => this.#repository.exists(name);

  collection = () => this.#state.collection;

  isHydrating = () => this.#tracker.isHydrating();

  hasErrors = (name?: FilterName) => this.#repository.hasErrors(name);

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

    for (const field of this.#repository.all().values()) {
      const { deferred, hydrated } = this.#parse(newValues[field.name], field);

      if (deferred) {
        this.#tracker.capture();
        this.#repository.override(field, { isHydrating: true });
        hydrators[field.name] = hydrated;
        continue;
      }

      if (this.#repository.isDirty(field, hydrated)) {
        this.#repository.override(field, { value: hydrated });
        touched.push(field.name);
      }
    }

    const deferredFieldNames = Object.keys(hydrators);

    if (touched.length > 0 || deferredFieldNames.length > 0) {
      this.#commit();
    }

    const results = await Promise.allSettled(Object.values(hydrators));

    results.forEach((result, index) => {
      const field = this.#repository.get(deferredFieldNames[index]);
      const isSuccessful = result.status === "fulfilled";

      if (field === undefined) {
        return;
      }

      this.#tracker.release();
      const value = (!isSuccessful ? field.value : result.value) ?? field.defaultValue;

      if (isSuccessful && this.#repository.isDirty(field, result.value)) {
        touched.push(field.name);
      }

      this.#repository.override(field, {
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

  register<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(field: Field<TKey, TValue>): void {
    const defaultValue = field.value;
    const persistedValue = this.#initial[field.name] as SerializeReturnType<TValue>;
    const parsed = this.#parse(persistedValue, { defaultValue, serializer: field.serializer });
    const { deferred, hydrated } = parsed;
    const value = deferred ? defaultValue : hydrated;

    const registered: RegisteredField<TKey, TValue> = {
      ...field,
      defaultValue,
      value,
      updatedAt: Date.now(),
      isHydrating: deferred,
    };

    this.#process(registered, parsed);

    this.#repository.create(registered);
    this.#whitelist.push(field.name);

    this.#commit({
      operation: "register",
    });
  }

  unregister = (name: FilterName) => {
    const response = this.#repository.delete(name);

    if (response === NotExecuted) {
      return;
    }

    this.#whitelist = this.#whitelist.filter((field) => field !== name);

    if (response.isHydrating) {
      this.#tracker.release();
    }

    this.#commit({
      operation: "unregister",
    });
  };

  update = (name: FilterName, meta: Partial<FieldOptions>) => {
    const response = this.#repository.update(name, meta);

    if (response === NotExecuted) {
      return;
    }

    this.#commit({
      operation: "update",
      touched: [name],
    });
  };

  get = <TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(name: FilterName): RegisteredField<TKey, TValue> | undefined => {
    return this.#repository.get(name);
  };

  set = <TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(name: FilterName, value: TValue | null) => {
    this.#apply(name, value, "set");
  };

  flush = (name: FilterName, value: RegisteredFieldValue) => {
    this.#apply(name, value, "flush");
  };

  reset = (newValues: ValueFilterDictionary = {}): FilterName[] | undefined => {
    const touched: FilterName[] = [];

    this.#repository.all().forEach((field) => {
      const value = newValues[field.name] ?? field.defaultValue;

      if (this.#repository.isDirty(field, value)) {
        this.#repository.override(field, { value });
        touched.push(field.name);
      }
    });

    if (touched.length === 0) {
      return;
    }

    this.#commit({ operation: "reset", touched });

    return touched;
  };

  clean = () => {
    this.#whitelist = [];
    this.#repository.clear();
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

  #apply<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    name: FilterName,
    value: TValue | null,
    operation: Extract<FieldOperation, "set" | "flush">
  ) {
    const response = this.#repository.set(name, value);

    if (response === false) {
      return;
    }

    this.#commit({
      operation,
      touched: [name],
    });
  }

  #process<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    { name, defaultValue }: Pick<RegisteredField<TKey, TValue>, "name" | "defaultValue">,
    { deferred, hydrated }: ParseValue<TValue>
  ) {
    if (!deferred) {
      return;
    }

    this.#tracker.capture();

    hydrated
      .then((value) => value ?? defaultValue)
      .catch(() => defaultValue)
      .then((value) => {
        const field = this.#repository.get(name);

        if (!field) {
          return;
        }

        this.#tracker.release();

        this.#commit();

        if (!this.#repository.isDirty(field, value)) {
          this.#repository.override(field, { isHydrating: false });
          this.#commit();

          return;
        }

        this.#repository.override(field, {
          value,
          isHydrating: false,
        });

        this.#commit({
          operation: "hydrate",
        });
      });
  }

  #commit = (state: Partial<FieldStoreState> = {}) => {
    const operation = state.operation ?? null;
    const touched = state.touched ?? [];
    const collection = state.collection ?? new FieldsCollection(this.#repository.all());

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

  #parse(
    newValue: SerializeReturnType<GenericRegisteredField["value"]>,
    field: Pick<GenericRegisteredField, "defaultValue" | "serializer">
  ): ParseValue<GenericRegisteredField["value"]>;
  #parse<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    newValue: SerializeReturnType<TValue>,
    field: Pick<RegisteredField<TKey, TValue>, "defaultValue" | "serializer">
  ): ParseValue<TValue>;
  #parse<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    newValue: SerializeReturnType<TValue>,
    field: Pick<RegisteredField<TKey, TValue>, "defaultValue" | "serializer">
  ): ParseValue<TValue> {
    if (newValue === undefined || newValue === null || !field.serializer.unserialize) {
      return {
        deferred: false,
        hydrated: field.defaultValue,
      };
    }

    const unserialize = field.serializer.unserialize;

    const hydrated = unserialize(newValue);
    const deferred = hydrated instanceof Promise;

    return { deferred, hydrated } as ParseValue<TValue>;
  }

  #initialState = (): FieldStoreState => ({
    collection: FieldsCollection.empty(),
    touched: [],
    operation: null,
    isHydrating: false,
  });
}
