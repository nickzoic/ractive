import { splitKeypath } from '../../shared/keypaths';

export default function Ractive$get ( keypath, opts ) {
	if ( typeof keypath !== 'string' ) return this.viewmodel.get( true, keypath );

	const keys = splitKeypath( keypath );
	return this.viewmodel.joinAll( keys ).get( true, opts );
}
