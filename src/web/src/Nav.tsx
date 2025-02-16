import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { PolymediaProfile } from "@polymedia/profile-sdk";
import { NetworkName, shortenSuiAddress } from "@polymedia/suitcase-core";
import { NetworkSelector, isLocalhost } from "@polymedia/suitcase-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { supportedNetworks } from "./App";
import "./styles/Nav.less";

export const Nav: React.FC<{
    network: NetworkName;
    openConnectModal: () => void;
    profile: PolymediaProfile|null|undefined;
}> = ({
    network,
    openConnectModal,
    profile,
}) =>
{
    const currentAccount = useCurrentAccount();

    const [showMobileNav, setShowMobileNav] = useState(false);
    const toggleMobileNav = () => { setShowMobileNav(!showMobileNav); };
    const closeMobileNav  = () => { setShowMobileNav(false); };
    const showNetworkSelector = isLocalhost();

    return <header id="nav">
        <div id="mobile-menu-btn-wrap" onClick={toggleMobileNav}>
            <span id="mobile-menu-btn">☰</span>
        </div>

        <div id="nav-logo" className="nav-section">
            <Link to="/" id="nav-logo-link" onClick={closeMobileNav}>
            <img id="nav-logo-img" src="/img/background_bloblife.png" alt="Bloblife logo" />
                <span id="nav-logo-txt">
                    <span id="nav-title-polymedia">WALRUS</span>
                    <span id="nav-title-profile">PROFILE</span>
                </span>
            </Link>
        </div>

        <div id="nav-sections-wrap" className={showMobileNav ? "open" : ""}>
            <div id="nav-user" className="nav-section">
            {
                !currentAccount
                ?
                <span id="nav-btn-connect" onClick={openConnectModal}>
                    LOG IN
                </span>
                :
                <NavProfile profile={profile} />
            }
            {showNetworkSelector && <NetworkSelector currentNetwork={network} supportedNetworks={supportedNetworks} />}
            </div>

            <div id="nav-pages" className="nav-section">
                <div className="nav-page-link">
                    <Link to="/" onClick={closeMobileNav}>HOME</Link>
                </div>
                <div className="nav-page-link">
                    <Link to="/manage" onClick={closeMobileNav}>PROFILE</Link>
                </div>
                <div className="nav-page-link">
                    <Link to="/search" onClick={closeMobileNav}>SEARCH</Link>
                </div>
               
                {/*<div className='nav-page-link'>
                    <Link to='/profile/new' onClick={closeMobileNav}>New Profile</Link>
                </div>
                <div className='nav-page-link'>
                    <Link to='/registry/new' onClick={closeMobileNav}>New Registry</Link>
                </div>*/}
            </div>

            <div id="nav-socials" className="nav-section">
                <div className="nav-social-link">
                    <a href="https://bloblife.xyz" target="_blank" rel="noopener noreferrer">Website</a>
                </div>
                <div className="nav-social-link">
                    <a href="https://x.com/BlobLifeLabs" target="_blank" rel="noopener noreferrer">Twitter</a>
                </div>
               
            </div>

            <div id="nav-watermark" className="nav-section">
                <div className="nav-social-link">
                    <a href="https://x.com/BlobLifeLabs" target="_blank" rel="noopener noreferrer">BlobLifeLabs {new Date().getFullYear()}</a>
                </div>
            </div>
        </div>

    </header>;
};

const NavProfile: React.FC<{
    profile: PolymediaProfile|null|undefined;
}> = ({profile}) =>
{
    const currentAccount = useCurrentAccount();
    const { mutate: disconnect } = useDisconnectWallet();

    if (!currentAccount) {
        return <></>;
    }

    if (profile === undefined) {
        return <>Loading...</>;
    }

    return <div id="nav-profile" onClick={() => { disconnect(); }}>
        <div id="nav-profile-image-wrap">
            <img src={(profile?.imageUrl) || "/img/anon.webp"} />
        </div>
        <div id="nav-profile-name-wrap">
            <div id="nav-profile-name">{ profile ? profile.name : "Anon" }</div>
            <div id="nav-profile-address">{shortenSuiAddress(currentAccount.address)}</div>
        </div>
    </div>;
};
