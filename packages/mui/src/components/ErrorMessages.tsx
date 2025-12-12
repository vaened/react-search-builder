/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FormHelperText } from "@mui/material";
import { FieldValidationStatus, FilterName } from "@vaened/react-search-builder";
import React from "react";
import { TranslationKey, useMuiSearchBuilderConfig } from "../config";

export type ErrorMessagesProps = {
  name: FilterName;
  errors: FieldValidationStatus | undefined;
};

export const ErrorMessages: React.FC<ErrorMessagesProps> = ({ name, errors }) => {
  const { translate } = useMuiSearchBuilderConfig();

  if (!errors) {
    return null;
  }

  return errors.all.map((error, index) => {
    if (error === false) {
      return null;
    }

    const isDefault = error.code === error.name;
    const keys = isDefault ? ["validations", error.name, "default"] : ["validations", error.name, error.code];
    const translationKey = keys.filter(Boolean).join(".");

    const message = translate(translationKey as TranslationKey, {
      fallback: error.message,
      params: {
        name: error.name,
        ...(error.params ?? {}),
      },
    });

    return (
      <FormHelperText key={`field-${name}-error-${index}`} error>
        {message ?? "This field is invalid"}
      </FormHelperText>
    );
  });
};

export default ErrorMessages;
