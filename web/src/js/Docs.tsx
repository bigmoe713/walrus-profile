import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { linkToExplorer } from '@polymedia/webutils';

import { AppContext } from './App';

export const Docs: React.FC = () =>
{
    useEffect(() => {
        document.title = 'Polymedia Profile - Docs';
    }, []);

    const { network, profileManager } = useOutletContext<AppContext>();

    return <div id='page' className='page-about'>
        <h1>
            DOCS
        </h1>
        <p>
            Polymedia Profile is a fully on-chain profile/identity system on the Sui Network.
            <br/>
            <br/>
            Key facts about Polymedia Profile:
        </p>

        <ol>
            <li>Profiles are <b>free</b> to use and there is no cost associated with registering one (aside from network fees).</li>

            <li>A <i>Profile</i> object is permanently attached to the Sui address that created it. Profiles are <b>not transferable</b>.</li>

            <li>Profile properties are <b>not unique</b>. Want to use "John" as your name? No problem!</li>

            <li>Profiles are always included in at least one <i>Registry</i> object. A Sui address may own multiple profiles, but can only add one <i>Profile</i> to each <i>Registry</i>.</li>

            <li>The default registry is called <i><a href={linkToExplorer(network, 'object', profileManager.registryId)} target='_blank' rel='noopener'>polymedia-main</a></i>, and is used by all our apps. <b>Anyone</b> can create a new registry.</li>

            <li>Profiles can be used <b>anywhere</b> on Sui. There is a <a href='https://www.npmjs.com/package/@polymedia/profile-sdk' target='_blank' rel='noopener'>TypeScript SDK</a> to facilitate 3rd party integrations.</li>
        </ol>

        <p>
            Polymedia Profile is fully <b>open-source</b>. Code and technical docs:
        </p>
        <ul>
            <li><a href='https://github.com/juzybits/polymedia-profile/tree/main/sui' target='_blank' rel='noopener'>Sui Move code</a></li>

            <li><a href='https://github.com/juzybits/polymedia-profile/tree/main/sdk' target='_blank' rel='noopener'>TypeScript SDK</a></li>

            <li><a href='https://github.com/juzybits/polymedia-profile/tree/main/web' target='_blank' rel='noopener'>Web interface</a></li>
        </ul>

        <p>
            Follow <a href='https://twitter.com/intent/follow?screen_name=polymedia_app' target='_blank' rel='noopener'>@polymedia_app</a> on Twitter or join our <a href='https://discord.gg/3ZaE69Eq78' target='_blank' rel='noopener'>Discord</a> to stay up to date.
            <br/>
            <br/>
        </p>

    </div>;
}
