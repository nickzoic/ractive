import staticInfo from '../static/getNodeInfo';
import { isString } from '../../utils/is';

export default function getNodeInfo( node, options ) {
	if ( isString( node ) ) {
		node = this.find( node, options );
	}

	return staticInfo( node );
}
