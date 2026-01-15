import { useFavorecidosPage } from './useFavorecidosPage';
import { FavorecidosView } from './FavorecidosView';

export default function FavorecidosContainer() {
    const pageProps = useFavorecidosPage();
    return <FavorecidosView {...pageProps} />;
}
