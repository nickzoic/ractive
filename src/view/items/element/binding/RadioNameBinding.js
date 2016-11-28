import Binding from './Binding';
import getBindingGroup from './getBindingGroup';
import handleDomEvent from './handleDomEvent';

function getValue() {
	const checked = this.bindings.filter( b => b.node.checked );
	if ( checked.length > 0 ) {
		return checked[0]._element.getAttribute( 'value' );
	}
}

export default class RadioNameBinding extends Binding {
	constructor ( element ) {
		super( element, 'name' );

		this.group = getBindingGroup( 'radioname', this.model, getValue );
		this.group.add( this );

		if ( element.checked ) {
			this.group.value = this.getValue();
		}
	}

	bind () {
		if ( !this.group.bound ) {
			this.group.bind();
		}

		// update name keypath when necessary
		this.nameAttributeBinding = {
			_handleChange: () => this.node.name = `{{${this.model._getKeypath()}}}`
		};

		this.model.getKeypathModel().register( this.nameAttributeBinding );
	}

	getInitialValue () {
		if ( this._element.getAttribute( 'checked' ) ) {
			return this._element.getAttribute( 'value' );
		}
	}

	getValue () {
		return this._element.getAttribute( 'value' );
	}

	_handleChange () {
		// If this <input> is the one that's checked, then the value of its
		// `name` model gets set to its value
		if ( this.node.checked ) {
			this.group.value = this.getValue();
			super._handleChange();
		}
	}

	lastVal ( setting, value ) {
		if ( !this.group ) return;
		if ( setting ) this.group.lastValue = value;
		else return this.group.lastValue;
	}

	render () {
		super.render();

		const node = this.node;

		node.name = `{{${this.model._getKeypath()}}}`;
		node.checked = this.model.get() == this._element.getAttribute( 'value' );

		node.addEventListener( 'change', handleDomEvent, false );

		if ( node.attachEvent ) {
			node.addEventListener( 'click', handleDomEvent, false );
		}
	}

	setFromNode ( node ) {
		if ( node.checked ) {
			this.group.model.set( this._element.getAttribute( 'value' ) );
		}
	}

	unbind () {
		this.group.remove( this );

		this.model.getKeypathModel().unregister( this.nameAttributeBinding );
	}

	unrender () {
		const node = this.node;

		node.removeEventListener( 'change', handleDomEvent, false );
		node.removeEventListener( 'click', handleDomEvent, false );
	}
}
