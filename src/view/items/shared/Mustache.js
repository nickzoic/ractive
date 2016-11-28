import Item, { ContainerItem } from './Item';
import resolve from '../../resolvers/resolve';
import { rebindMatch } from '../../../shared/rebind';

export default class Mustache extends Item {
	constructor ( options ) {
		super( options );

		this._parentFragment = options._parentFragment;
		this._template = options._template;
		this.index = options.index;
		if ( options.owner ) this.parent = options.owner;

		this.isStatic = !!options._template.s;

		this.model = null;
		this.dirty = false;
	}

	bind () {
		// yield mustaches should resolve in container context
		const start = this.containerFragment || this._parentFragment;
		// try to find a model for this view
		const model = resolve( start, this._template );
		const value = model ? model.get() : undefined;

		if ( this.isStatic ) {
			this.model = { get: () => value };
			return;
		}

		if ( model ) {
			model.register( this );
			this.model = model;
		} else {
			this.resolver = start.resolve( this._template.r, model => {
				this.model = model;
				model.register( this );

				this._handleChange();
				this.resolver = null;
			});
		}
	}

	_handleChange () {
		this.bubble();
	}

	rebind ( next, previous, safe ) {
		next = rebindMatch( this._template, next, previous, this._parentFragment );
		if ( next === this.model ) return false;

		if ( this.model ) {
			this.model.unregister( this );
		}
		if ( next ) next.addShuffleRegister( this, 'mark' );
		this.model = next;
		if ( !safe ) this._handleChange();
		return true;
	}

	unbind () {
		if ( !this.isStatic ) {
			this.model && this.model.unregister( this );
			this.model = undefined;
			this.resolver && this.resolver.unbind();
		}
	}
}

export class MustacheContainer extends ContainerItem {
	constructor ( options ) {
		super( options );
	}
}
const proto = MustacheContainer.prototype;
const mustache = Mustache.prototype;
proto.bind = mustache.bind;
proto._handleChange = mustache._handleChange;
proto.rebind = mustache.rebind;
proto.unbind = mustache.unbind;
