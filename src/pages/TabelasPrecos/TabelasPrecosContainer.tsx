import { TabelasPrecosView } from './TabelasPrecosView';
import { useTabelasPrecosPage } from './useTabelasPrecosPage';

export function TabelasPrecosContainer() {
    const pageProps = useTabelasPrecosPage();
    return <TabelasPrecosView {...pageProps} />;
}
