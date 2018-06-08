import { MathType } from "./math";

/** Color class. Stardust use colors with range 0-1 instead of 0-255, different from HTML! */
export class Color extends MathType {
    /** Create a new Color, rgba ranges are 0 to 1 */
    constructor(
        public r: number = 0,
        public g: number = 0,
        public b: number = 0,
        public a: number = 1) { super(); }

    public toArray(): number[] {
        return [this.r, this.g, this.b, this.a];
    }
    public clone(): Color {
        return new Color(this.r, this.g, this.b, this.a);
    }
    /** Create a color from an array of numbers [r, g, b, a] */
    public static FromArray([r, g, b, a]: number[]): Color {
        return new Color(r, g, b, a);
    }
    /** Create a color from HTML color code rgb(r, g, b), rgba(r, g, b, a), #RRGGBB, #RGB */
    public static FromHTML(html: string, alpha: number = 1) {
        return Color.FromArray(colorFromHTML(html, alpha));
    }
}

/** Get color quadruple from HTML color code */
export function colorFromHTML(html: string = "#000000", alpha: number = 1): number[] {
    let m: RegExpMatchArray;
    m = html.match(/^ *rgb *\( *([0-9\.\-e]+) *, *([0-9\.\-e]+) *, *([0-9\.\-e]+) *\) *$/);
    if (m) {
        return [+m[1] / 255.0, +m[2] / 255.0, +m[3] / 255.0, alpha];
    }
    m = html.match(/^ *rgba *\( *([0-9\.\-e]+) *, *([0-9\.\-e]+) *, *([0-9\.\-e]+) *, *([0-9\.\-e]+) *\) *$/);
    if (m) {
        return [+m[1] / 255.0, +m[2] / 255.0, +m[3] / 255.0, alpha * +m[4]];
    }
    m = html.match(/^ *\#([0-9a-fA-F]{3}) *$/);
    if (m) {
        let r = parseInt(m[1][0], 16) * 17;
        let g = parseInt(m[1][1], 16) * 17;
        let b = parseInt(m[1][2], 16) * 17;
        return [r / 255.0, g / 255.0, b / 255.0, alpha];
    }
    m = html.match(/^ *\#([0-9a-fA-F]{6}) *$/);
    if (m) {
        let r = parseInt(m[1].slice(0, 2), 16);
        let g = parseInt(m[1].slice(2, 4), 16);
        let b = parseInt(m[1].slice(4, 6), 16);
        return [r / 255.0, g / 255.0, b / 255.0, alpha];
    }
    return [0, 0, 0, 1];
}