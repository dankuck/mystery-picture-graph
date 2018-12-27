
const sameX = (a, b) => a[0] === b[0];
const sameY = (a, b) => a[1] === b[1];
const equal = (a, b) => sameX(a, b) && sameY(a, b);
const numbersAreInOrder = (a, b, c) => (a <= b && b <= c) || (c <= b && b <= a);

export default class LineSimplifier
{
    simplify(line)
    {
        line = line.slice();

        let i;
        const removePoint = () => {
            line.splice(i, 1);
            i--;
        };

        for (i = 1; i < line.length - 1; i++) {
            if (this.pointsAreInLine(line[i - 1], line[i], line[i + 1])) {
                removePoint();
            }
        }

        // a 2-point line gets skipped by the loop above, so do this one check
        if (line.length === 2) {
            if (equal(line[0], line[1])) {
                return [line[0]];
            }
        }

        return line;
    }

    pointsAreInLine(prev, current, next)
    {
        if (!numbersAreInOrder(prev[0], current[0], next[0])) {
            return false;
        }

        if (!numbersAreInOrder(prev[1], current[1], next[1])) {
            return false;
        }

        if (equal(prev, current) || equal(current, next)) {
            return true;
        }

        if (sameX(prev, current) && sameX(current, next)) {
            return true;
        }

        if (sameY(prev, current) && sameY(current, next)) {
            return true;
        }

        /**
         * p = previous point
         * c = current point
         * n = next point
         * A = horizontal distance from p to c
         * B = horizontal distance from p to n
         * C = vertical distance from p to c
         * D = vertical distance from p to n
         *
         * All values should be integers in this application
         *
         *     A |
         *  (p)------------+
         *   |\            |
         * C | \           |
         *   |  \          |
         * --|  (c)        |
         *   |    \        |
         *   |     \       |
         *   |      \      | D
         *   |       \     |
         *   |        \    |
         *   |         \   |
         *   |          \  |
         *   |           \ |
         *   |            \|
         *   +------------(n)
         *          B
         */

        const A = current[0] - prev[0];
        const B = next[0] - prev[0];
        const C = current[1] - prev[1];
        const D = next[1] - prev[1];

        // B should be a multiple of A
        if (B % A !== 0) {
            return false;
        }

        // D should be a multiple of C
        if (D % C !== 0) {
            return false;
        }

        // Since we know they are multiples, we know that these quotients will
        // also be integers. But since computers are jerks, they might just be
        // floats very close to integers, so we need to round.
        const verticalMultiples = Math.round(B / A);
        const horizontalMultiples = Math.round(D / C);
        if (verticalMultiples === horizontalMultiples) {
            return true;
        } else {
            return false;
        }

    }
}
