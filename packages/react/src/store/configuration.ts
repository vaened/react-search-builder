/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import type { FilterName } from "../field";
import type { FieldBatchTransaction, FieldOperation } from "./FieldStore";
import type { FieldsCollection } from "./FieldsCollection";

export type BeforeSubmitContext = {
  dirtyFields: readonly FilterName[];
  trigger: FieldOperation;
  collection: FieldsCollection;
  transaction: FieldBatchTransaction;
};

export type BeforeSubmit = (context: BeforeSubmitContext) => void;

export type FieldStoreConfiguration = {
  beforeSubmit?: BeforeSubmit;
};
