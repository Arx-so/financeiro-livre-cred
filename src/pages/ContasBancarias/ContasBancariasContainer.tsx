import { useContasBancariasPage } from './useContasBancariasPage';
import { ContasBancariasView } from './ContasBancariasView';

export default function ContasBancariasContainer() {
    const pageProps = useContasBancariasPage();
    return <ContasBancariasView {...pageProps} />;
}
