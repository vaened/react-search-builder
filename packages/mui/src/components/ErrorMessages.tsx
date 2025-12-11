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

export type ErrorMessagesProps = {
  name: FilterName;
  errors: FieldValidationStatus | undefined;
};

export const ErrorMessages: React.FC<ErrorMessagesProps> = ({ name, errors }) => {
  if (!errors) {
    return;
  }

  return errors.all.map((error, index) =>
    error === false ? null : (
      <FormHelperText key={`field-${name}-error-${index}`} error>
        {error.message}
      </FormHelperText>
    )
  );
};

export default ErrorMessages;
