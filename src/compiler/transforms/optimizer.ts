import * as Specification from "../../specification";

export abstract class Optimizer {
    public abstract optimize(mark: Specification.Mark): Specification.Mark;
}

export class OptimizerList extends Optimizer {
    private _optimizers: Optimizer[];
    constructor(...args: Optimizer[]) {
        super();
        this._optimizers = args;
    }
    public optimize(mark: Specification.Mark): Specification.Mark {
        let s = mark;
        for(let optimizer of this._optimizers) {
            s = optimizer.optimize(s);
        }
        return s;
    }
}

export function CreateDefaultOptimizer(): Optimizer {
    return new OptimizerList();
}