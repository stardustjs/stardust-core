export let version = "0.0.1";

// Math classes and utilities
export * from "./core/utils/utils";
export * from "./core/math/math";

// Mark class and mark specification
export * from "./core/mark/mark";
export * from "./core/mark/marks";
export * from "./core/binding/binding";
export * from "./core/spec/spec";
export * from "./core/intrinsics/intrinsics";
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
export * from "./core/platform/platform";

// Scales
export * from "./core/scale/scale";
export { scale } from "./core/scale/scales";