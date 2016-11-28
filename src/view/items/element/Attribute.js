import { INTERPOLATOR } from '../../../config/types';
import namespaces from '../../../config/namespaces';
import Fragment from '../../Fragment';
import Item from '../shared/Item';
import findElement from '../shared/findElement';
import getUpdateDelegate from './attribute/getUpdateDelegate';
import propertyNames from './attribute/propertyNames';
import { isArray } from '../../../utils/is';
import { safeAttributeString, camelize } from '../../../utils/dom';
import { booleanAttributes } from '../../../utils/html';

function lookupNamespace ( node, prefix ) {
	const qualified = `xmlns:${prefix}`;

	while ( node ) {
		if ( node.hasAttribute && node.hasAttribute( qualified ) ) return node.getAttribute( qualified );
		node = node.parentNode;
	}

	return namespaces[ prefix ];
}

export default class Attribute extends Item {
	constructor ( options ) {
		super( options );

		this.name = options._template.n;
		this.namespace = null;

		this.owner = options.owner || options._parentFragment.owner || options._element || findElement( options._parentFragment );
		this._element = options._element || (this.owner._attributeByName ? this.owner : findElement( options._parentFragment ) );
		this._parentFragment = options._parentFragment; // shared
		this.ractive = this._parentFragment.ractive;

		this.rendered = false;
		this.updateDelegate = null;
		this._fragment = null;

		this._element._attributeByName[ this.name ] = this;

		if ( !isArray( options._template.f ) ) {
			this.value = options._template.f;
			if ( this.value === 0 ) {
				this.value = '';
			}
		} else {
			this._fragment = new Fragment({
				owner: this,
				_template: options._template.f
			});
		}

		this.interpolator = this._fragment &&
			this._fragment.items.length === 1 &&
			this._fragment.items[0].type === INTERPOLATOR &&
			this._fragment.items[0];

		if ( this.interpolator ) this.interpolator.owner = this;
	}

	bind () {
		if ( this._fragment ) {
			this._fragment.bind();
		}
	}

	bubble () {
		if ( !this.dirty ) {
			this._parentFragment.bubble();
			this._element.bubble();
			this.dirty = true;
		}
	}

	destroyed () {
		this.updateDelegate( true );
	}

	getString () {
		return this._fragment ?
			this._fragment.toString() :
			this.value != null ? '' + this.value : '';
	}

	// TODO could getValue ever be called for a static attribute,
	// or can we assume that this.fragment exists?
	getValue () {
		return this._fragment ? this._fragment.valueOf() : booleanAttributes.test( this.name ) ? true : this.value;
	}

	render () {
		const node = this._element.node;
		this.node = node;

		// should we use direct property access, or setAttribute?
		if ( !node.namespaceURI || node.namespaceURI === namespaces.html ) {
			this.propertyName = propertyNames[ this.name ] || this.name;

			if ( node[ this.propertyName ] !== undefined ) {
				this.useProperty = true;
			}

			// is attribute a boolean attribute or 'value'? If so we're better off doing e.g.
			// node.selected = true rather than node.setAttribute( 'selected', '' )
			if ( booleanAttributes.test( this.name ) || this.isTwoway ) {
				this.isBoolean = true;
			}

			if ( this.propertyName === 'value' ) {
				node._ractive.value = this.value;
			}
		}

		if ( node.namespaceURI ) {
			const index = this.name.indexOf( ':' );
			if ( index !== -1 ) {
				this.namespace = lookupNamespace( node, this.name.slice( 0, index ) );
			} else {
				this.namespace = node.namespaceURI;
			}
		}

		this.rendered = true;
		this.updateDelegate = getUpdateDelegate( this );
		this.updateDelegate();
	}

	toString () {
		const value = this.getValue();

		// Special case - select and textarea values (should not be stringified)
		if ( this.name === 'value' && ( this._element.getAttribute( 'contenteditable' ) !== undefined || ( this._element.name === 'select' || this._element.name === 'textarea' ) ) ) {
			return;
		}

		// Special case – bound radio `name` attributes
		if ( this.name === 'name' && this._element.name === 'input' && this.interpolator && this._element.getAttribute( 'type' ) === 'radio' ) {
			return `name="{{${this.interpolator.model._getKeypath()}}}"`;
		}

		// Special case - style and class attributes and directives
		if ( this.owner === this._element && ( this.name === 'style' || this.name === 'class' || this.styleName || this.inlineClass ) ) {
			return;
		}

		if ( !this.rendered && this.owner === this._element && ( !this.name.indexOf( 'style-' ) || !this.name.indexOf( 'class-' ) ) ) {
			if ( !this.name.indexOf( 'style-' ) ) {
				this.styleName = camelize( this.name.substr( 6 ) );
			} else {
				this.inlineClass = this.name.substr( 6 );
			}

			return;
		}

		if ( booleanAttributes.test( this.name ) ) return value ? this.name : '';
		if ( value == null ) return '';

		const str = safeAttributeString( this.getString() );
		return str ?
			`${this.name}="${str}"` :
			this.name;
	}

	unbind () {
		if ( this._fragment ) this._fragment.unbind();
	}

	unrender () {
		this.updateDelegate( true );

		this.rendered = false;
	}

	update () {
		if ( this.dirty ) {
			this.dirty = false;
			if ( this._fragment ) this._fragment.update();
			if ( this.rendered ) this.updateDelegate();
			if ( this.isTwoway && !this.locked ) {
				this.interpolator.twowayBinding.lastVal( true, this.interpolator.model.get() );
			}
		}
	}
}
