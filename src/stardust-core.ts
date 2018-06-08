export let version = "1.0.0";

// Math classes and utilities
export * from "./common";

import * as Specification from "./specification";
import * as Intrinsics from "./intrinsics";
import * as Compiler from "./compiler";

export { Specification, Intrinsics, Compiler };

export * from "./binding";
export * from "./mark";
export * from "./scale";
export * from "./platform";
