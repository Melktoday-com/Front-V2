export enum RoleName {
    User = 'user',
    Admin = 'admin',
    SuperAdmin = 'super-admin',
    Agent = 'agent',
    Landlord = 'landlord',
}

export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
    [RoleName.User]: [
        'read_profile',
        'update_profile',
        'read_properties',
        'create_property_inquiry',
        'read_tenant_dashboard',
    ],
    [RoleName.Admin]: [
        'read_profile',
        'update_profile',
        'read_properties',
        'create_property_inquiry',
        'read_users',
        'manage_users',
        'manage_roles',
        'read_reports',
    ],
    [RoleName.SuperAdmin]: [
        'read_profile',
        'update_profile',
        'read_properties',
        'create_property_inquiry',
        'read_users',
        'manage_users',
        'manage_roles',
        'read_reports',
        'manage_system',
        'manage_config',
    ],
    [RoleName.Agent]: [
        'read_profile',
        'update_profile',
        'read_properties',
        'create_property',
        'update_property',
        'create_property_inquiry',
        'read_agent_dashboard',
    ],
    [RoleName.Landlord]: [
        'read_profile',
        'update_profile',
        'read_properties',
        'create_property',
        'update_property',
        'read_landlord_dashboard',
    ],
};

export type Permission =
    | 'read_profile'
    | 'update_profile'
    | 'read_properties'
    | 'create_property'
    | 'update_property'
    | 'create_property_inquiry'
    | 'read_tenant_dashboard'
    | 'read_agent_dashboard'
    | 'read_landlord_dashboard'
    | 'read_users'
    | 'manage_users'
    | 'manage_roles'
    | 'read_reports'
    | 'manage_system'
    | 'manage_config';
