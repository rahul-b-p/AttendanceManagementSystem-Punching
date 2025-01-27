export enum Unit {
    Years = "Years",
    Year = "Year",
    Yrs = "Yrs",
    Yr = "Yr",
    Y = "Y",
    Weeks = "Weeks",
    Week = "Week",
    W = "W",
    Days = "Days",
    Day = "Day",
    D = "D",
    Hours = "Hours",
    Hour = "Hour",
    Hrs = "Hrs",
    Hr = "Hr",
    H = "H",
    Minutes = "Minutes",
    Minute = "Minute",
    Mins = "Mins",
    Min = "Min",
    M = "M",
    Seconds = "Seconds",
    Second = "Second",
    Secs = "Secs",
    Sec = "Sec",
    s = "s",
    Milliseconds = "Milliseconds",
    Millisecond = "Millisecond",
    Msecs = "Msecs",
    Msec = "Msec",
    Ms = "Ms"
}



type UnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;

export type StringValue =
    | `${number}`
    | `${number}${UnitAnyCase}`
    | `${number} ${UnitAnyCase}`;