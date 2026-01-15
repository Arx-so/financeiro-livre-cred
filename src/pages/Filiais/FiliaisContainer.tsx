import { useFiliaisPage } from './useFiliaisPage';
import { FiliaisView } from './FiliaisView';

export default function FiliaisContainer() {
    const pageProps = useFiliaisPage();
    return <FiliaisView {...pageProps} />;
}
