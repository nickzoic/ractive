import wrap from '../utils/wrapMethod';
import registries from '../Ractive/config/registries';
import Ractive from '../Ractive';
import { isFunction } from '../utils/is';
import { objectKeys } from '../utils/object';

export default function unwrap ( Child ) {
	const options = {};

	while ( Child ) {
		addRegistries( Child, options );
		addOtherOptions( Child, options );

		if ( Child._Parent !== Ractive ) {
			Child = Child._Parent;
		} else {
			Child = false;
		}
	}

	return options;
}

function addRegistries ( Child, options ) {
	registries.forEach( r => {
		addRegistry(
			r.useDefaults ? Child.prototype : Child,
			options, r.name );
	});
}

function addRegistry ( target, options, name ) {
	let registry;
	const keys = objectKeys( target[ name ] );

	if ( !keys.length ) { return; }

	if ( !( registry = options[ name ] ) ) {
		registry = options[ name ] = {};
	}

	keys
		.filter( key => !( key in registry ) )
		.forEach( key => registry[ key ] = target[ name ][ key ] );
}

function addOtherOptions ( Child, options ) {
	objectKeys( Child.prototype ).forEach( key => {
		if ( key === 'computed' ) { return; }

		let value = Child.prototype[ key ];

		if ( !( key in options ) ) {
			options[ key ] = value._method ? value._method : value;
		}

		// is it a wrapped function?
		else if ( isFunction( options[ key ] )
				&& isFunction( value )
				&& options[ key ]._method ) {

			const needsSuper = value._method;

			if ( needsSuper ) { value = value._method; }

			// rewrap bound directly to parent fn
			const result = wrap( options[ key ]._method, value );

			if ( needsSuper ) { result._method = result; }

			options[ key ] = result;
		}
	});
}
