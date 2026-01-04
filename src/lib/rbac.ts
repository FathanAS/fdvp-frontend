export type Role = 'owner' | 'administrator' | 'superadmin' | 'admin' | 'staff' | 'user';

const ROLE_HIERARCHY: Record<string, number> = {
    'owner': 100,
    'administrator': 80,
    'superadmin': 60,
    'admin': 60, // Treating legacy 'admin' as equivalent to superadmin for now
    'staff': 40,
    'user': 20
};

export const getRoleLevel = (role: string): number => {
    return ROLE_HIERARCHY[role.toLowerCase()] || 0; // Default to 0 (lowest)
};

/**
 * Determines if an actor can modify a user's role.
 * 
 * Rules:
 * 1. Actor must have a higher level than the target's current level.
 * 2. Actor must have a higher level than the new role level (cannot promote to equal/higher).
 * 3. Staff (level 40) and below strictly cannot modify roles.
 */
export const canModifyRole = (actorRole: string, targetRole: string, newRole: string): boolean => {
    const actorLevel = getRoleLevel(actorRole);
    const targetLevel = getRoleLevel(targetRole);
    const newLevel = getRoleLevel(newRole);

    // Rule: Staff and below cannot modify roles
    if (actorLevel <= 40) return false;

    // Rule: Actor must be higher than target
    if (actorLevel <= targetLevel) return false;

    // Rule: Actor must be higher than the new role being assigned
    // (e.g. Administrator (80) cannot promote someone to Administrator (80) or Owner (100))
    if (actorLevel <= newLevel) return false;

    return true;
};

export const canDeleteUser = (actorRole: string, targetRole: string): boolean => {
    const actorLevel = getRoleLevel(actorRole);
    const targetLevel = getRoleLevel(targetRole);

    // Rule 1: Allow strictly strictly higher level (cannot delete equal or higher)
    // AND Must be at least Superadmin level (60) to delete anyone? 
    // "role superadmin,administrator,owner berhak menghapus user"
    if (actorLevel < 60) return false;

    // Rule 2: Cannot delete Owner (Level 100) or higher/equal
    if (targetLevel >= 100) return false; // Hard protect owner
    if (actorLevel <= targetLevel) return false;

    return true;
};

export const getAvailableRolesForActor = (actorRole: string): string[] => {
    const actorLevel = getRoleLevel(actorRole);
    const allRoles = ['user', 'staff', 'superadmin', 'administrator', 'owner'];

    // Filter roles that are strictly lower than actor
    return allRoles.filter(r => getRoleLevel(r) < actorLevel);
};
