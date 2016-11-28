export default function Ractive$find ( selector, options = {} ) {
	if ( !this.el ) throw new Error( `Cannot call ractive.find('${selector}') unless instance is rendered to the DOM` );

	let node = this._fragment.find( selector, options );
	if ( node ) return node;

	const children = this._children;
	if ( options.remote ) {
		for ( let i = 0; i < children.length; i++ ) {
			if ( !children[i].instance._fragment.rendered ) continue;
			node = children[i].instance.find( selector, options );
			if ( node ) return node;
		}
	}
}
