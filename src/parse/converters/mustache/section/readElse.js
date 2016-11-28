import { ELSE } from '../../../../config/types';

const elsePattern = /^\s*else\s*/;

export default function readElse ( parser, tag ) {
	const start = parser.pos;

	if ( !parser._matchString( tag.open ) ) {
		return null;
	}

	if ( !parser._matchPattern( elsePattern ) ) {
		parser.pos = start;
		return null;
	}

	if ( !parser._matchString( tag.close ) ) {
		parser.error( `Expected closing delimiter '${tag.close}'` );
	}

	return {
		t: ELSE
	};
}