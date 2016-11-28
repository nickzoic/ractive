const delimiterChangePattern = /^[^\s=]+/;
const whitespacePattern = /^\s+/;

export default function readDelimiterChange ( parser ) {
	if ( !parser._matchString( '=' ) ) {
		return null;
	}

	const start = parser.pos;

	// allow whitespace before new opening delimiter
	parser._allowWhitespace();

	const opening = parser._matchPattern( delimiterChangePattern );
	if ( !opening ) {
		parser.pos = start;
		return null;
	}

	// allow whitespace (in fact, it's necessary...)
	if ( !parser._matchPattern( whitespacePattern ) ) {
		return null;
	}

	const closing = parser._matchPattern( delimiterChangePattern );
	if ( !closing ) {
		parser.pos = start;
		return null;
	}

	// allow whitespace before closing '='
	parser._allowWhitespace();

	if ( !parser._matchString( '=' ) ) {
		parser.pos = start;
		return null;
	}

	return [ opening, closing ];
}
