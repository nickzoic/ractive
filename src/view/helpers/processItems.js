import { TEXT } from '../../config/types';

// TODO all this code needs to die
export default function processItems ( items, values, guid, counter = 0 ) {
	return items.map( item => {
		if ( item.type === TEXT ) {
			return item._template;
		}

		if ( item._fragment ) {
			if ( item._fragment._iterations ) {
				return item._fragment._iterations.map( fragment => {
					return processItems( fragment.items, values, guid, counter );
				}).join( '' );
			} else {
				return processItems( item._fragment.items, values, guid, counter );
			}
		}

		const placeholderId = `${guid}-${counter++}`;
		const model = item.model || item.newModel;

		values[ placeholderId ] = model ?
			model.wrapper ?
				model.wrapperValue :
				model.get() :
			undefined;

		return '${' + placeholderId + '}';
	}).join( '' );
}
