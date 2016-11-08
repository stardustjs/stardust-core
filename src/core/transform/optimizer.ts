import { Specification } from "../spec";

export abstract class Optimizer {
    public abstract optimize(shape: Specification.Shape): Specification.Shape;
}

export class OptimizerList extends Optimizer {
    private _optimizers: Optimizer[];
    constructor(...args: Optimizer[]) {
        super();
        this._optimizers = args;
    }
    public optimize(shape: Specification.Shape): Specification.Shape {
        let s = shape;
        for(let optimizer of this._optimizers) {
            s = optimizer.optimize(s);
        }
        return s;
    }
}

export function CreateDefaultOptimizer(): Optimizer {
    return new OptimizerList();
}