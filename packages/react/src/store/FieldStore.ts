/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import type { RegisteredField, RegisteredFieldValue } from ".";
import type { Field, FieldOptions, FilterName, FilterTypeKey, FilterTypeMap, FilterValue, ValueFilterDictionary } from "../field";
import { FieldsCollection } from "./FieldsCollection";
import { FieldRepository, NotExecuted } from "./FieldsRepository";
import { PersistenceManager } from "./PersistenceManager";
import { TaskMonitor } from "./TaskMonitor";
import { type EventEmitter, type Unsubscribe } from "./event-emitter";

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
  readonly #emitter: EventEmitter;
  readonly #tracker: TaskMonitor;
  readonly #repository: FieldRepository;
  readonly #persistence: PersistenceManager;

  #whitelist: FilterName[];
  #listeners: Set<() => void> = new Set();
  #state: FieldStoreState;

  constructor(persistence: PersistenceManager, repository: FieldRepository, tracker: TaskMonitor, emitter: EventEmitter) {
    this.#whitelist = [];
    this.#state = this.#initialState();
    this.#tracker = tracker;
    this.#repository = repository;
    this.#persistence = persistence;
    this.#emitter = emitter;
  }

  state = () => this.#state;

  exists = (name: FilterName) => this.#repository.exists(name);

  collection = () => this.#state.collection;

  isHydrating = () => this.#tracker.isWorking();

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
    for await (const response of this.#persistence.rehydrate()) {
      switch (response.status) {
        case "pending":
        case "unchanged":
          continue;
        case "processing":
          this.#commit();
          continue;
        case "completed":
          this.#commit({
            operation: "rehydrate",
            touched: response.touched,
          });
      }
    }
  };

  persist = () => {
    const collection = this.#state.collection;
    this.#persistence.write(collection.toPrimitives(), this.#whitelist);
    this.#emitter.emit("persist", collection);
  };

  register<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(field: Field<TKey, TValue>): void {
    const defaultValue = field.value;
    const parsed = this.#persistence.resolveFromDictionary(field.name, field.serializer, defaultValue);
    const { deferred, hydrated } = parsed;
    const value = deferred ? defaultValue : hydrated;

    const registered: RegisteredField<TKey, TValue> = {
      ...field,
      defaultValue,
      value,
      updatedAt: Date.now(),
      isHydrating: deferred,
    };

    const processed = this.#persistence.process(registered, parsed);

    this.#repository.create(registered);
    this.#whitelist.push(field.name);

    this.#commit({
      operation: "register",
    });

    processed?.then(({ status, touched }) => {
      const isCompleted = status === "completed";

      if (isCompleted && touched.length === 0) {
        this.#commit();
        return;
      }

      if (isCompleted) {
        this.#commit({
          touched,
          operation: "hydrate",
        });
      }
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

  #commit = (state: Partial<FieldStoreState> = {}) => {
    const operation = state.operation ?? null;
    const touched = state.touched ?? [];
    const collection = state.collection ?? new FieldsCollection(this.#repository.all());

    this.#state = {
      ...this.#state,
      operation,
      touched,
      collection,
      isHydrating: this.isHydrating(),
    };

    this.#listeners.forEach((listener) => listener());
    this.#emitter.emit("change", this.#state);
  };

  #initialState = (): FieldStoreState => ({
    collection: FieldsCollection.empty(),
    touched: [],
    operation: null,
    isHydrating: false,
  });
}
