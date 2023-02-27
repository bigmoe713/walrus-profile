import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () =>
{
    useEffect(() => {
        document.title = 'Polymedia Profile - Home';
    }, []);

    return <div id='page' className='page-about'>
        <h1>
            HOME
        </h1>
        <p>
            Polymedia Profile is the on-chain profile/identity system that is used in all our apps, such as <a href='https://chat.polymedia.app/@sui-fans' target='_blank'>Polymedia Chat</a>.
            <br/>
            <br/>
            Soon we will release a JavaScript SDK to make it easy for others to integrate Polymedia Profile into their own projects.
        </p>
        <Link to='/manage' className='btn'>MANAGE PROFILE</Link>
    </div>;
}
