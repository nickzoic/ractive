import Parser from '../parse/Parser';
import readStringLiteral from '../parse/converters/expressions/primary/literal/readStringLiteral';
import readKey from '../parse/converters/expressions/shared/readKey';

// simple JSON parser, without the restrictions of JSON parse
// (i.e. having to double-quote keys).
//
// If passed a hash of values as the second argument, ${placeholders}
// will be replaced with those values

const specials = {
	true: true,
	false: false,
	null: null,
	undefined
};

const specialsPattern = new RegExp( '^(?:' + Object.keys( specials ).join( '|' ) + ')' );
const numberPattern = /^(?:[+-]?)(?:(?:(?:0|[1-9]\d*)?\.\d+)|(?:(?:0|[1-9]\d*)\.)|(?:0|[1-9]\d*))(?:[eE][+-]?\d+)?/;
const placeholderPattern = /\$\{([^\}]+)\}/g;
const placeholderAtStartPattern = /^\$\{([^\}]+)\}/;
const onlyWhitespace = /^\s*$/;

const JsonParser = Parser.extend({
	init ( str, options ) {
		this.values = options.values;
		this._allowWhitespace();
	},

	postProcess ( result ) {
		if ( result.length !== 1 || !onlyWhitespace.test( this.leftover ) ) {
			return null;
		}

		return { value: result[0].v };
	},

	converters: [
		function getPlaceholder ( parser ) {
			if ( !parser.values ) return null;

			const placeholder = parser._matchPattern( placeholderAtStartPattern );

			if ( placeholder && ( parser.values.hasOwnProperty( placeholder ) ) ) {
				return { v: parser.values[ placeholder ] };
			}
		},

		function getSpecial ( parser ) {
			const special = parser._matchPattern( specialsPattern );
			if ( special ) return { v: specials[ special ] };
		},

		function getNumber ( parser ) {
			const number = parser._matchPattern( numberPattern );
			if ( number ) return { v: +number };
		},

		function getString ( parser ) {
			const stringLiteral = readStringLiteral( parser );
			const values = parser.values;

			if ( stringLiteral && values ) {
				return {
					v: stringLiteral.v.replace( placeholderPattern, ( match, $1 ) => ( $1 in values ? values[ $1 ] : $1 ) )
				};
			}

			return stringLiteral;
		},

		function getObject ( parser ) {
			if ( !parser._matchString( '{' ) ) return null;

			const result = {};

			parser._allowWhitespace();

			if ( parser._matchString( '}' ) ) {
				return { v: result };
			}

			let pair;
			while ( pair = getKeyValuePair( parser ) ) {
				result[ pair.key ] = pair.value;

				parser._allowWhitespace();

				if ( parser._matchString( '}' ) ) {
					return { v: result };
				}

				if ( !parser._matchString( ',' ) ) {
					return null;
				}
			}

			return null;
		},

		function getArray ( parser ) {
			if ( !parser._matchString( '[' ) ) return null;

			const result = [];

			parser._allowWhitespace();

			if ( parser._matchString( ']' ) ) {
				return { v: result };
			}

			let valueToken;
			while ( valueToken = parser.read() ) {
				result.push( valueToken.v );

				parser._allowWhitespace();

				if ( parser._matchString( ']' ) ) {
					return { v: result };
				}

				if ( !parser._matchString( ',' ) ) {
					return null;
				}

				parser._allowWhitespace();
			}

			return null;
		}
	]
});

function getKeyValuePair ( parser ) {
	parser._allowWhitespace();

	const key = readKey( parser );

	if ( !key ) return null;

	const pair = { key };

	parser._allowWhitespace();
	if ( !parser._matchString( ':' ) ) {
		return null;
	}
	parser._allowWhitespace();

	const valueToken = parser.read();

	if ( !valueToken ) return null;

	pair.value = valueToken.v;
	return pair;
}

export default function ( str, values ) {
	const parser = new JsonParser( str, { values });
	return parser.result;
}
