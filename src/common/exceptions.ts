/* Base class for Stardust errors */
export class BaseError extends Error {
    public stack: string;
    constructor(message?: string) {
        super(message);
        this.stack = (new Error(message) as any).stack;
    }
}

/* Record the location of the input file */
export interface FileLocation {
    offset: number;
    line: number;
    column: number;
}

/* Parse error */
export class ParseError extends BaseError {
    public start: FileLocation;
    public end: FileLocation;
    public stack: string;

    constructor(message?: string, start?: FileLocation, end?: FileLocation) {
      super(message);
      this.name = "ParseError";
      this.message = message;
      this.start = start;
      this.end = end;
    }
}

/* Compile error */
export class CompileError extends BaseError {
    public start: FileLocation;
    public end: FileLocation;
    public stack: string;

    constructor(message?: string, start?: FileLocation, end?: FileLocation) {
      super(message);
      this.name = "CompileError";
      this.message = message;
      this.start = start;
      this.end = end;
    }
}

/* Runtime error */
export class RuntimeError extends BaseError {
    public start: FileLocation;
    public end: FileLocation;
    public stack: string;

    constructor(message?: string, start?: FileLocation, end?: FileLocation) {
      super(message);
      this.name = "RuntimeError";
      this.message = message;
      this.start = start;
      this.end = end;
    }
}