import { FolhaPagamentoView } from './FolhaPagamentoView';
import { useFolhaPagamentoPage } from './useFolhaPagamentoPage';

export function FolhaPagamentoContainer() {
    const pageProps = useFolhaPagamentoPage();
    return <FolhaPagamentoView {...pageProps} />;
}
