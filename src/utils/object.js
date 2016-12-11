export const defineProperty = Object.defineProperty;
export const defineProperties = Object.defineProperties;
export const create = Object.create;

export function extend ( target, ...sources ) {
	let prop;

	sources.forEach( source => {
		for ( prop in source ) {
			if ( hasOwn.call( source, prop ) ) {
				target[ prop ] = source[ prop ];
			}
		}
	});

	return target;
}

export function fillGaps ( target, ...sources ) {
	sources.forEach( s => {
		for ( const key in s ) {
			if ( hasOwn.call( s, key ) && !( key in target ) ) {
				target[ key ] = s[ key ];
			}
		}
	});

	return target;
}

export const hasOwn = Object.prototype.hasOwnProperty;

export function toPairs ( obj = {} ) {
	const res = [];
	for ( const k in obj ) {
		if ( hasOwn.call( obj, k ) ) res.push( [ k, obj[k] ] );
	}
	return res;
}
