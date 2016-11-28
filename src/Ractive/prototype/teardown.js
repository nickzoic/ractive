import Hook from '../../events/Hook';
import Promise from '../../utils/Promise';
import { removeFromArray } from '../../utils/array';
import { cancel } from '../../shared/methodCallers';
import { warnIfDebug } from '../../utils/log';

const teardownHook = new Hook( 'teardown' );
const destructHook = new Hook( 'destruct' );

// Teardown. This goes through the root fragment and all its children, removing observers
// and generally cleaning up after itself

export default function Ractive$teardown () {
	if ( this.torndown ) {
		warnIfDebug( 'ractive.teardown() was called on a Ractive instance that was already torn down' );
		return Promise.resolve();
	}

	this.shouldDestroy = true;
	return teardown( this, () => this._fragment.rendered ? this.unrender() : Promise.resolve() );
}

export function teardown ( instance, getPromise ) {
	instance.torndown = true;
	instance._viewmodel.teardown();
	instance._fragment.unbind();
	instance._observers.slice().forEach( cancel );

	if ( instance._fragment.rendered && instance.el.__ractive_instances__ ) {
		removeFromArray( instance.el.__ractive_instances__, instance );
	}

	const promise = getPromise();

	teardownHook.fire( instance );
	promise.then( () => destructHook.fire( instance ) );

	return promise;
}
