let Stardust = require("../dist/stardust-core");

describe('Library', () => {
    it("Predefined Marks", () => {
        let specs = {};
        specs["line"] = Stardust.mark.line();
        specs["circle"] = Stardust.mark.circle(16);
        specs["polyline"] = Stardust.mark.polyline();
    });

    it("Custom Marks", () => {
        let mark = Stardust.mark.custom();
        mark
            .input("x", "float")
            .input("y", "float")
            .variable("z", "x + y")
        mark.add("P2D.Circle")
            .attr("center", "Vector2(x, y)")
            .attr("radius", "z")
            .attr("color", "Color(x, y, z, 1)")
        mark.compile();
    });

    it("Compiled Marks", () => {
        let mark = Stardust.mark.compile(`
            import Triangle from P3D;

            mark Point(
                center: Vector3,
                size: float,
                color: Color
            ) {
                let p1 = Vector3(center.x + size, center.y + size, center.z - size);
                let p2 = Vector3(center.x + size, center.y - size, center.z + size);
                let p3 = Vector3(center.x - size, center.y + size, center.z + size);
                let p4 = Vector3(center.x - size, center.y - size, center.z - size);
                Triangle(p1, p2, p3, color);
                Triangle(p4, p1, p2, color);
                Triangle(p4, p2, p3, color);
                Triangle(p4, p3, p1, color);
            }

            mark Line(
                p1: Vector3, p2: Vector3,
                size: float,
                color: Color
            ) {
                let x1 = Vector3(p1.x, p1.y, p1.z - size);
                let x2 = Vector3(p1.x, p1.y, p1.z + size);
                let x3 = Vector3(p2.x, p2.y, p2.z + size);
                let x4 = Vector3(p2.x, p2.y, p2.z - size);
                Triangle(x1, x2, x3, color);
                Triangle(x4, x1, x2, color);
                Triangle(x4, x2, x3, color);
                Triangle(x4, x3, x1, color);
            }

            function getPosition(year: float, dayOfYear: float, secondOfDay: float): Vector3 {
                let angle = dayOfYear / 366 * PI * 2;
                let dayScaler = (secondOfDay / 86400 - 0.5);
                let r = (year - 2006) / (2015 - 2006) * 200 + 50 + dayScaler * 50;
                let x = cos(angle) * r;
                let y = sin(angle) * r;
                let z = dayScaler * 50;
                return Vector3(x, y, z);
            }

            function getPosition2(year: float, dayOfYear: float, secondOfDay: float): Vector3 {
                let angle = dayOfYear / 366 * PI * 2;
                let r = secondOfDay / 86400 * 200 + 50;
                let x = cos(angle) * r;
                let y = sin(angle) * r;
                let z = 0;
                return Vector3(x, y, z);
            }

            mark Glyph(
                year: float,
                dayOfYear: float,
                secondOfDay: float,
                duration: float,
                t: float,
                color: Color
            ) {
                let p = getPosition(year, dayOfYear, secondOfDay);
                let p2 = getPosition2(year, dayOfYear, secondOfDay);
                Point(p * (1 - t) + p2 * t, log(1 + duration) / 2, color = color);
            }

            mark LineChart(
                year1: float,
                dayOfYear1: float,
                secondOfDay1: float,
                year2: float,
                dayOfYear2: float,
                secondOfDay2: float,
                c1: float,
                c2: float,
                t: float
            ) {
                let p1 = getPosition(year1, dayOfYear1, secondOfDay1);
                let p1p = getPosition2(year1, dayOfYear1, secondOfDay1);
                let p2 = getPosition(year2, dayOfYear2, secondOfDay2);
                let p2p = getPosition2(year2, dayOfYear2, secondOfDay2);
                p1 = p1 + (p1p - p1) * t;
                p2 = p2 + (p2p - p2) * t;
                p1 = Vector3(p1.x, p1.y, c1);
                p2 = Vector3(p2.x, p2.y, c2);
                Line(p1, p2, 0.5, Color(0, 0, 0, 0.5));
            }
        `);
    });
});

describe('Transforms', () => {
    it("FlattenEmits", () => {
        Stardust.FlattenEmits(Stardust.mark.circle(16));
        Stardust.FlattenEmits(Stardust.mark.polyline());
    });
});

// describe('Parser', () => {
//     it("Expression", () => {
//         let expr = Stardust.parseExpression("1 + 3 + 5 + 34.2 - sin(a) + cos(b - c + d)")
//         let d = new Stardust.Dictionary();
//         d.set("a", { type: "constant", valueType: "float", value: 3 });
//         d.set("b", { type: "constant", valueType: "float", value: 4 });
//         d.set("c", { type: "constant", valueType: "float", value: 5 });
//         d.set("d", { type: "constant", valueType: "float", value: 6 });
//         let e = Stardust.compileExpression(expr, d);
//         console.log(e);
//     });
// });