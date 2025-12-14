/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import type {
  FieldRegistry,
  FilterName,
  FilterTypeKey,
  FilterTypeMap,
  PrimitiveFilterDictionary,
  RegisteredField,
  Serializer,
  ValueFilterDictionary,
} from "../field";
import type { NonUndefined } from "../internal";
import { GenericRegisteredField, RegisteredFieldDictionary } from "./FieldsRepository";

export const EMPTY_VALUE = "";

export class FieldsCollection implements Iterable<GenericRegisteredField>, FieldRegistry {
  #values: RegisteredFieldDictionary;

  constructor(values: RegisteredFieldDictionary) {
    this.#values = values;
  }

  public static from = (values: RegisteredFieldDictionary) => new FieldsCollection(values);

  public static empty = () => FieldsCollection.from(new Map());

  public size = () => this.#values.size;

  public toArray = (): Array<GenericRegisteredField> => Array.from(this);

  public toMap = (): RegisteredFieldDictionary => new Map(this.#values);

  public toRecord = (): Record<FilterName, GenericRegisteredField> => Object.fromEntries(this.#values);

  public toValues = (): ValueFilterDictionary => {
    return this.#collect((field) => field.value);
  };

  public exists = (name: FilterName): boolean => {
    return this.#values.has(name);
  };

  public get = <TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    name: FilterName
  ): RegisteredField<TKey, TValue> | undefined => {
    return this.#values.get(name) as RegisteredField<TKey, TValue> | undefined;
  };

  public toPrimitives = (): PrimitiveFilterDictionary => {
    return this.#collect((field) => {
      if (!FieldsCollection.isValidValue(field.value)) {
        return undefined;
      }

      if (field.serializer) {
        return (field.serializer as Serializer<typeof field.value>).serialize(field.value);
      }

      return Array.isArray(field.value) ? field.value.map(String) : String(field.value);
    });
  };

  public toUrlSearchParams = (): URLSearchParams => {
    const params = new URLSearchParams();
    const primitives = this.toPrimitives();

    for (const name in primitives) {
      const primitive = primitives[name];

      if (!Array.isArray(primitive)) {
        params.append(name, primitive);
        continue;
      }

      primitive.forEach((value) => params.append(name, value));
    }

    return params;
  };

  public onlyActives = (): GenericRegisteredField[] => {
    return this.filter((field) => FieldsCollection.isValidValue(field.value));
  };

  public map = <V extends unknown>(mapper: (field: GenericRegisteredField) => V): V[] => {
    const values: V[] = [];

    for (const field of this) {
      values.push(mapper(field));
    }

    return values;
  };

  public filter = (predicate: (field: GenericRegisteredField) => boolean): GenericRegisteredField[] => {
    const values: GenericRegisteredField[] = [];

    for (const field of this) {
      if (predicate(field)) {
        values.push(field);
      }
    }

    return values;
  };

  public forEach = (callback: (field: GenericRegisteredField) => void) => {
    this.#values.forEach(callback);
  };

  public static isValidValue = (value: unknown): value is NonNullable<unknown> => {
    return value !== undefined && value !== null && value !== EMPTY_VALUE;
  };

  public [Symbol.iterator]() {
    return this.#values.values();
  }

  #collect = <T>(collector: (field: GenericRegisteredField) => T): Record<FilterName, NonUndefined<T>> => {
    const result = {} as Record<FilterName, NonUndefined<T>>;

    this.forEach((field) => {
      const value = collector(field);

      if (this.#isDefined(value)) {
        result[field.name] = value;
      }
    });

    return result;
  };

  #isDefined = <T>(value: T): value is NonUndefined<T> => {
    return value !== undefined;
  };
}
