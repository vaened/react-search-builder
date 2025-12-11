/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { Field, FieldRegistry, FieldValidationStatus, FilterName, FilterTypeKey, FilterTypeMap, RegisteredField } from "../field";
import { FieldValidator } from "../validations/FieldValidator";
import { ErrorManager } from "./ErrorManager";
import { NoErrors } from "./FieldStore";
import { isFieldDirty } from "./utils";

type Operation<Field> = false | Readonly<Field>;
export const NotExecuted = false;

export type GenericRegisteredField = {
  [K in FilterTypeKey]: RegisteredField<K, FilterTypeMap[K]>;
}[FilterTypeKey];

export type RegisteredFieldValue = GenericRegisteredField["value"];

export type RegisteredFieldDictionary = Map<FilterName, GenericRegisteredField>;

export class FieldRepository implements FieldRegistry {
  readonly #validator: FieldValidator;
  readonly #errorManager: ErrorManager;
  readonly #fields: RegisteredFieldDictionary;

  constructor(validator: FieldValidator, errorManager: ErrorManager) {
    this.#fields = new Map();
    this.#validator = validator;
    this.#errorManager = errorManager;
  }

  public exists = (name: FilterName) => this.#fields.has(name);

  public all = (): Readonly<RegisteredFieldDictionary> => this.#fields;

  public hasErrors = (name?: FilterName) => (name === undefined ? this.#errorManager.has() : this.#errorManager.exists(name));

  public get = <TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    name: FilterName
  ): RegisteredField<TKey, TValue> | undefined => {
    return this.#fields.get(name) as RegisteredField<TKey, TValue> | undefined;
  };

  public set = <TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    name: FilterName,
    value: TValue | null
  ): Operation<RegisteredField<TKey, TValue>> => {
    const field = this.get<TKey, TValue>(name);

    if (field === undefined || !isFieldDirty(field, value)) {
      return NotExecuted;
    }

    this.override(field, {
      value,
    });

    return field;
  };

  public override(field: GenericRegisteredField, partial: Partial<GenericRegisteredField>): void;
  public override<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    field: RegisteredField<TKey, TValue>,
    partial: Partial<RegisteredField<TKey, TValue>>
  ): void;
  public override<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    field: RegisteredField<TKey, TValue>,
    partial: Partial<RegisteredField<TKey, TValue>>
  ): void {
    const newValue = partial.value;
    const previousErrors = partial.errors !== undefined ? partial.errors : field.errors;
    const currentErrors = newValue !== undefined ? this.#validate(field, newValue) : previousErrors;

    this.#fields.set(field.name, {
      ...field,
      updatedAt: Date.now(),
      ...partial,
      errors: currentErrors,
    } as unknown as GenericRegisteredField);
  }

  public create = <TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(field: RegisteredField<TKey, TValue>): void => {
    if (this.exists(field.name)) {
      throwAlreadyExistsErrorFor(field, this.all());
    }

    this.override(field, {
      updatedAt: Date.now(),
    });
  };

  public update = <TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    name: FilterName,
    partial: Omit<Partial<RegisteredField<TKey, TValue>>, "value">
  ): Operation<RegisteredField<TKey, TValue>> => {
    if (Object.keys(partial).length === 0) {
      return NotExecuted;
    }

    const field = this.get<TKey, TValue>(name);

    if (field === undefined) {
      throw new Error(`Field "${name}" does not exist`);
    }

    this.override(field, partial);

    return field;
  };

  public delete = (name: FilterName): Operation<GenericRegisteredField> => {
    const field = this.get(name);

    if (field === undefined) {
      return NotExecuted;
    }

    this.#fields.delete(name);
    this.#errorManager.remove(name);

    return field as GenericRegisteredField;
  };

  public clear = (): void => {
    this.#fields.clear();
    this.#errorManager.clear();
  };

  public revalidate = (name: FilterName): boolean => {
    const field = this.get(name);

    if (!field) {
      return false;
    }

    const previous = field.errors ?? null;
    const current = this.#validate(field, field.value);

    if (previous === current) {
      return false;
    }

    this.override(field, {
      errors: current,
    });

    return true;
  };

  #validate<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
    field: RegisteredField<TKey, TValue>,
    newValue: TValue | null
  ): FieldValidationStatus {
    if (field.validate === undefined) {
      this.#errorManager.remove(field.name);
      return NoErrors;
    }

    const rules = field.validate({ value: newValue, registry: this });
    const errors = this.#validator.validate(newValue, rules, this);

    if (errors !== NoErrors && errors.all.length > 0) {
      this.#errorManager.add(field.name);
      return errors;
    }

    this.#errorManager.remove(field.name);

    return NoErrors;
  }
}

function throwAlreadyExistsErrorFor<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
  field: Field<TKey, TValue>,
  fields: Map<string, GenericRegisteredField>
) {
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
