/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

type IsRecord<T> = T extends object ? (T extends readonly any[] ? false : T extends Function ? false : true) : false;

export type Nullable<T> = T | null;

export type NonUndefined<T> = Exclude<T, undefined>;

export type NoInfer<T> = T & { readonly __noinfer?: never };

export type UnpackedValue<T> = T extends (infer U)[] ? U : T;

export type Paths<T> =
  IsRecord<T> extends true
    ? {
        [K in keyof T & string]: IsRecord<T[K]> extends true ? `${K}.${Paths<T[K]>}` : `${K}`;
      }[keyof T & string]
    : never;

export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;
