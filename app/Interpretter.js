
export default class Interpretter
{
    linesToText(lines)
    {
        return lines
            .map(line =>
                line
                .map(point => '(' + point.join(', ') + ')')
                .join(', ')
            )
            .join("\n\n");
    }

    textToLines(text)
    {
        const lines = [];
        let token = '';
        let i;
        let inCoordinate = false;
        let xToken = '';
        let line = [];

        const throwError = msg => {
            throw new Error(msg + ' at char ' + i + ': ' + text.substr(i, 15));
        }
        const endLine = () => {
            if (line.length > 0) {
                lines.push(line);
            }
            line = [];
        };
        const startCoordinate = () => {
            inCoordinate = true;
            token = '';
            xToken = '';
        };
        const finishCoordinate = () => {
            line.push([parseInt(xToken), parseInt(token)]);
            token = '';
            xToken = '';
            inCoordinate = false;
        };
        const finishXToken = () => {
            xToken = token;
            token = '';
        };
        const addToToken = (char) => {
            token += char;
        };

        for (i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ' || char === '\t') {
                // no op
            } else if (char === '(') {
                if (inCoordinate) {
                    throwError('( encountered while already in coordinate context');
                }
                startCoordinate();
            } else if (char === ')') {
                if (!inCoordinate) {
                    throwError(') encountered while not in coordinate context');
                }
                if (!xToken) {
                    throwError(') encountered, but , expected');
                }
                if (!token.trim() || isNaN(token)) {
                    throwError(') encountered, but y-value expected');
                }
                finishCoordinate();
            } else if (char === ',') {
                if (inCoordinate) {
                    if (!token.trim() || isNaN(token)) {
                        throwError(', encountered, but value expected');
                    }
                    if (xToken) {
                        throwError(', encountered, but no more values are expected');
                    }
                    finishXToken();
                }
                if (!inCoordinate) {
                    // no op
                }
            } else if (char === '\n') {
                endLine();
            } else {
                if (inCoordinate) {
                    addToToken(char);
                } else {
                    // ignore noise outside of coordinates, such as ',', and ';'
                }
            }

        }

        if (inCoordinate) {
            throwError('EOF encountered, but end of coordinate expected');
        }

        endLine();
        return lines;
    }
}
