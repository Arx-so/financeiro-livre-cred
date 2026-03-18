import { useFavorecidosPage } from '@/pages/Favorecidos/useFavorecidosPage';
import { FavorecidosView } from '@/pages/Favorecidos/FavorecidosView';

export default function Funcionarios() {
    const pageProps = useFavorecidosPage({ lockedType: 'funcionario' });
    return <FavorecidosView {...pageProps} />;
}
