import { getCSS } from '../../global/css';
import { objectKeys } from '../../utils/object';

export default function Ractive$toCSS() {
	const cssIds = [ this.cssId, ...this.findAllComponents().map( c => c.cssId ) ];
	const uniqueCssIds = objectKeys(cssIds.reduce( ( ids, id ) => (ids[id] = true, ids), {}));
	return getCSS( uniqueCssIds );
}
