type BuildTuple<N extends number, T extends any[] = []> =
    T['length'] extends N
    ? T
    : BuildTuple<N, [...T, 1]>;

type NumberRange<L extends number, H extends number, T extends any[] = BuildTuple<L>, Acc = never> =
    T['length'] extends H
    ? Acc
    : NumberRange<L, H, [...T, 1], Acc | T['length']>;

type ValidHours = `0${NumberRange<0, 10>}`|`${NumberRange<1, 2>}${NumberRange<0, 10>}` | `2${NumberRange<0, 4>}`; // 01 to 23
type ValidMinutes = `0${NumberRange<0, 10>}` | `${1 | 2 | 3 | 4 | 5}${NumberRange<0, 10>}`; // 01 to 59

export type TimeInHHMM = `${ValidHours}:${ValidMinutes}`;

