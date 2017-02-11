import runloop from '../global/runloop';
import { splitKeypath } from './keypaths';
import { isObject } from '../utils/is';
import { warnIfDebug } from '../utils/log';

export function set ( ractive, pairs, options ) {
	const deep = options && options.deep;
	const shuffle = options && options.shuffle;
	const promise = runloop.start( ractive, true );

	let i = pairs.length;
	while ( i-- ) {
		const model = pairs[i][0];
		const value = pairs[i][1];
		const keypath = pairs[i][2];

		if ( !model ) {
			runloop.end();
			throw new Error( `Failed to set invalid keypath '${ keypath }'` );
		}

		if ( deep ) deepSet( model, value );
		else if ( shuffle ) {
			let array = value;
			const target = model.get();
			// shuffle target array with itself
			if ( !array ) array = target;

			if ( !Array.isArray( target ) || !Array.isArray( array ) ) {
				throw new Error( 'You cannot merge an array with a non-array' );
			}

			const comparator = getComparator( shuffle );
			model.merge( array, comparator );
		} else model.set( value );
	}

	runloop.end();

	return promise;
}

const star = /\*/;
export function gather ( ractive, keypath, base ) {
	if ( !base && keypath[0] === '.' ) {
		warnIfDebug( `Attempted to set a relative keypath from a non-relative context. You can use a getNodeInfo or event object to set relative keypaths.` );
		return [];
	}

	const model = base || ractive.viewmodel;
	if ( star.test( keypath ) ) {
		return model.findMatches( splitKeypath( keypath ) );
	} else {
		return [ model.joinAll( splitKeypath( keypath ) ) ];
	}
}

export function build ( ractive, keypath, value ) {
	const sets = [];

	// set multiple keypaths in one go
	if ( isObject( keypath ) ) {
		for ( const k in keypath ) {
			if ( keypath.hasOwnProperty( k ) ) {
				sets.push.apply( sets, gather( ractive, k ).map( m => [ m, keypath[k], k ] ) );
			}
		}

	}
	// set a single keypath
	else {
		sets.push.apply( sets, gather( ractive, keypath ).map( m => [ m, value, keypath ] ) );
	}

	return sets;
}

const deepOpts = { virtual: false };
function deepSet( model, value ) {
	const dest = model.get( false, deepOpts );

	// if dest doesn't exist, just set it
	if ( dest == null || typeof value !== 'object' ) return model.set( value );
	if ( typeof dest !== 'object' ) return model.set( value );

	for ( const k in value ) {
		if ( value.hasOwnProperty( k ) ) {
			deepSet( model.joinKey( k ), value[k] );
		}
	}
}

const comparators = {};
function getComparator ( option ) {
	if ( option === true ) return null; // use existing arrays
	if ( typeof option === 'function' ) return option;

	if ( typeof option === 'string' ) {
		return comparators[ option ] || ( comparators[ option ] = thing => thing[ option ] );
	}

	throw new Error( 'If supplied, options.compare must be a string, function, or true' ); // TODO link to docs
}
