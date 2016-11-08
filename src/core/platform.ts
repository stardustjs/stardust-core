import { Specification } from "./spec";
import { Binding } from "./binding";
import { Dictionary } from "./utils";
import { Shape } from "./shape";

export abstract class PlatformShape {
    // Is the input attribute compiled as uniform?
    public abstract isUniform(name: string): boolean;
    // Update a uniform in the spec, on isUniform(name) == true.
    public abstract updateUniform(name: string, value: Specification.Value): void;
    // Upload data to the shape.
    public abstract uploadData(data: any[]): void;

    // Render the graphics.
    public abstract render(): void;
}

export class Viewport {
}

export class Viewport2D extends Viewport {
    constructor(
        public width: number,
        public height: number
    ) { super(); }
}

export class Viewport3D extends Viewport {
    constructor(
        public width: number,
        public height: number,
        public fov: number
    ) { super(); }
}

export abstract class Platform {
    // Compile a shape specification to PlatformShape object.
    public abstract compile(shape: Shape, spec: Specification.Shape, bindings: Dictionary<Binding>): PlatformShape;
}