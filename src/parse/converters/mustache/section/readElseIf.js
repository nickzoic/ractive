import { ELSEIF } from '../../../../config/types';
import readExpression from '../../readExpression';

const elsePattern = /^\s*elseif\s+/;

export default function readElseIf ( parser, tag ) {
	const start = parser.pos;

	if ( !parser._matchString( tag.open ) ) {
		return null;
	}

	if ( !parser._matchPattern( elsePattern ) ) {
		parser.pos = start;
		return null;
	}

	const expression = readExpression( parser );

	if ( !parser._matchString( tag.close ) ) {
		parser.error( `Expected closing delimiter '${tag.close}'` );
	}

	return {
		t: ELSEIF,
		x: expression
	};
}
