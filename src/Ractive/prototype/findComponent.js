export default function Ractive$findComponent ( selector, options = {} ) {
	if ( typeof selector === 'object' ) {
		options = selector;
		selector = '';
	}

	let child = this._fragment.findComponent( selector, options );
	if ( child ) return child;

	const children = this._children;
	if ( options.remote ) {
		if ( !selector && children.length ) return children[0].instance;
		for ( let i = 0; i < children.length; i++ ) {
			// skip children that are or should be in an anchor
			if ( children[i].target ) continue;
			if ( children[i].name === selector ) return children[i].instance;
			child = children[i].instance.findComponent( selector, options );
			if ( child ) return child;
		}
	}
}

