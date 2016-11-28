import { createDocumentFragment } from '../../../utils/dom';
import noop from '../../../utils/noop';

export default class Item {
	constructor ( options ) {
		this._parentFragment = options._parentFragment;
		this.ractive = options._parentFragment.ractive;

		this._template = options._template;
		this.index = options.index;
		this.type = options._template.t;

		this.dirty = false;
	}

	bubble () {
		if ( !this.dirty ) {
			this.dirty = true;
			this._parentFragment.bubble();
		}
	}

	destroyed () {
		if ( this._fragment ) this._fragment.destroyed();
	}

	find () {
		return null;
	}

	findComponent () {
		return null;
	}

	findNextNode () {
		return this._parentFragment.findNextNode( this );
	}

	shuffled () {
		if ( this._fragment ) this._fragment.shuffled();
	}

	valueOf () {
		return this.toString();
	}
}

Item.prototype.findAll = noop;
Item.prototype.findAllComponents = noop;

export class ContainerItem extends Item {
	constructor ( options ) {
		super( options );
	}

	detach () {
		return this._fragment ? this._fragment.detach() : createDocumentFragment();
	}

	find ( selector ) {
		if ( this._fragment ) {
			return this._fragment.find( selector );
		}
	}

	findAll ( selector, query ) {
		if ( this._fragment ) {
			this._fragment.findAll( selector, query );
		}
	}

	findComponent ( name ) {
		if ( this._fragment ) {
			return this._fragment.findComponent( name );
		}
	}

	findAllComponents ( name, query ) {
		if ( this._fragment ) {
			this._fragment.findAllComponents( name, query );
		}
	}

	firstNode ( skipParent ) {
		return this._fragment && this._fragment.firstNode( skipParent );
	}

	toString ( escape ) {
		return this._fragment ? this._fragment.toString( escape ) : '';
	}
}
