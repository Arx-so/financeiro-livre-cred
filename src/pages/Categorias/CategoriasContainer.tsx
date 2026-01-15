import { useCategoriasPage } from './useCategoriasPage';
import { CategoriasView } from './CategoriasView';

export default function CategoriasContainer() {
    const pageProps = useCategoriasPage();
    return <CategoriasView {...pageProps} />;
}
