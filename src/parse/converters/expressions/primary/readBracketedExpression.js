import { BRACKETED } from '../../../../config/types';
import { expectedExpression, expectedParen } from '../shared/errors';
import readExpression from '../../readExpression';

export default function readBracketedExpression ( parser ) {
	if ( !parser._matchString( '(' ) ) return null;

	parser._allowWhitespace();

	const expr = readExpression( parser );

	if ( !expr ) parser.error( expectedExpression );

	parser._allowWhitespace();

	if ( !parser._matchString( ')' ) ) parser.error( expectedParen );

	return {
		t: BRACKETED,
		x: expr
	};
}
