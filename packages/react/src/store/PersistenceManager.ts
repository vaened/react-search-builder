/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import {
  FilterName,
  FilterTypeKey,
  FilterTypeMap,
  FilterValue,
  PrimitiveFilterDictionary,
  Serializer,
  SerializeReturnType,
} from "../field";
import { PersistenceAdapter } from "../persistence/PersistenceAdapter";
import { FieldRepository, GenericRegisteredField, RegisteredField, RegisteredFieldValue } from "./FieldsRepository";
import { TaskMonitor } from "./TaskMonitor";

export type AsynchronousValue<TValue> = { deferred: true; hydrated: Promise<TValue | null> };
export type SynchronousValue<TValue> = { deferred: false; hydrated: TValue | null };
export type ParseValue<TValue> = AsynchronousValue<TValue> | SynchronousValue<TValue>;

type HydrationStatus = "pending" | "processing" | "completed" | "unchanged";

type HydrationResponse = {
  status: HydrationStatus;
  touched: FilterName[];
};

export class PersistenceManager implements PersistenceAdapter {
  readonly #persistence: PersistenceAdapter;
  readonly #repository: FieldRepository;
  readonly #tracker: TaskMonitor;
  #dictionary: PrimitiveFilterDictionary;

  constructor(adapter: PersistenceAdapter, repository: FieldRepository, tracker: TaskMonitor) {
    this.#persistence = adapter;
    this.#repository = repository;
    this.#tracker = tracker;
    this.#dictionary = adapter.read();
  }

  public write(dictionary: PrimitiveFilterDictionary, whitelist: FilterName[]): void {
    this.#persistence.write(dictionary, whitelist);
  }

  public read(): PrimitiveFilterDictionary {
    return this.#dictionary;
  }

  public subscribe(callback: () => void) {
    return this.#persistence.subscribe(callback);
  }

  public dictionary(): PrimitiveFilterDictionary {
    return this.#dictionary;
  }

  public resolveFromDictionary<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    name: FilterName,
    serializer: Serializer<TValue> | undefined,
    fallback: TValue | null
  ): ParseValue<TValue> {
    const persistedValue = this.#dictionary[name] as SerializeReturnType<TValue>;
    return this.#parse(persistedValue, { defaultValue: fallback, serializer });
  }

  public async *rehydrate(): AsyncGenerator<HydrationResponse, void, unknown> {
    const newValues = this.#persistence.read();
    this.#dictionary = newValues;
    const touched: FilterName[] = [];
    const hydrators: Record<FilterName, Promise<FilterValue>> = {};

    yield { status: "pending", touched };

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
    const noDeferredFields = deferredFieldNames.length === 0;

    if (touched.length === 0 && noDeferredFields) {
      yield { status: "unchanged", touched: [...touched] };
      return;
    }

    if (noDeferredFields) {
      yield { status: "completed", touched: [...touched] };
      return;
    }

    yield { status: "processing", touched: [...touched] };

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

    yield { status: "completed", touched: [...touched] };
  }

  process<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    { name, defaultValue }: Pick<RegisteredField<TKey, TValue>, "name" | "defaultValue">,
    { deferred, hydrated }: ParseValue<TValue>
  ): Promise<HydrationResponse> | undefined {
    if (!deferred) {
      return;
    }

    this.#tracker.capture();

    return hydrated
      .then((value) => value ?? defaultValue)
      .catch(() => defaultValue)
      .then((value) => {
        const field = this.#repository.get(name);

        if (!field) {
          return { status: "unchanged", touched: [] };
        }

        this.#tracker.release();

        if (!this.#repository.isDirty(field, value)) {
          this.#repository.override(field, { isHydrating: false });

          return { status: "completed", touched: [] };
        }

        this.#repository.override(field, {
          value,
          isHydrating: false,
        });

        return { status: "completed", touched: [name] };
      });
  }

  #parse(
    newValue: SerializeReturnType<RegisteredFieldValue>,
    field: Pick<GenericRegisteredField, "defaultValue" | "serializer">
  ): ParseValue<RegisteredFieldValue>;
  #parse<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    newValue: SerializeReturnType<TValue>,
    field: Pick<RegisteredField<TKey, TValue>, "defaultValue" | "serializer">
  ): ParseValue<TValue>;
  #parse<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    newValue: SerializeReturnType<TValue>,
    field: Pick<RegisteredField<TKey, TValue>, "defaultValue" | "serializer">
  ): ParseValue<TValue> {
    if (newValue === undefined || newValue === null || !field.serializer?.unserialize) {
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
}
