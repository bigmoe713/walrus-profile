module walrus_profile::registry {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table::{Self, Table};
    use std::string::{Self, String};

    struct Registry has key {
        id: UID,
        name: String,
        profiles: Table<address, UID>
    }

    public entry fun create_registry(ctx: &mut TxContext) {
        let registry = Registry {
            id: object::new(ctx),
            name: string::utf8(b"walrus-profile"),
            profiles: table::new(ctx)
        };
        transfer::share_object(registry)
    }
}