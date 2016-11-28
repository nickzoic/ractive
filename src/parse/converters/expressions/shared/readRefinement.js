import { REFINEMENT } from '../../../../config/types';
import { expectedExpression } from './errors';
import { name as namePattern } from './patterns';
import readExpression from '../../readExpression';

export default function readRefinement ( parser ) {
	// some things call for strict refinement (partial names), meaning no space between reference and refinement
	if ( !parser.strictRefinement ) {
		parser._allowWhitespace();
	}

	// "." name
	if ( parser._matchString( '.' ) ) {
		parser._allowWhitespace();

		const name = parser._matchPattern( namePattern );
		if ( name ) {
			return {
				t: REFINEMENT,
				n: name
			};
		}

		parser.error( 'Expected a property name' );
	}

	// "[" expression "]"
	if ( parser._matchString( '[' ) ) {
		parser._allowWhitespace();

		const expr = readExpression( parser );
		if ( !expr ) parser.error( expectedExpression );

		parser._allowWhitespace();

		if ( !parser._matchString( ']' ) ) parser.error( `Expected ']'` );

		return {
			t: REFINEMENT,
			x: expr
		};
	}

	return null;
}
