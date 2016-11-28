import { getQuery } from './shared/Query';

export default function Ractive$findAllComponents ( selector, options ) {
	if ( !options && typeof selector === 'object' ) {
		options = selector;
		selector = '';
	}

	options = options || {};

	let query = options._query;

	if ( !query ) {
		query = getQuery( this, selector, options, true );
		if ( query.old ) return query.old;
	}

	this._fragment.findAllComponents( selector, query );

	if ( query.remote ) {
		// search non-fragment children
		this._children.forEach( c => {
			if ( !c.target && c.instance._fragment && c.instance._fragment.rendered ) {
				if ( query.test( c ) ) {
					query.add( c.instance );
					c.__liveQueries.push( query );
				}

				c.instance.findAllComponents( selector, options );
			}
		});
	}

	query.init();
	return query.result;
}

