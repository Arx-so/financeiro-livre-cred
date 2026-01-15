import { useCadastrosPage } from './useCadastrosPage';
import { CadastrosView } from './CadastrosView';

export default function CadastrosContainer() {
    const pageProps = useCadastrosPage();
    return <CadastrosView {...pageProps} />;
}
