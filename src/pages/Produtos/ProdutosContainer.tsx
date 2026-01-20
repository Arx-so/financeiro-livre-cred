import { ProdutosView } from './ProdutosView';
import { useProdutosPage } from './useProdutosPage';

export function ProdutosContainer() {
    const pageProps = useProdutosPage();
    return <ProdutosView {...pageProps} />;
}
