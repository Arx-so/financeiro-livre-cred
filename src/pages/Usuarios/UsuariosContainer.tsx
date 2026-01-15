import { useUsuariosPage } from './useUsuariosPage';
import { UsuariosView } from './UsuariosView';

export default function UsuariosContainer() {
    const pageProps = useUsuariosPage();
    return <UsuariosView {...pageProps} />;
}
