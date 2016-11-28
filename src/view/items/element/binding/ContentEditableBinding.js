import Binding from './Binding';
import handleDomEvent from './handleDomEvent';

export default class ContentEditableBinding extends Binding {
	getInitialValue () {
		return this._element._fragment ? this._element._fragment.toString() : '';
	}

	getValue () {
		return this._element.node.innerHTML;
	}

	render () {
		super.render();

		const node = this.node;

		node.addEventListener( 'change', handleDomEvent, false );
		node.addEventListener( 'blur', handleDomEvent, false );

		if ( !this.ractive.lazy ) {
			node.addEventListener( 'input', handleDomEvent, false );

			if ( node.attachEvent ) {
				node.addEventListener( 'keyup', handleDomEvent, false );
			}
		}
	}

	setFromNode ( node ) {
		this.model.set( node.innerHTML );
	}

	unrender () {
		const node = this.node;

		node.removeEventListener( 'blur', handleDomEvent, false );
		node.removeEventListener( 'change', handleDomEvent, false );
		node.removeEventListener( 'input', handleDomEvent, false );
		node.removeEventListener( 'keyup', handleDomEvent, false );
	}
}
