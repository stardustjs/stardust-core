export let primitives = `
    shape Triangle(
        Vector2 p1,
        Vector2 p2,
        Vector2 p3,
        Color color = [ 0, 0, 0, 1 ]
    ) {
        emit [
            { position: p1, color: color },
            { position: p2, color: color },
            { position: p3, color: color }
        ];
    }

    shape Rectangle(
        Vector2 p1,
        Vector2 p2,
        Color color = [ 0, 0, 0, 1 ]
    ) {
        emit [
            { position: Vector2(p1.x, p1.y), color: color },
            { position: Vector2(p2.x, p1.y), color: color },
            { position: Vector2(p2.x, p2.y), color: color }
        ];
        emit [
            { position: Vector2(p1.x, p1.y), color: color },
            { position: Vector2(p1.x, p2.y), color: color },
            { position: Vector2(p2.x, p2.y), color: color }
        ];
    }

    shape OutlinedRectangle(
        Vector2 p1,
        Vector2 p2,
        float width = 1,
        Color color = [ 0, 0, 0, 1 ]
    ) {
        Rectangle(p1, Vector2(p1.x + width, p2.y - width), color);
        Rectangle(Vector2(p1.x, p2.y - width), Vector2(p2.x - width, p2.y), color);
        Rectangle(Vector2(p1.x + width, p1.y), Vector2(p2.x, p1.y + width), color);
        Rectangle(Vector2(p2.x - width, p1.y + width), p2, color);
    }

    shape Hexagon(
        Vector2 center,
        float radius,
        Color color = [ 0, 0, 0, 1 ]
    ) {
        for(i in 0..5) {
            float a1 = i / 6.0 * PI * 2.0;
            float a2 = (i + 1) / 6.0 * PI * 2.0;
            Vector2 p1 = Vector2(radius * cos(a1), radius * sin(a1));
            Vector2 p2 = Vector2(radius * cos(a2), radius * sin(a2));
            emit [
                { position: center + p1, color: color },
                { position: center, color: color },
                { position: center + p2, color: color }
            ];
        }
    }

    shape Circle16(
        Vector2 center,
        float radius,
        Color color = [ 0, 0, 0, 1 ]
    ) {
        for(i in 0..15) {
            float a1 = i / 16.0 * PI * 2.0;
            float a2 = (i + 1) / 16.0 * PI * 2.0;
            Vector2 p1 = Vector2(radius * cos(a1), radius * sin(a1));
            Vector2 p2 = Vector2(radius * cos(a2), radius * sin(a2));
            emit [
                { position: center + p1, color: color },
                { position: center, color: color },
                { position: center + p2, color: color }
            ];
        }
    }

    shape Circle(
        Vector2 center,
        float radius,
        Color color = [ 0, 0, 0, 1 ]
    ) {
        for(i in 0..31) {
            float a1 = i / 32.0 * PI * 2.0;
            float a2 = (i + 1) / 32.0 * PI * 2.0;
            Vector2 p1 = Vector2(radius * cos(a1), radius * sin(a1));
            Vector2 p2 = Vector2(radius * cos(a2), radius * sin(a2));
            emit [
                { position: center + p1, color: color },
                { position: center, color: color },
                { position: center + p2, color: color }
            ];
        }
    }

    shape Line(
        Vector2 p1,
        Vector2 p2,
        float thickness = 1,
        Color color = [ 0, 0, 0, 1 ]
    ) {
        Vector2 d = normalize(p2 - p1);
        Vector2 t = Vector2(d.y, -d.x) * (thickness / 2);
        emit [
            { position: p1 + t, color: color },
            { position: p1 - t, color: color },
            { position: p2 + t, color: color }
        ];
        emit [
            { position: p1 - t, color: color },
            { position: p2 - t, color: color },
            { position: p2 + t, color: color }
        ];
    }
`