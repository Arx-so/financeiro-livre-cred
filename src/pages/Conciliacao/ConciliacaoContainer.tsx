import { useConciliacaoPage } from './useConciliacaoPage';
import { ConciliacaoView } from './ConciliacaoView';

export default function ConciliacaoContainer() {
    const pageProps = useConciliacaoPage();
    return <ConciliacaoView {...pageProps} />;
}
