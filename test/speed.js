let Stardust = require("../dist/stardust-core");

function Run100TimesAndTime(f) {
    let t0 = new Date().getTime();
    for(let i = 0; i < 100; i++) {
        f();
    }
    let t1 = new Date().getTime();
    return (t1 - t0) / 100;
}

describe('Library', () => {
    it("Predefined Shapes", () => {
        let time;
        time = Run100TimesAndTime(() => {
            Stardust.shape.line();
        });
        console.log("Stardust.shape.line()", time + "ms");
        time = Run100TimesAndTime(() => {
            Stardust.shape.circle();
        });
        console.log("Stardust.shape.circle()", time + "ms");
        time = Run100TimesAndTime(() => {
            Stardust.shape.polyline();
        });
        console.log("Stardust.shape.polyline()", time + "ms");
    });
});