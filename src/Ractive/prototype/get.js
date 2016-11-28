import { splitKeypath } from '../../shared/keypaths';
import resolveReference from '../../view/resolvers/resolveReference';

export default function Ractive$get ( keypath, opts ) {
	if ( typeof keypath !== 'string' ) return this._viewmodel.get( true, keypath );

	const keys = splitKeypath( keypath );
	const key = keys[0];

	let model;

	if ( !this._viewmodel.has( key ) ) {
		// if this is an inline component, we may need to create
		// an implicit mapping
		if ( this.component && !this.isolated ) {
			model = resolveReference( this.component._parentFragment, key );

			if ( model ) {
				this._viewmodel.map( key, model, { implicit: true } );
			}
		}
	}

	model = this._viewmodel.joinAll( keys );
	return model.get( true, opts );
}
