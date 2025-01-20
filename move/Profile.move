module profile::registry {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};

    struct Profile has key, store {
        id: UID,
        name: String,
        bio: String,
        avatar_url: String
    }

    struct Registry has key {
        id: UID
    }

    fun init(ctx: &mut TxContext) {
        transfer::share_object(Registry {
            id: object::new(ctx)
        })
    }

    public entry fun create_profile(
        _registry: &Registry,
        name: vector<u8>,
        bio: vector<u8>,
        avatar_url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let profile = Profile {
            id: object::new(ctx),
            name: string::utf8(name),
            bio: string::utf8(bio),
            avatar_url: string::utf8(avatar_url)
        };
        transfer::transfer(profile, tx_context::sender(ctx))
    }
}