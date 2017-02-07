import { badArguments } from '../../config/errors';
import { gather, set } from '../../shared/set';
import { isString } from '../../utils/is';

export default function Ractive$toggle ( keypath ) {
	if ( !isString( keypath ) ) {
		throw new TypeError( badArguments );
	}

	return set( this, gather( this, keypath ).map( m => [ m, !m.get() ] ) );
}
