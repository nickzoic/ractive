import { createFunction } from '../Ractive/config/runtime-parser';
import { objectKeys } from '../utils/object';

const functions = Object.create( null );

export default function getFunction ( str, i ) {
	if ( functions[ str ] ) return functions[ str ];
	return functions[ str ] = createFunction( str, i );
}

export function addFunctions( template ) {
	if ( !template ) return;

	const exp = template.e;

	if ( !exp ) return;

	objectKeys( exp ).forEach( ( str ) => {
		if ( functions[ str ] ) return;
		functions[ str ] = exp[ str ];
	});
}


