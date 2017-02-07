const toString = Object.prototype.toString;
const arrayLikePattern = /^\[object (?:Array|FileList)\]$/;

export function isArray ( thing ) {
	return Array.isArray( thing );
}

export function isArrayLike ( obj ) {
	return arrayLikePattern.test( toString.call( obj ) );
}

export function isEqual ( a, b ) {
	if ( a === null && b === null ) {
		return true;
	}

	if ( isObjectType( a ) || isObjectType( b ) ) {
		return false;
	}

	return a === b;
}

export function isFunction ( thing ) {
	return typeof thing === 'function';
}

// http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
export function isNumeric ( thing ) {
	return !isNaN( parseFloat( thing ) ) && isFinite( thing );
}

export function isNumber ( thing ) {
	return typeof thing === 'number';
}

export function isObject ( thing ) {
	return ( thing && toString.call( thing ) === '[object Object]' );
}

export function isObjectType ( thing ) {
	return typeof thing === 'object';
}

export function isObjectLike ( thing ) {
	if ( !thing ) return false;
	const type = typeof thing;
	if ( type === 'object' || type === 'function' ) return true;
}

export function isString ( thing ) {
	return typeof thing === 'string';
}
