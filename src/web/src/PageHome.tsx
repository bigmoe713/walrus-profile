import { makePolymediaUrl } from "@polymedia/suitcase-core";
import { useEffect } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { AppContext } from "./App";

export const PageHome: React.FC = () =>
{
    useEffect(() => {
        document.title = "Walrus Profile - Home";
    }, []);

    const { network, profileClient } = useOutletContext<AppContext>();

    return <div id="page" className="page-home">
        <h1>
            HOME
        </h1>
        <p>
            Walrus Profile is a fully on-chain profile system on <a href="https://sui.io" target="_blank" rel="noopener noreferrer">Sui</a>  - with the default registry being stored on Walrus Protocol. It lets users attach a profile (name, picture, etc) to their Sui address. 
            <br/>
            <br/>

            This web app lets users manage their profiles on the default registry, called <i><a href="https://sui.io" target="_blank" rel="noopener noreferrer">profile-main</a></i>.
            <br/>
            <br/>
            The code will be fully open-source, and there will be a TypeScript SDK to facilitate 3rd party integrations.
        </p>
        <Link to="/manage" className="btn" style={{marginRight: "0.5em"}}>MANAGE PROFILE</Link>
        
    </div>;
};
