import { OBJECT_LITERAL } from '../../../../../config/types';
import readKeyValuePairs from './objectLiteral/keyValuePairs';

export default function ( parser ) {
	const start = parser.pos;

	// allow whitespace
	parser._allowWhitespace();

	if ( !parser._matchString( '{' ) ) {
		parser.pos = start;
		return null;
	}

	const keyValuePairs = readKeyValuePairs( parser );

	// allow whitespace between final value and '}'
	parser._allowWhitespace();

	if ( !parser._matchString( '}' ) ) {
		parser.pos = start;
		return null;
	}

	return {
		t: OBJECT_LITERAL,
		m: keyValuePairs
	};
}
