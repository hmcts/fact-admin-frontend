# App infrastructure

This folder only provisions Redis and stores its connection details in an existing Key Vault.

Defaults:
* Key Vault name: `<product>-kv-<env>`
* Key Vault resource group: `<product>-<env>-rg`
* Network: `cft-<env>-vnet` / subnet `iaas`
* Zone redundancy: enabled in prod (zones 1-3)

Override any of these via `key_vault_name`, `key_vault_resource_group_name`, `network_prefix`, or `subnet_name`.
