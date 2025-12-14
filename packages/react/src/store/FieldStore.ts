/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import type {
  Field,
  FieldOptions,
  FilterName,
  FilterTypeKey,
  FilterTypeMap,
  FilterValue,
  RegisteredField,
  ValueFilterDictionary,
} from "../field";
import { PersistenceAdapter } from "../persistence/PersistenceAdapter";
import { FieldValidator } from "../validations/FieldValidator";
import { ErrorManager } from "./ErrorManager";
import { FieldsCollection } from "./FieldsCollection";
import type { RegisteredFieldValue } from "./FieldsRepository";
import { FieldRepository, NotExecuted } from "./FieldsRepository";
import { PersistenceManager } from "./PersistenceManager";
import { TaskMonitor } from "./TaskMonitor";
import { type EventEmitter, type Unsubscribe } from "./event-emitter";

export type FieldOperation = "set" | "flush" | "update" | "hydrate" | "unregister" | "register" | "rehydrate" | "reset" | null;

export type AsynchronousValue<TValue> = { deferred: true; hydrated: Promise<TValue | null> };
export type SynchronousValue<TValue> = { deferred: false; hydrated: TValue | null };
export type ParseValue<TValue> = AsynchronousValue<TValue> | SynchronousValue<TValue>;

export type HydratorResponse = { label: string; value: FilterValue };
export const NoErrors = null;

export type FieldStoreState = Readonly<{
  collection: FieldsCollection;
  operation: FieldOperation;
  touched: readonly FilterName[];
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

  constructor(adapter: PersistenceAdapter, validator: FieldValidator, error: ErrorManager, tracker: TaskMonitor, emitter: EventEmitter) {
    this.#whitelist = [];
    this.#state = this.#initialState();
    this.#tracker = tracker;
    this.#emitter = emitter;
    this.#repository = new FieldRepository(validator, error);
    this.#persistence = new PersistenceManager(adapter, this.#repository, tracker);
  }

  public state = () => this.#state;

  public exists = (name: FilterName) => this.#repository.exists(name);

  public collection = () => this.#state.collection;

  public isHydrating = () => this.#tracker.isWorking();

  public hasErrors = (name?: FilterName) => this.#repository.hasErrors(name);

  public whenReady = (name: string, task: () => void) => this.#tracker.whenReady(name, task);

  public subscribe = (listener: () => void): Unsubscribe => {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  };

  public listen = <TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    name: FilterName
  ): (() => RegisteredField<TKey, TValue> | undefined) => {
    return () => this.#repository.get(name);
  };

  public register<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(field: Field<TKey, TValue>): void {
    const defaultValue = field.value;
    const parsed = this.#persistence.resolveFromDictionary(field.name, field.serializer, defaultValue);
    const { deferred, hydrated } = parsed;
    const value = deferred ? defaultValue : hydrated;

    const registered: RegisteredField<TKey, TValue> = {
      ...field,
      defaultValue,
      value,
      errors: NoErrors,
      updatedAt: Date.now(),
      isHydrating: deferred,
    };

    const processed = this.#persistence.process(registered, parsed);

    this.#repository.create(registered);
    this.#whitelist.push(field.name);

    this.#commit({
      operation: "register",
      touched: [field.name],
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

  public update = (name: FilterName, meta: Partial<FieldOptions>) => {
    const response = this.#repository.update(name, meta);

    if (response === NotExecuted) {
      return;
    }

    this.#commit({
      operation: "update",
      touched: [name],
    });
  };

  public unregister = (name: FilterName) => {
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
      touched: [name],
    });
  };

  public get = <TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    name: FilterName
  ): RegisteredField<TKey, TValue> | undefined => {
    return this.#repository.get(name);
  };

  public set = <TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(name: FilterName, value: TValue | null) => {
    this.#apply(name, value, "set");
  };

  public flush = (name: FilterName, value: RegisteredFieldValue) => {
    this.#apply(name, value, "flush");
  };

  public persist = () => {
    const collection = this.#state.collection;
    this.#persistence.write(collection.toPrimitives(), this.#whitelist);
    this.#emitter.emit("persist", collection);
  };

  public rehydrate = async (): Promise<void> => {
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

  public revalidate = (name: FilterName): void => {
    const revalidated = this.#repository.revalidate(name);

    if (revalidated) {
      this.#commit();
    }
  };

  public reset = (newValues: ValueFilterDictionary = {}): Readonly<FilterName[]> | undefined => {
    const response = this.#repository.bulk(newValues);

    if (response === NotExecuted) {
      return;
    }

    this.#commit({ operation: "reset", touched: response });

    return response;
  };

  public clean = () => {
    this.#whitelist = [];
    this.#repository.clear();
    this.#commit(this.#initialState());
  };

  public onPersistenceChange = (listener: (state: FieldStoreState) => void): Unsubscribe => {
    return this.#persistence.subscribe(async () => {
      await this.rehydrate();
      listener(this.#state);
    });
  };

  public onFieldPersisted = (listener: (fields: FieldsCollection) => void): Unsubscribe => {
    return this.#emitter.on("persist", listener);
  };

  public onStateChange = (listener: (state: FieldStoreState) => void): Unsubscribe => {
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
