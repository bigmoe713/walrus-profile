// TODO: split large batches into 50 lookup addresses per request
// TODO: store in local storage for fast initial load, then replace with 1st request
// TODO: noCache option

import { BCS, getSuiMoveConfig } from '@mysten/bcs';
import {
    GetObjectDataResponse,
    JsonRpcProvider,
    MoveCallTransaction,
    Network,
    OwnedObjectRef,
    SignableTransaction,
    SuiMoveObject,
    SuiObject,
    TransactionEffects,
    UnserializedSignableTransaction,
} from '@mysten/sui.js';

const RPC_DEVNET = new JsonRpcProvider(Network.DEVNET);
export const POLYMEDIA_PROFILE_PACKAGE_ID_DEVNET = '0x1f836d19359a04a385ecf801dcbcc7c40a627c05';
export const POLYMEDIA_PROFILE_REGISTRY_ID_DEVNET = '0xb57d6fd470865b014b8de6ea9b6b95e2c185393a';

const RPC_TESTNET = new JsonRpcProvider('https://fullnode.testnet.sui.io:443');
export const POLYMEDIA_PROFILE_PACKAGE_ID_TESTNET = '0x123';
export const POLYMEDIA_PROFILE_REGISTRY_ID_TESTNET = '0x123';

export type PolymediaProfile = {
    id: string,
    name: string,
    image: string,
    description: string,
    owner: string,
    suiObject: SuiObject,
}

type WalletArg = {
    signAndExecuteTransaction: (transaction: SignableTransaction) => Promise<any>,
}

export class ProfileManager {
    private cache: Map<string, PolymediaProfile|null> = new Map();
    private rpc: JsonRpcProvider;
    private packageId: string;
    private registryId: string;

    constructor(network: string, packageId?: string, registryId?: string) {
        if (network === 'devnet') {
            this.rpc = RPC_DEVNET;
            this.packageId = packageId || POLYMEDIA_PROFILE_PACKAGE_ID_DEVNET;
            this.registryId = registryId || POLYMEDIA_PROFILE_REGISTRY_ID_DEVNET;
        } else if (network === 'testnet') {
            this.rpc = RPC_TESTNET;
            this.packageId = packageId || POLYMEDIA_PROFILE_PACKAGE_ID_TESTNET;
            this.registryId = registryId || POLYMEDIA_PROFILE_REGISTRY_ID_TESTNET;
        } else {
            throw new Error('Network not recognized: ' + network);
        }
    }

    public getPackageId(): string { return this.packageId; }
    public getRegistryId(): string { return this.registryId; }

    public async getProfiles(lookupAddresses: Iterable<string>): Promise<Map<string, PolymediaProfile>> {
        const result = new Map<string, PolymediaProfile>();
        const newLookupAddresses = new Set<string>(); // unseen addresses (i.e. not cached)

        // Check if addresses are already in cache and add them to the returned map
        for (const addr of lookupAddresses) {
            if (this.cache.has(addr)) {
                const cachedProfile = this.cache.get(addr);
                if (cachedProfile) {
                    result.set(addr, cachedProfile);
                }
            } else { // address not seen before so we need to look it up
                newLookupAddresses.add(addr);
            }
        }
        if (newLookupAddresses.size === 0) return result;

        // Find the remaining profile object IDs
        const newObjectIds = await this.findProfileObjectIds({
            lookupAddresses: [...newLookupAddresses]
        });

        // Add missing addresses to the cache
        for (const addr of newLookupAddresses) {
            if (!newObjectIds.has(addr)) {
                this.cache.set(addr, null);
            }
        }
        if (newObjectIds.size === 0) return result;

        // Retrieve the remaining profile objects
        const profileObjects = await this.getProfileObjects({
            objectIds: [...newObjectIds.values()]
        });

        // Add the remaining profile objects to the returned map and cache
        for (const profile of profileObjects) {
            result.set(profile.owner, profile);
            this.cache.set(profile.owner, profile);
        }

        return result;
    }

    public findProfileObjectIds({ lookupAddresses }: {
        lookupAddresses: string[]
    }): Promise<Map<string,string>>
    {
        return findProfileObjectIds({
            rpc: this.rpc,
            packageId: this.packageId,
            registryId: this.registryId,
            lookupAddresses,
        });
    }

    public getProfileObjects({ objectIds }: {
        objectIds: string[]
    }): Promise<PolymediaProfile[]>
    {
        return getProfileObjects({
            rpc: this.rpc,
            objectIds,
        });
    }

    public createRegistry({ wallet, registryName }: {
        wallet: WalletArg,
        registryName: string,
    }): Promise<OwnedObjectRef>
    {
        return createRegistry({
            wallet,
            packageId: this.packageId,
            registryName,
        });
    }

    public createProfile({ wallet, name, image='', description='' }: {
        wallet: WalletArg,
        name: string,
        image?: string,
        description?: string,
    }): Promise<(SuiObject|null)[]>
    {
        return createProfile({
            rpc: this.rpc,
            wallet,
            packageId: this.packageId,
            registryId: this.registryId,
            name,
            image,
            description,
        });
    }
}

function getObjects({ rpc, objectIds }: {
    rpc: JsonRpcProvider,
    objectIds: string[],
}): Promise<SuiObject[]>
{
    return rpc.getObjectBatch(
        objectIds
    ).then((objDataResps: GetObjectDataResponse[]) => {
        const suiObjects: SuiObject[] = [];
        for (const obj of objDataResps)
            if (obj.status == 'Exists')
                suiObjects.push(obj.details as SuiObject);
        return suiObjects;
    });
}

const bcs = new BCS( getSuiMoveConfig() );
function findProfileObjectIds({
    rpc,
    packageId,
    registryId,
    lookupAddresses,
}: {
    rpc: JsonRpcProvider,
    packageId: string,
    registryId: string,
    lookupAddresses: string[],
}): Promise<Map<string,string>>
{
    lookupAddresses = [...new Set(lookupAddresses)]; // deduplicate
    const callerAddress = '0x7777777777777777777777777777777777777777';

    const signableTxn = {
        kind: 'moveCall',
        data: {
            packageObjectId: packageId,
            module: 'profile',
            function: 'get_profiles',
            typeArguments: [],
            arguments: [
                registryId,
                lookupAddresses,
            ],
        } as MoveCallTransaction,
    } as UnserializedSignableTransaction;

    return rpc.devInspectTransaction(callerAddress, signableTxn)
    .then((resp: any) => {
        //                  Sui/Ethos || Suiet
        const effects = (resp.effects || resp.EffectsCert?.effects?.effects) as TransactionEffects;
        if (effects.status.status == 'success') {
            // Deserialize the returned value into an array of addresses
            const returnValue: any[] = resp.results.Ok[0][1].returnValues[0]; // grab the 1st and only tuple
            const valueType: string = returnValue[1];
            const valueData = Uint8Array.from(returnValue[0]);
            const profileAddreses: string[] = bcs.de(valueType, valueData, 'hex');

            // Create a Map where the keys are lookupAddresses and the values are profileAddreses
            const notFoundAddress = '0000000000000000000000000000000000000000';
            const length = lookupAddresses.length; // same as profileAddreses.length
            const result = new Map<string, string>();
            for(let i = 0; i < length; i++) {
                const lookupAddr = lookupAddresses[i];
                const profileAddr = profileAddreses[i];
                if (profileAddr != notFoundAddress) {
                    result.set(lookupAddr, profileAddr);
                }
            }
            return result;
        } else {
            throw new Error(effects.status.error);
        }
    })
    .catch((error: any) => {
        throw error;
    });
}

function getProfileObjects({ rpc, objectIds }: {
    rpc: JsonRpcProvider,
    objectIds: string[],
}): Promise<PolymediaProfile[]>
{
    return getObjects({
        rpc, objectIds
    })
    .then((objects: SuiObject[]) => {
        const profiles: PolymediaProfile[] = [];
        for (const obj of objects) {
            const objData = obj.data as SuiMoveObject;
            const objOwner = obj.owner as { AddressOwner: string };
            profiles.push({
                id: objData.fields.id.id,
                name: objData.fields.name,
                image: objData.fields.image,
                description: objData.fields.description,
                owner: objOwner.AddressOwner,
                suiObject: obj,
            });
        }
        return profiles;
    })
    .catch((error: any) => {
        throw error;
    });
}

function createRegistry({
    wallet,
    packageId,
    registryName,
} : {
    wallet: WalletArg,
    packageId: string,
    registryName: string,
}): Promise<OwnedObjectRef>
{
    return wallet.signAndExecuteTransaction({
        kind: 'moveCall',
        data: {
            packageObjectId: packageId,
            module: 'profile',
            function: 'create_registry',
            typeArguments: [],
            arguments: [
                registryName,
            ],
            gasBudget: 1000,
        }
    })
    .then((resp: any) => {
        //                  Sui/Ethos || Suiet
        const effects = (resp.effects || resp.EffectsCert?.effects?.effects) as TransactionEffects;
        if (effects.status.status == 'success') {
            if (effects.created?.length === 1) {
                return effects.created[0] as OwnedObjectRef;
            } else {
                throw new Error("transaction was successful, but new object is missing. Response: "
                    + JSON.stringify(resp));
            }
        } else {
            throw new Error(effects.status.error);
        }
    })
    .catch((error: any) => {
        throw error;
    });
}

async function createProfile({
    rpc,
    wallet,
    packageId,
    registryId,
    name,
    image = '',
    description = '',
} : {
    rpc: JsonRpcProvider,
    wallet: WalletArg,
    packageId: string,
    registryId: string,
    name: string,
    image?: string,
    description?: string,
}): Promise<(SuiObject|null)[]>
{
    // Creates 2 objects: the profile (owned by the caller) and a dynamic field (inside the registry's table)
    const resp = await wallet.signAndExecuteTransaction({
        kind: 'moveCall',
        data: {
            packageObjectId: packageId,
            module: 'profile',
            function: 'create_profile',
            typeArguments: [],
            arguments: [
                registryId,
                name,
                image,
                description,
            ],
            gasBudget: 1000,
        }
    });

    // Verify the transaction results
    const effects = (resp.effects || resp.EffectsCert?.effects?.effects) as TransactionEffects; // Sui/Ethos || Suiet
    if (effects.status.status !== 'success') {
        throw new Error(effects.status.error);
    }
    if (effects.created?.length !== 2) {
        throw new Error("transaction was successful, but object count is off. Response: " + JSON.stringify(resp));
    }

    // Fetch and return both objects
    const createdIds = effects.created.map((suiObj: any) => suiObj.reference.objectId);
    const suiObjects: SuiObject[] = await getObjects({rpc, objectIds: createdIds});
    let profileObj = null;
    let dynamicFieldObj = null;
    for (const suiObj of suiObjects) {
        const objType = (suiObj.data as SuiMoveObject).type;
        if (objType.endsWith('::profile::Profile')) {
            profileObj = suiObj;
        } else
        if (objType.includes('::dynamic_field::Field')) {
            dynamicFieldObj = suiObj;
        }
    }
    return [ // TODO: just return profileObj as a PolymediaProfile
        profileObj, // polymedia_profile::profile::Profile
        dynamicFieldObj, // sui::dynamic_field::Field
    ];
}
