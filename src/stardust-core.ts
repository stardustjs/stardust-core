export let version = "0.0.1";

// Math classes and utilities
export * from "./core/utils";
export * from "./core/math";

// Shape class and shape specification
export * from "./core/shape";
export * from "./core/binding";
export * from "./core/spec";
export * from "./core/intrinsics";
export * from "./core/types";
export * from "./core/exceptions";

// Parsing and compiling
export * from "./core/compiler/parser";
export * from "./core/compiler/compiler";
export * from "./core/compiler/declare";

// Code transformation
export * from "./core/transform/transforms";

// Javascript context
export * from "./core/evaluator/evaluator";

// Platform base class
export * from "./core/platform";

// Scales
export * from "./core/scale/scale";
export { scale } from "./core/scale/scales";