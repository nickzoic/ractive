import { splitKeypath } from '../../shared/keypaths';
import runloop from '../../global/runloop';

export default function link( there, here, options ) {
	if ( here === there || (there + '.').indexOf( here + '.' ) === 0 || (here + '.').indexOf( there + '.' ) === 0 ) {
		throw new Error( 'A keypath cannot be linked to itself.' );
	}

	const promise = runloop.start();
	let model;
	const target = ( options && options.ractive ) || this;

	const sourcePath = splitKeypath( there );
	this.viewmodel.joinAll( splitKeypath( here ) ).link( model || target.viewmodel.joinAll( sourcePath ), there );

	runloop.end();

	return promise;
}
