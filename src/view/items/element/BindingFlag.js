import Item from '../shared/Item';
import Fragment from '../../Fragment';
import findElement from '../shared/findElement';
import { INTERPOLATOR, ELEMENT } from '../../../config/types';
import { isArray } from '../../../utils/is';

export default class BindingFlag extends Item {
	constructor ( options ) {
		super( options );

		this.owner = options.owner || options._parentFragment.owner || findElement( options._parentFragment );
		this._element = this.owner._attributeByName ? this.owner : findElement( options._parentFragment );
		this.flag = options._template.v === 'l' ? 'lazy' : 'twoway';

		if ( this._element.type === ELEMENT ) {
			if ( isArray( options._template.f ) ) {
				this._fragment = new Fragment({
					owner: this,
					_template: options._template.f
				});
			}

			this.interpolator = this._fragment &&
								this._fragment.items.length === 1 &&
								this._fragment.items[0].type === INTERPOLATOR &&
								this._fragment.items[0];
		}
	}

	bind () {
		if ( this._fragment ) this._fragment.bind();
		set( this, this.getValue(), true );
	}

	bubble () {
		if ( !this.dirty ) {
			this._element.bubble();
			this.dirty = true;
		}
	}

	getValue () {
		if ( this._fragment ) return this._fragment.valueOf();
		else if ( 'value' in this ) return this.value;
		else if ( 'f' in this._template ) return this._template.f;
		else return true;
	}

	render () {
		set( this, this.getValue(), true );
	}

	toString () { return ''; }

	unbind () {
		if ( this._fragment ) this._fragment.unbind();

		delete this._element[ this.flag ];
	}

	unrender () {
		if ( this._element.rendered ) this._element.recreateTwowayBinding();
	}

	update () {
		if ( this.dirty ) {
			if ( this._fragment ) this._fragment.update();
			set( this, this.getValue(), true );
		}
	}
}

function set ( flag, value, update ) {
	if ( value === 0 ) {
		flag.value = true;
	} else if ( value === 'true' ) {
		flag.value = true;
	} else if ( value === 'false' || value === '0' ) {
		flag.value = false;
	} else {
		flag.value = value;
	}

	const current = flag._element[ flag.flag ];
	flag._element[ flag.flag ] = flag.value;
	if ( update && !flag._element.attributes.binding && current !== flag.value ) {
		flag._element.recreateTwowayBinding();
	}

	return flag.value;
}
