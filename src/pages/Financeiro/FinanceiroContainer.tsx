import { useFinanceiroPage } from './useFinanceiroPage';
import { FinanceiroView } from './FinanceiroView';

export default function FinanceiroContainer() {
    const pageProps = useFinanceiroPage();
    return <FinanceiroView {...pageProps} />;
}
