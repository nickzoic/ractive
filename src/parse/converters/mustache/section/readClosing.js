import { CLOSING } from '../../../../config/types';

export default function readClosing ( parser, tag ) {
	const start = parser.pos;

	if ( !parser._matchString( tag.open ) ) {
		return null;
	}

	parser._allowWhitespace();

	if ( !parser._matchString( '/' ) ) {
		parser.pos = start;
		return null;
	}

	parser._allowWhitespace();

	const remaining = parser.remaining();
	const index = remaining.indexOf( tag.close );

	if ( index !== -1 ) {
		const closing = {
			t: CLOSING,
			r: remaining.substr( 0, index ).split( ' ' )[0]
		};

		parser.pos += index;

		if ( !parser._matchString( tag.close ) ) {
			parser.error( `Expected closing delimiter '${tag.close}'` );
		}

		return closing;
	}

	parser.pos = start;
	return null;
}
