type BuildTuple<N extends number, T extends any[] = []> =
    T['length'] extends N
    ? T
    : BuildTuple<N, [...T, 1]>;

type NumberRange<L extends number, H extends number, T extends any[] = BuildTuple<L>, Acc = never> =
    T['length'] extends H
    ? Acc
    : NumberRange<L, H, [...T, 1], Acc | T['length']>;


type YearRange = `20${NumberRange<0, 10>}${NumberRange<0, 10>}`;
type MonthRange = `0${NumberRange<1, 10>}` | `1${0 | 1 | 2}`;
type DayRange = `0${NumberRange<1, 10>}` | `${1 | 2}${NumberRange<0, 10>}` | `30` | `31`;

export type YYYYMMDD = `${YearRange}-${MonthRange}-${DayRange}`;


export type DateRange = [string, string];